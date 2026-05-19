import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/shopify";
import { shopKv } from "@/lib/kv";
import { getSession, addShopToUser, updateSessionShop, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("shopify_state")?.value;

  if (!code || !shop || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/connect?error=1", req.url));
  }

  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    await shopKv.setToken(shop, accessToken);

    // Link shop to user account if session exists
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (sessionToken) {
      const session = await getSession(sessionToken);
      if (session?.email) {
        await addShopToUser(session.email, shop);
        await updateSessionShop(sessionToken, shop);
      }
    }

    const existingPlan = await shopKv.getPlan(shop);
    const destination = existingPlan ? "/dashboard" : "/dashboard/pricing";

    const res = NextResponse.redirect(new URL(destination, req.url));
    const cookieOpts = { httpOnly: true, maxAge: SESSION_MAX_AGE, sameSite: "lax" as const, path: "/" };
    res.cookies.set("shopify_shop", shop, cookieOpts);
    res.cookies.delete("shopify_token");
    res.cookies.delete("shopify_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/connect?error=2", req.url));
  }
}
