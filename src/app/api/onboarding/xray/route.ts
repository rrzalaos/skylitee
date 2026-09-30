import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getShopifySession } from "@/lib/session";
import {
  shopifyFetch, shopifyFetchAll, ORDER_FIELDS, isRealOrder, orderRevenue, isCodGateway,
  type ShopifyOrder,
} from "@/lib/shopify";
import { markOnce } from "@/lib/funnel";

// Store X-Ray: the first "magic moment" for a new install — what Shopify alone already tells
// us about the last 90 days, before any ad account is connected. Real orders only; every
// insight is flagged good (green) / needs attention (red) against a simple D2C benchmark.

const DAY = 86_400_000;
const WINDOW_DAYS = 90;
const CACHE_TTL_S = 6 * 60 * 60;
const cacheKey = (shop: string) => `xray:v1:${shop}`;

type Flag = "good" | "bad" | "neutral";

export interface XRay {
  generatedAt: string;
  currency: string;
  shopName: string;
  days: number;
  orders: number;
  revenue: number;
  aov: number;
  weekly: { start: string; revenue: number; orders: number }[];
  bestWeek: { start: string; revenue: number } | null;
  worstWeek: { start: string; revenue: number } | null;
  last30: { revenue: number; orders: number };
  prev30: { revenue: number; orders: number };
  growthPct: number | null;
  repeatPct: number | null;
  customers: number;
  codPct: number | null;
  topProduct: { title: string; revenue: number; units: number; sharePct: number } | null;
  slowingProduct: { title: string; last30Units: number; prev30Units: number; dropPct: number } | null;
  leak: { refunds: number; cancelled: number; cancelledOrders: number; total: number; pct: number };
  discounts: { total: number; pctOfRevenue: number };
  flags: { growth: Flag; repeat: Flag; cod: Flag; leak: Flag; discounts: Flag };
}

const num = (s?: string | null) => parseFloat(s ?? "0") || 0;
const round = (n: number) => Math.round(n * 100) / 100;

