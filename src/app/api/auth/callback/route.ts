import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/shopify";
import { shopKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("shopify_state")?.value;

  if (!code || !shop || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/install?error=1", req.url));
  }

  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    await shopKv.setToken(shop, accessToken);

    // New installs (no plan yet) go to pricing; returning merchants go to dashboard
    const existingPlan = await shopKv.getPlan(shop);
    const destination = existingPlan ? "/dashboard" : "/dashboard/pricing";

    const res = NextResponse.redirect(new URL(destination, req.url));
    const cookieOpts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
    res.cookies.set("shopify_shop", shop, cookieOpts);
    res.cookies.delete("shopify_token");
    res.cookies.delete("shopify_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/install?error=2", req.url));
  }
}
