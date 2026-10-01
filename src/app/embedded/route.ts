import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { getAccessState } from "@/lib/access";
import { isOnboardingPending } from "@/lib/onboarding";
import { takeEmbeddedReturn } from "@/lib/embedded-server";
import { embeddedModeOn, isValidShopDomain, shopAdminAppUrl, verifyShopifySessionToken } from "@/lib/embedded";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.io";

// Embedded landing — the App URL Shopify opens inside the admin (also reached from "/" and
// /api/auth when they carry admin params). Not installed yet → OAuth (top-level). Installed →
// the right page, keeping the admin's params so the first load is authenticated.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const idToken = params.get("id_token");
  const claims = idToken ? await verifyShopifySessionToken(idToken) : null;
  const shop = claims?.shop ?? params.get("shop");
  if (!isValidShopDomain(shop)) return NextResponse.redirect(new URL("/install", req.url));

  const installed = !!(await shopKv.getTokenRecord(shop));
  const oauthUrl = `${APP_URL}/api/auth?shop=${encodeURIComponent(shop)}&from=admin`;

  // Opened top-level (no session token) — e.g. right after install, or embedding not switched on.
  if (!claims) {
    if (!installed) return NextResponse.redirect(oauthUrl);
    return NextResponse.redirect(embeddedModeOn() ? shopAdminAppUrl(shop) : new URL("/dashboard", req.url));
  }

  // Inside the admin but not installed (fresh install / reinstall): OAuth can't run in the
  // iframe, so App Bridge sends the top window there.
  if (!installed) return exitIframe(oauthUrl);

  if (!(await shopKv.getConnectedAt(shop))) await shopKv.setConnectedAt(shop, new Date().toISOString());

  const dest = (await takeEmbeddedReturn(shop))
    ?? ((await isOnboardingPending(shop)) ? "/welcome"
      : (await getAccessState(shop)).hasAccess ? "/dashboard" : "/dashboard/pricing");

  const url = new URL(dest, req.url);
  for (const k of ["shop", "host", "embedded", "id_token", "locale"]) {
    const v = params.get(k);
    if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

function exitIframe(target: string): NextResponse {
  const apiKey = process.env.SHOPIFY_CLIENT_ID ?? "";
  const html = `<!doctype html><html><head>
<meta name="shopify-api-key" content="${apiKey}">
<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
</head><body><script>window.open(${JSON.stringify(target)}, "_top");</script></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
