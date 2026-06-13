import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchOrdersInRange, orderRevenue, resolveShopifyPeriod } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

// Period-scoped customer intelligence: built from ORDERS placed inside the selected
// range, deduped to unique customers. Unlike /api/shopify/customers (which is the
// all-time lifetime base), this answers "who bought in this window".
export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const cacheKey = `cache:${shop}:customers:period:v3:${fromParam ?? "mtd"}:${toParam ?? "now"}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  // Period boundaries in the store's timezone (matches Shopify admin day boundaries).
  const { startISO, endISO } = await resolveShopifyPeriod(shop, token, fromParam, toParam);

  // Pull every real order in the window (paginated; test/cancelled/voided excluded).
  const orders = await fetchOrdersInRange(shop, token, startISO, endISO);

  // Dedupe to unique customers who bought in the window.
  const byCustomer = new Map<number, { ordersCount: number; spent: number; city?: string }>();
  let revenue = 0;
  for (const o of orders) {
    revenue += orderRevenue(o);
    const cid = o.customer?.id;
    if (cid == null) continue;
    const prev = byCustomer.get(cid);
    byCustomer.set(cid, {
      ordersCount: o.customer?.orders_count ?? prev?.ordersCount ?? 1,
      spent: (prev?.spent ?? 0) + orderRevenue(o),
      city: o.shipping_address?.city ?? prev?.city,
    });
  }

  const buyers = [...byCustomer.values()];
  const activeBuyers = buyers.length;
  // New = first-time customers (only one lifetime order); returning = ordered before.
  const newBuyers = buyers.filter(b => b.ordersCount <= 1).length;
  const returningBuyers = activeBuyers - newBuyers;
  const repeatShare = activeBuyers ? Math.round((returningBuyers / activeBuyers) * 100) : 0;
  const spendPerBuyer = activeBuyers ? Math.round(revenue / activeBuyers) : 0;

  // Top cities by unique buyers in the window.
  const cityMap: Record<string, number> = {};
  for (const b of buyers) {
    if (b.city) cityMap[b.city] = (cityMap[b.city] || 0) + 1;
  }
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count, pct: activeBuyers ? Math.round((count / activeBuyers) * 100) : 0 }));

  const result = {
    kpis: {
      activeBuyers,
      newBuyers,
      returningBuyers,
      repeatShare,
      spendPerBuyer,
      revenue: Math.round(revenue),
      orders: orders.length,
    },
    topCities,
    period: { from: startISO, to: endISO },
  };
  kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
