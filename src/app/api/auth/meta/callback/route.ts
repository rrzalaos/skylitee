import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { getShopFromRequest } from "@/lib/session";

const APP_URL = "https://skylitee.vercel.app";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/connections?meta_error=denied`);
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${APP_URL}/api/auth/meta/callback`;

  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );
  const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${APP_URL}/dashboard/connections?meta_error=token`);
  }

  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  );
  const longData = await longRes.json() as { access_token?: string };
  const finalToken = longData.access_token ?? tokenData.access_token;

  const shop = getShopFromRequest(req) ?? "unknown";
  await shopKv.setMetaToken(shop, finalToken);

  const response = NextResponse.redirect(`${APP_URL}/dashboard/connections`);
  response.cookies.set("meta_token", finalToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 55,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