function build(all: ShopifyOrder[], currency: string, shopName: string): XRay {
  const now = Date.now();
  const nonTest = all.filter(o => !o.test);
  const real = nonTest.filter(isRealOrder);
  const cancelledOrders = nonTest.filter(o => !!o.cancelled_at);

  const revenue = real.reduce((s, o) => s + orderRevenue(o), 0);
  const orders = real.length;

  // 13 weekly buckets ending today (index 0 = oldest).
  const weeks = Math.ceil(WINDOW_DAYS / 7);
  const weekly = Array.from({ length: weeks }, (_, i) => ({
    start: new Date(now - (weeks - i) * 7 * DAY).toISOString().slice(0, 10),
    revenue: 0, orders: 0,
  }));
  for (const o of real) {
    const ago = Math.floor((now - new Date(o.created_at).getTime()) / (7 * DAY));
    const idx = weeks - 1 - ago;
    if (idx >= 0 && idx < weeks) { weekly[idx].revenue += orderRevenue(o); weekly[idx].orders++; }
  }
  weekly.forEach(w => { w.revenue = round(w.revenue); });
  // Oldest bucket may be partial — skip it for best/worst.
  const full = weekly.slice(1);
  const sorted = [...full].sort((a, b) => b.revenue - a.revenue);
  const bestWeek = orders ? { start: sorted[0].start, revenue: sorted[0].revenue } : null;
  const worstWeek = orders ? { start: sorted[sorted.length - 1].start, revenue: sorted[sorted.length - 1].revenue } : null;

  // Last 30 vs the 30 before.
  const inRange = (o: ShopifyOrder, fromAgo: number, toAgo: number) => {
    const t = now - new Date(o.created_at).getTime();
    return t >= fromAgo * DAY && t < toAgo * DAY;
  };
  const sum = (list: ShopifyOrder[]) => ({ revenue: round(list.reduce((s, o) => s + orderRevenue(o), 0)), orders: list.length });
  const last30List = real.filter(o => inRange(o, 0, 30));
  const prev30List = real.filter(o => inRange(o, 30, 60));
  const last30 = sum(last30List);
  const prev30 = sum(prev30List);
  const growthPct = prev30.revenue > 0 ? Math.round(((last30.revenue - prev30.revenue) / prev30.revenue) * 100) : null;

  // Repeat customers: lifetime orders_count > 1, or 2+ orders inside this window.
  const byCustomer = new Map<number, { count: number; lifetime: number }>();
  for (const o of real) {
    if (!o.customer?.id) continue;
    const c = byCustomer.get(o.customer.id) ?? { count: 0, lifetime: 0 };
    c.count++;
    c.lifetime = Math.max(c.lifetime, o.customer.orders_count ?? 0);
    byCustomer.set(o.customer.id, c);
  }
  const customers = byCustomer.size;
  const repeaters = [...byCustomer.values()].filter(c => c.count > 1 || c.lifetime > 1).length;
  const repeatPct = customers ? Math.round((repeaters / customers) * 100) : null;

  const codPct = orders ? Math.round((real.filter(o => isCodGateway(o.payment_gateway)).length / orders) * 100) : null;

  // Products.
  const prod = new Map<string, { title: string; revenue: number; units: number; last30: number; prev30: number }>();
  for (const o of real) {
    const recent = inRange(o, 0, 30), previous = inRange(o, 30, 60);
    for (const li of o.line_items ?? []) {
      const k = String(li.product_id ?? li.title);
      const p = prod.get(k) ?? { title: li.title, revenue: 0, units: 0, last30: 0, prev30: 0 };
      p.revenue += num(li.price) * li.quantity - num(li.total_discount);
      p.units += li.quantity;
      if (recent) p.last30 += li.quantity;
      if (previous) p.prev30 += li.quantity;
      prod.set(k, p);
    }
  }
  const products = [...prod.values()];
  const productRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const top = products.sort((a, b) => b.revenue - a.revenue)[0];
  const topProduct = top ? {
    title: top.title, revenue: round(top.revenue), units: top.units,
    sharePct: productRevenue > 0 ? Math.round((top.revenue / productRevenue) * 100) : 0,
  } : null;
  const slowing = products
    .filter(p => p.prev30 >= 3 && p.last30 < p.prev30)
    .map(p => ({ title: p.title, last30Units: p.last30, prev30Units: p.prev30, dropPct: Math.round(((p.prev30 - p.last30) / p.prev30) * 100) }))
    .sort((a, b) => b.dropPct - a.dropPct || b.prev30Units - a.prev30Units)[0] ?? null;

  // Money leak = refunds on kept orders + value of cancelled orders (not RTO — Shopify can't see that).
  const refunds = real.reduce((s, o) => s + Math.max(0, num(o.total_price) - orderRevenue(o)), 0);
  const cancelled = cancelledOrders.reduce((s, o) => s + num(o.total_price), 0);
  const leakTotal = refunds + cancelled;
  const gross = real.reduce((s, o) => s + num(o.total_price), 0) + cancelled;
  const leakPct = gross > 0 ? Math.round((leakTotal / gross) * 1000) / 10 : 0;

  const discountTotal = real.reduce((s, o) => s + num(o.total_discounts), 0);
  const discountPct = revenue > 0 ? Math.round((discountTotal / (revenue + discountTotal)) * 1000) / 10 : 0;

  return {
    generatedAt: new Date().toISOString(),
    currency, shopName,
    days: WINDOW_DAYS,
    orders,
    revenue: round(revenue),
    aov: orders ? round(revenue / orders) : 0,
    weekly, bestWeek, worstWeek,
    last30, prev30, growthPct,
    repeatPct, customers, codPct,
    topProduct, slowingProduct: slowing,
    leak: { refunds: round(refunds), cancelled: round(cancelled), cancelledOrders: cancelledOrders.length, total: round(leakTotal), pct: leakPct },
    discounts: { total: round(discountTotal), pctOfRevenue: discountPct },
    flags: {
      growth:    growthPct === null ? "neutral" : growthPct >= 0 ? "good" : "bad",
      repeat:    repeatPct === null ? "neutral" : repeatPct >= 25 ? "good" : "bad",
      cod:       codPct === null ? "neutral" : codPct > 50 ? "bad" : "good",
      leak:      gross === 0 ? "neutral" : leakPct > 5 ? "bad" : "good",
      discounts: revenue === 0 ? "neutral" : discountPct > 15 ? "bad" : "good",
    },
  };
}

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { shop, token } = session;

  if (req.nextUrl.searchParams.get("refresh") !== "1") {
    try {
      const cached = await kv.get<XRay>(cacheKey(shop));
      if (cached) return NextResponse.json(cached);
    } catch { /* fall through to live */ }
  }

  try {
    const from = new Date(Date.now() - WINDOW_DAYS * DAY).toISOString();
    const [orders, shopInfo] = await Promise.all([
      // status=any includes cancelled orders — needed for the money-leak number.
      shopifyFetchAll<ShopifyOrder>(shop, token,
        `/orders.json?status=any&created_at_min=${encodeURIComponent(from)}&limit=250&fields=${ORDER_FIELDS}`, "orders", 100),
      shopifyFetch<{ shop?: { currency?: string; name?: string } }>(shop, token, "/shop.json?fields=currency,name")
        .catch(() => ({ shop: undefined })),
    ]);

    const xray = build(orders, shopInfo.shop?.currency ?? "INR", shopInfo.shop?.name ?? shop.replace(".myshopify.com", ""));
    await Promise.allSettled([
      kv.set(cacheKey(shop), xray, { ex: CACHE_TTL_S }),
      markOnce(shop, "xrayAt"),
    ]);
    return NextResponse.json(xray);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not read your store" }, { status: 502 });
  }
}
