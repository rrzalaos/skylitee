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

// Parse the `next` URL out of Shopify's cursor-pagination Link header.
// Format: <https://…?page_info=…>; rel="previous", <https://…?page_info=…>; rel="next"
function parseNextLink(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    const m = part.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

// Follows Shopify cursor pagination (Link header) and returns every page concatenated.
// `path` is the first-page path (include limit + fields); subsequent pages follow the
// full URL Shopify returns in the Link header. `key` is the JSON array key, e.g. "customers".
// maxPages bounds the loop (100 × 250 = 25,000 records) so a huge store can't hang the request.
export async function shopifyFetchAll<T = unknown>(
  shop: string,
  accessToken: string,
  path: string,
  key: string,
  maxPages = 100
): Promise<T[]> {
  let url: string | null = shopifyApiUrl(shop, path);
  const all: T[] = [];
  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      next: { revalidate: 120 },
    });
    rotateTokenIfNeeded(shop, res);
    if (!res.ok) throw new Error(`Shopify API ${res.status}: ${path}`);
    const json = (await res.json()) as Record<string, T[]>;
    all.push(...(json[key] ?? []));
    url = parseNextLink(res.headers.get("Link"));
  }
  return all;
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

export async function shopifyDelete(
  shop: string,
  accessToken: string,
  path: string
): Promise<boolean> {
  const res = await fetch(shopifyApiUrl(shop, path), {
    method: "DELETE",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  rotateTokenIfNeeded(shop, res);
  // 200/404 both mean "no longer active" — treat as success.
  return res.ok || res.status === 404;
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
  name?: string;
  total_price: string;
  current_total_price?: string;   // live order total — reflects refunds & edits (matches Shopify "Total sales")
  subtotal_price: string;
  total_discounts: string;
  created_at: string;
  cancelled_at?: string | null;
  test?: boolean;
  financial_status: string;
  fulfillment_status: string | null;
  payment_gateway: string;
  customer?: { id: number; orders_count: number; total_spent: string };
  line_items: { product_id: number; title: string; quantity: number; price: string; total_discount?: string }[];
  shipping_address?: { city: string; province: string };
}

// Field set covering every Shopify route. Must include cancelled_at/test/financial_status
// (for filtering) and current_total_price (for refund-aware revenue) or the helpers below break.
export const ORDER_FIELDS =
  "id,name,total_price,current_total_price,subtotal_price,total_discounts,created_at,cancelled_at,test,financial_status,fulfillment_status,payment_gateway,customer,line_items,shipping_address";

// A real, counted sale: Shopify excludes test orders, cancelled orders, and voided ones
// from its sales reports — so we must too, or our totals run higher than the admin.
export function isRealOrder(o: ShopifyOrder): boolean {
  return !o.cancelled_at && !o.test && o.financial_status !== "voided";
}

// Order revenue matching Shopify "Total sales": current_total_price stays in sync as the
// order is refunded or edited; total_price is the frozen creation-time value (ignores refunds).
export function orderRevenue(o: ShopifyOrder): number {
  return parseFloat(o.current_total_price ?? o.total_price ?? "0");
}

// Fetch EVERY real order in a window (paginated past the 250/page limit, test/cancelled/
// voided filtered out). `fromISO` required; `toISO` optional. Use this everywhere instead of
// a one-page shopifyFetch so stores with >250 orders aren't silently undercounted.
export async function fetchOrdersInRange(
  shop: string,
  accessToken: string,
  fromISO: string,
  toISO?: string,
): Promise<ShopifyOrder[]> {
  const max = toISO ? `&created_at_max=${encodeURIComponent(toISO)}` : "";
  const path = `/orders.json?status=any&created_at_min=${encodeURIComponent(fromISO)}${max}&limit=250&fields=${ORDER_FIELDS}`;
  const orders = await shopifyFetchAll<ShopifyOrder>(shop, accessToken, path, "orders", 100);
  return orders.filter(isRealOrder);
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
