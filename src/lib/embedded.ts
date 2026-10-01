// Embedded app (Skylitee inside the Shopify admin) — shared helpers.
// EDGE-SAFE: imported by middleware, so only Web APIs here (no Node crypto, no KV).
//
// Inside the admin iframe our first-party cookies aren't sent, so a merchant is identified by
// Shopify's session token (a short-lived HS256 JWT signed with our app secret). App Bridge adds
// it to every same-origin fetch as `Authorization: Bearer <token>`; middleware verifies it and
// injects `skylitee_session=sid.<token>` + `shopify_shop` so every existing route works unchanged.

export const EMBEDDED_SESSION_PREFIX = "sid.";

const LEEWAY_S = 10;
const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export function isValidShopDomain(shop: string | null | undefined): shop is string {
  return !!shop && SHOP_RE.test(shop);
}

export function isEmbeddedSessionToken(token: string | null | undefined): boolean {
  return !!token && token.startsWith(EMBEDDED_SESSION_PREFIX);
}

// Skylitee inside this store's admin. Shopify forwards /admin/apps/{client_id} to our App URL.
export function shopAdminAppUrl(shop: string): string {
  return `https://${shop}/admin/apps/${process.env.SHOPIFY_CLIENT_ID}`;
}

// SHOPIFY_EMBEDDED=true once the app is set to "embedded" in the Partner Dashboard.
export function embeddedModeOn(): boolean {
  return process.env.SHOPIFY_EMBEDDED === "true";
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const decodeJson = (part: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));

interface SessionTokenClaims { iss?: string; dest?: string; aud?: string; sub?: string; exp?: number; nbf?: number }

// Verify a Shopify session token → the shop it was issued for, or null if invalid/expired.
export async function verifyShopifySessionToken(token: string): Promise<{ shop: string; userId?: string } | null> {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  const apiKey = process.env.SHOPIFY_CLIENT_ID;
  if (!secret || !apiKey) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    if (decodeJson(parts[0]).alg !== "HS256") return null;
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const ok = await globalThis.crypto.subtle.verify(
      "HMAC", key, b64urlToBytes(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!ok) return null;

    const c = decodeJson(parts[1]) as SessionTokenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (typeof c.exp !== "number" || c.exp + LEEWAY_S < now) return null;
    if (typeof c.nbf === "number" && c.nbf - LEEWAY_S > now) return null;
    if (c.aud !== apiKey || !c.dest) return null;
    const shop = new URL(c.dest).hostname;
    if (!isValidShopDomain(shop)) return null;
    if (c.iss && new URL(c.iss).hostname !== shop) return null;
    return { shop, userId: c.sub };
  } catch {
    return null;
  }
}

export function bearerToken(authHeader: string | null): string | null {
  const m = authHeader?.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
