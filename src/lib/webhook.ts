import crypto from "crypto";

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const secret = process.env.SHOPIFY_CLIENT_SECRET!;
  const hash = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}
