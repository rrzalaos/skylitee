import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/webhook";
import { shopKv } from "@/lib/kv";

// Catch-all GDPR compliance endpoint — handles all 3 webhook types.
// Shopify sends the topic in the X-Shopify-Topic header.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic") ?? "";

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (topic === "shop/redact") {
    try {
      const payload = JSON.parse(rawBody) as { shop_domain?: string };
      if (payload.shop_domain) await shopKv.delAllShopData(payload.shop_domain);
    } catch { /* ignore parse errors */ }
  }

  // customers/data_request and customers/redact — we hold no PII, ack only
  return NextResponse.json({ ok: true }, { status: 200 });
}
