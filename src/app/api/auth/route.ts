import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/shopify";
import { INSTALL_FROM_ADMIN_COOKIE } from "@/lib/embedded-server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.redirect(new URL("/install", req.url));
  }

  // Opened inside the Shopify admin (App URL = /api/auth) → embedded landing decides.
  if (req.nextUrl.searchParams.get("id_token")) {
    return NextResponse.redirect(new URL(`/embedded${req.nextUrl.search}`, req.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = buildAuthUrl(shop, state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("shopify_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax" });
  // Started from the admin → the callback returns there instead of the website.
  if (req.nextUrl.searchParams.get("from") === "admin") {
    res.cookies.set(INSTALL_FROM_ADMIN_COOKIE, "1", { httpOnly: true, maxAge: 600, sameSite: "lax", path: "/" });
  }
  return res;
}
