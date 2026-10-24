import { competitorKv } from "./kv";
import { CI_LIMITS } from "./competitors";

// ── Competitor storefront prices (public Shopify endpoints) ──────────────────
// Any Shopify store serves /products.json publicly; /collections/all?sort_by=best-selling
// lists products in the store's own best-seller order. These give REAL price points
// (used for AOV in the spend/ROAS estimate). Non-Shopify sites simply return nothing.

export interface StoreProduct { handle: string; title: string; price: number; compareAt: number | null; url: string }

export interface StorePayload {
  fetchedAt: string;
  domain: string;
  isShopify: boolean;
  currency: string | null;
  productCount: number;
  priceMin: number | null;
  priceMedian: number | null;
  priceMax: number | null;
  onSalePct: number | null;        // share of products with a compare-at (strike-through) price
  bestsellers: StoreProduct[];     // store's own best-selling order (top 10)
  bestsellerMedian: number | null; // AOV proxy
}

const UA = { "User-Agent": "Mozilla/5.0 (compatible; SkyliteeBot/1.0; +https://skylitee.com)" };

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
}

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
    return res.ok ? await res.text() : null;
  } catch { return null; }
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

interface RawProduct { handle: string; title: string; variants?: { price?: string; compare_at_price?: string | null; available?: boolean }[] }

export async function getCompetitorStore(domain: string, refresh = false): Promise<StorePayload> {
  const cacheKey = `store:${domain}`;
  if (!refresh) {
    const cached = await competitorKv.getCache<StorePayload>(cacheKey);
    if (cached) return cached;
  }
  const base = `https://${domain}`;
  const [productsRes, bestHtml, metaRes] = await Promise.allSettled([
    getJson<{ products?: RawProduct[] }>(`${base}/products.json?limit=250`),
    getText(`${base}/collections/all?sort_by=best-selling`),
    getJson<{ currency?: string }>(`${base}/meta.json`),
  ]);
  const products = (productsRes.status === "fulfilled" ? productsRes.value?.products : null) ?? [];
  const currency = metaRes.status === "fulfilled" ? metaRes.value?.currency ?? null : null;

  const byHandle = new Map<string, StoreProduct>();
  for (const p of products) {
    const vs = (p.variants ?? []).filter(v => v.price);
    if (!vs.length) continue;
    const cheapest = vs.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b));
    const price = Math.round(Number(cheapest.price));
    if (!(price > 0)) continue;
    const cmp = Number(cheapest.compare_at_price);
    byHandle.set(p.handle, {
      handle: p.handle, title: p.title, price,
      compareAt: cmp > price ? Math.round(cmp) : null,
      url: `${base}/products/${p.handle}`,
    });
  }

  const handles: string[] = [];
  const html = bestHtml.status === "fulfilled" ? bestHtml.value : null;
  if (html) {
    for (const m of html.matchAll(/\/products\/([a-z0-9][a-z0-9-]*)/gi)) {
      const h = m[1].toLowerCase();
      if (!handles.includes(h)) handles.push(h);
      if (handles.length >= 30) break;
    }
  }
  const bestsellers = handles.map(h => byHandle.get(h)).filter((p): p is StoreProduct => !!p).slice(0, 10);
  const prices = [...byHandle.values()].map(p => p.price);

  const data: StorePayload = {
    fetchedAt: new Date().toISOString(),
    domain,
    isShopify: products.length > 0,
    currency,
    productCount: byHandle.size,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMedian: median(prices),
    priceMax: prices.length ? Math.max(...prices) : null,
    onSalePct: prices.length ? Math.round(([...byHandle.values()].filter(p => p.compareAt).length / prices.length) * 100) : null,
    bestsellers,
    bestsellerMedian: median(bestsellers.map(p => p.price)),
  };
  await competitorKv.setCache(cacheKey, data, CI_LIMITS.storeTtl);
  return data;
}
