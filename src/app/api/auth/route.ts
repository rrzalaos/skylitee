import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/shopify";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.redirect(new URL("/install", req.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = buildAuthUrl(shop, state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("shopify_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax" });
  return res;
}
