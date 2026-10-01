import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/google";
import { shopKv } from "@/lib/kv";
import { requireShopPermission } from "@/lib/session";
import { markOnce } from "@/lib/funnel";
import { backToAdmin, getEmbeddedOAuthShop } from "@/lib/embedded-server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("google_state")?.value;
  // Started inside the Shopify admin → store from the signed handoff cookie, return to the admin.
  const embeddedShop = await getEmbeddedOAuthShop(req);
  const back = async (path: string) =>
    embeddedShop ? backToAdmin(embeddedShop, path) : NextResponse.redirect(new URL(path, req.url));

  if (!code || !state || state !== storedState) {
    return back("/dashboard/connections?error=google");
  }

  // State format: "{nonce}|{service}" — service is "gsc", "ga4", or "both"
  const service = state.split("|")[1] ?? "both";
  let shop: string;
  if (embeddedShop) {
    shop = embeddedShop;
  } else {
    const perm = await requireShopPermission(req, "connections");
    if (!perm.ok) return back("/dashboard/connections?error=view_only");
    shop = perm.shop;
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) {
      return back("/dashboard/connections?error=no_refresh_token");
    }

    const res = await back(`/dashboard/connections?connected=${service}`);
    const cookieOpts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
    // Legacy token cookies are for website sessions only.
    const setCookie = (name: string, value: string) => { if (!embeddedShop) res.cookies.set(name, value, cookieOpts); };

    if (service === "gsc") {
      await shopKv.setGscToken(shop, tokens.refresh_token);
      setCookie("google_gsc_token", tokens.refresh_token);
    } else if (service === "ga4") {
      await shopKv.setGa4Token(shop, tokens.refresh_token);
      setCookie("google_ga4_token", tokens.refresh_token);
    } else if (service === "gads") {
      await shopKv.setGadsToken(shop, tokens.refresh_token);
    } else {
      // "both" — legacy path
      await shopKv.setGscToken(shop, tokens.refresh_token);
      await shopKv.setGa4Token(shop, tokens.refresh_token);
      setCookie("google_refresh_token", tokens.refresh_token);
    }

    await markOnce(shop, "googleAt");
    res.cookies.delete("google_state");
    return res;
  } catch {
    return back("/dashboard/connections?error=google_failed");
  }
}
