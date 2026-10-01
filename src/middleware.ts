import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { EMBEDDED_SESSION_PREFIX, bearerToken, verifyShopifySessionToken } from "@/lib/embedded";

const isAppPage = (p: string) => p.startsWith("/dashboard") || p.startsWith("/welcome");

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Env-var direct token mode (local dev override)
  if (process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_STORE) {
    return NextResponse.next();
  }

  // Opened from the Shopify admin on the site root (App URL = "/") → embedded landing.
  if (pathname === "/" && searchParams.get("shop") && (searchParams.get("host") || searchParams.get("id_token"))) {
    return NextResponse.redirect(new URL(`/embedded${req.nextUrl.search}`, req.url));
  }

  // Inside the Shopify admin: a valid session token (App Bridge sends it on every fetch; the
  // admin puts it in the URL of each iframe load) becomes the request's session + shop cookies,
  // so every route resolves the store exactly as for a logged-in website user.
  const idToken = bearerToken(req.headers.get("authorization")) ?? searchParams.get("id_token");
  if (idToken) {
    const claims = await verifyShopifySessionToken(idToken);
    if (claims) {
      req.cookies.set(SESSION_COOKIE, `${EMBEDDED_SESSION_PREFIX}${idToken}`);
      req.cookies.set("shopify_shop", claims.shop);
      const res = NextResponse.next({ request: { headers: new Headers(req.headers) } });
      if (isAppPage(pathname)) {
        res.headers.set("Content-Security-Policy", `frame-ancestors https://${claims.shop} https://admin.shopify.com;`);
      }
      return res;
    }
  }

  if (!isAppPage(pathname)) return NextResponse.next();

  // A page load inside the admin iframe without a token (e.g. a full reload). Pages are client
  // shells that fetch everything through the API — App Bridge authenticates those calls.
  if (req.headers.get("sec-fetch-dest") === "iframe") return NextResponse.next();

  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/welcome/:path*", "/welcome", "/api/:path*"],
};
