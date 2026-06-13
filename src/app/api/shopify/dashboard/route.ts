import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchOrdersInRange, orderRevenue } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const cacheKey = `cache:${shop}:dashboard:v2:${fromParam ?? "mtd"}:${toParam ?? "now"}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const now = new Date();
  const periodStart = fromParam
    ? new Date(fromParam + "T00:00:00.000Z")
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = toParam
    ? new Date(toParam + "T23:59:59.999Z")
    : now;

  const days = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

  const orders = await fetchOrdersInRange(shop, token, periodStart.toISOString(), periodEnd.toISOString());

  const grossSales = orders.reduce((s, o) => s + orderRevenue(o), 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? grossSales / totalOrders : 0;
  const newCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) === 1).length;
  const returningCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) > 1).length;

  const codOrders = orders.filter(o => o.payment_gateway?.toLowerCase().includes("cod") || o.payment_gateway?.toLowerCase().includes("cash")).length;
  const prepaidOrders = totalOrders - codOrders;

  const totalDiscounts = orders.reduce((s, o) => s + parseFloat(o.total_discounts ?? "0"), 0);
  // Money actually refunded = original total − current (refund/edit-adjusted) total.
  const refundedRevenue = orders.reduce((s, o) => s + Math.max(0, parseFloat(o.total_price) - orderRevenue(o)), 0);

  const dailyMap: Record<string, number> = {};
  orders.forEach(o => {
    const d = o.created_at.substring(0, 10);
    dailyMap[d] = (dailyMap[d] || 0) + orderRevenue(o);
  });

  const dailyRevenue: { day: string; revenue: number }[] = [];
  const cursor = new Date(periodStart);
  while (cursor <= periodEnd) {
    const key = cursor.toISOString().split("T")[0];
    const label = `${cursor.getMonth() + 1}/${cursor.getDate()}`;
    dailyRevenue.push({ day: label, revenue: Math.round(dailyMap[key] || 0) });
    cursor.setDate(cursor.getDate() + 1);
  }

  const cityMap: Record<string, number> = {};
  orders.forEach(o => {
    const city = o.shipping_address?.city;
    if (city) cityMap[city] = (cityMap[city] || 0) + orderRevenue(o);
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, revenue]) => ({ city, revenue: Math.round(revenue) }));

  const result = {
    shop,
    kpis: {
      grossSales: Math.round(grossSales),
      totalOrders,
      aov: Math.round(aov),
      newCustomers,
      returningCustomers,
      codOrders,
      prepaidOrders,
      totalDiscounts: Math.round(totalDiscounts),
      refundedRevenue: Math.round(refundedRevenue),
    },
    dailyRevenue,
    topCities,
    period: { from: periodStart.toISOString(), to: periodEnd.toISOString(), days },
  };
  kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
