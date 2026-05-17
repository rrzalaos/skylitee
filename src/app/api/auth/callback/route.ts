import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/shopify";

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
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    const cookieOpts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
    res.cookies.set("shopify_token", accessToken, cookieOpts);
    res.cookies.set("shopify_shop", shop, cookieOpts);
    res.cookies.delete("shopify_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/install?error=2", req.url));
  }
}
