import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { requireShopPermission } from "@/lib/session";
import { markOnce } from "@/lib/funnel";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.vercel.app";
const META_RETURN_COOKIE = "meta_return";   // set in ../route.ts when connect starts from /welcome

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const toWelcome = req.cookies.get(META_RETURN_COOKIE)?.value === "welcome";

  // Onboarding merchants go back to /welcome; everyone else keeps the Connections page.
  const back = (query: string) => {
    const res = NextResponse.redirect(toWelcome
      ? `${APP_URL}/welcome${query ? `?${query}` : ""}`
      : `${APP_URL}/dashboard/connections${query ? `?${query}` : ""}`);
    if (toWelcome) res.cookies.delete(META_RETURN_COOKIE);
    return res;
  };

  if (error || !code) return back("meta_error=denied");

  const perm = await requireShopPermission(req, "connections");
  if (!perm.ok) return back("meta_error=view_only");
  const shop = perm.shop;

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${APP_URL}/api/auth/meta/callback`;

  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );
  const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

  if (!tokenData.access_token) return back("meta_error=token");

  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  );
  const longData = await longRes.json() as { access_token?: string };
  const finalToken = longData.access_token ?? tokenData.access_token;

  await shopKv.setMetaToken(shop, finalToken);
  await markOnce(shop, "metaAt");

  const response = back(toWelcome ? "connected=meta" : "");
  response.cookies.set("meta_token", finalToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 55,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
