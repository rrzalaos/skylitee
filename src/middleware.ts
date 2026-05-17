import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("shopify_token")?.value;
  const shop = req.cookies.get("shopify_shop")?.value;

  if (pathname.startsWith("/dashboard") && (!token || !shop)) {
    return NextResponse.redirect(new URL("/install", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
