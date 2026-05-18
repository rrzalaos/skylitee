import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/webhook";
import { shopKv } from "@/lib/kv";

// Shopify GDPR: merchant uninstalled the app 48 days ago.
// Delete all stored tokens and settings for this shop from KV.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as { shop_domain?: string };
    const shop = payload.shop_domain;
    if (shop) await shopKv.delAllShopData(shop);
  } catch { /* invalid JSON — still return 200 to Shopify */ }

  return NextResponse.json({ ok: true }, { status: 200 });
}
