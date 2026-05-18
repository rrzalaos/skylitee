import { NextRequest, NextResponse } from "next/server";
import { verifyShopifyWebhook } from "@/lib/webhook";

// Shopify GDPR: merchant's customer requests deletion of their data.
// We don't store customer PII — all customer data lives in Shopify.
// Acknowledge with 200; nothing to delete on our end.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
