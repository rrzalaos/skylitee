import { shopKv } from "@/lib/kv";

// Shopify releases API versions quarterly. Update when Shopify deprecates this version.
const API_VERSION = "2025-04";

export function shopifyApiUrl(shop: string, path: string) {
  return `https://${shop}/admin/api/${API_VERSION}${path}`;
}

// Shopify rotating offline tokens: when a token is rotated, the response includes
// X-Shopify-Access-Token-Next. We must persist it immediately or future calls will fail.
function rotateTokenIfNeeded(shop: string, res: Response) {
  const next = res.headers.get("X-Shopify-Access-Token-Next");
  if (next) shopKv.setToken(shop, next).catch(() => {});
}

export async function shopifyFetch<T = unknown>(
  shop: string,
  accessToken: string,
  path: string
): Promise<T> {
  const res = await fetch(shopifyApiUrl(shop, path), {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    next: { revalidate: 120 },
  });
  rotateTokenIfNeeded(shop, res);
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${path}`);
  return res.json();
}

export async function shopifyPost<T = unknown>(
  shop: string,
  accessToken: string,
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(shopifyApiUrl(shop, path), {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  rotateTokenIfNeeded(shop, res);
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${path}`);
  return res.json();
}

export function buildAuthUrl(shop: string, state: string): string {
  const appUrl = process.env.SHOPIFY_APP_URL!;
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_CLIENT_ID!,
    scope: process.env.SHOPIFY_SCOPES!,
    redirect_uri: `${appUrl}/api/auth/callback`,
    state,
  });
  return `https://${shop}/admin/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(shop: string, code: string): Promise<string> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── Data helpers ────────────────────────────────────────────────────────────

export interface ShopifyOrder {
  id: number;
  total_price: string;
  subtotal_price: string;
  total_discounts: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  payment_gateway: string;
  customer?: { id: number; orders_count: number; total_spent: string };
  line_items: { product_id: number; title: string; quantity: number; price: string }[];
  shipping_address?: { city: string; province: string };
}

export interface ShopifyProduct {
  id: number;
  title: string;
  variants: { id: number; price: string; inventory_quantity: number; sku: string }[];
}

export interface ShopifyCustomer {
  id: number;
  orders_count: number;
  total_spent: string;
  created_at: string;
  default_address?: { city: string; province: string };
}
