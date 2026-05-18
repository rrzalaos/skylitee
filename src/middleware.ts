import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // If env-var token is set, always allow dashboard access (direct token mode)
  if (process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_STORE) {
    return NextResponse.next();
  }

  const shop = req.cookies.get("shopify_shop")?.value;

  if (pathname.startsWith("/dashboard") && !shop) {
    return NextResponse.redirect(new URL("/install", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
