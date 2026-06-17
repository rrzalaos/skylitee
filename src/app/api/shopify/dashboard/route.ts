import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchOrdersInRange, orderRevenue, resolveShopifyPeriod, isCodGateway } from "@/lib/shopify";
import { ymdInTz } from "@/lib/timezone";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const cacheKey = `cache:${shop}:dashboard:v7:${fromParam ?? "mtd"}:${toParam ?? "now"}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  // Period boundaries + day buckets in the STORE's timezone so totals & the daily chart
  // align with the Shopify admin.
  const { startISO, endISO, startYmd, endYmd, days, tz } = await resolveShopifyPeriod(shop, token, fromParam, toParam);
  const periodStart = new Date(startISO);
  const periodEnd = new Date(endISO);

  const orders = await fetchOrdersInRange(shop, token, startISO, endISO);

  const grossSales = orders.reduce((s, o) => s + orderRevenue(o), 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? grossSales / totalOrders : 0;
  // Returning = a buyer Shopify already knows (lifetime orders_count > 1). Everyone else
  // (first-time buyers AND guest/COD checkouts with no linked customer) counts as new, so
  // new + returning always equals total orders — never "both 0" on a 28-order store.
  const returningCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) > 1).length;
  const newCustomers = totalOrders - returningCustomers;

  const isCod = (o: typeof orders[number]) => isCodGateway(o.payment_gateway);
  const codOrders = orders.filter(isCod).length;
  const prepaidOrders = totalOrders - codOrders;
  // Cash split: prepaid is collected up front; COD is pending-on-delivery (and RTO-risk).
  const codRevenue = orders.filter(isCod).reduce((s, o) => s + orderRevenue(o), 0);
  const prepaidRevenue = grossSales - codRevenue;

  const totalDiscounts = orders.reduce((s, o) => s + parseFloat(o.total_discounts ?? "0"), 0);
  // Money actually refunded = original total − current (refund/edit-adjusted) total.
  const refundedRevenue = orders.reduce((s, o) => s + Math.max(0, parseFloat(o.total_price) - orderRevenue(o)), 0);

  const dailyMap: Record<string, number> = {};
  const dailyOrdersMap: Record<string, number> = {};
  orders.forEach(o => {
    const d = ymdInTz(new Date(o.created_at), tz);   // store-local day
    dailyMap[d] = (dailyMap[d] || 0) + orderRevenue(o);
    dailyOrdersMap[d] = (dailyOrdersMap[d] || 0) + 1;
  });

  // Each entry carries the ISO `date` (for week/month bucketing) + revenue + orders.
  const dailyRevenue: { date: string; day: string; revenue: number; orders: number }[] = [];
  const cur = new Date(`${startYmd}T00:00:00.000Z`);
  const last = new Date(`${endYmd}T00:00:00.000Z`);
  while (cur <= last) {
    const key = cur.toISOString().split("T")[0];          // YYYY-MM-DD
    const [, mm, dd] = key.split("-");
    dailyRevenue.push({ date: key, day: `${parseInt(mm)}/${parseInt(dd)}`, revenue: Math.round(dailyMap[key] || 0), orders: dailyOrdersMap[key] || 0 });
    cur.setUTCDate(cur.getUTCDate() + 1);
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
      codRevenue: Math.round(codRevenue),
      prepaidRevenue: Math.round(prepaidRevenue),
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
