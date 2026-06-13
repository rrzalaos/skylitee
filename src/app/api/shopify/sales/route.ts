import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchOrdersInRange, orderRevenue, ShopifyOrder } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

type Order = ShopifyOrder;

function isCod(o: Order) {
  const gw = o.payment_gateway?.toLowerCase() ?? "";
  return gw.includes("cod") || gw.includes("cash");
}

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const url = new URL(req.url);
  const now = new Date();
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const cacheKey = `cache:${shop}:sales:v2:${fromParam ?? "mtd"}:${toParam ?? "now"}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const periodStart = fromParam ? new Date(fromParam + "T00:00:00.000Z") : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = toParam ? new Date(toParam + "T23:59:59.999Z") : now;
  const days = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

  const orders = await fetchOrdersInRange(shop, token, periodStart.toISOString(), periodEnd.toISOString());

  /* ── KPIs ── */
  const grossSales = orders.reduce((s, o) => s + orderRevenue(o), 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? grossSales / totalOrders : 0;
  const newCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) === 1).length;
  const returningCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) > 1).length;
  const codOrders = orders.filter(isCod).length;
  const prepaidOrders = totalOrders - codOrders;

  /* ── Product aggregation from line_items ── */
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  let totalItems = 0;

  orders.forEach(o => {
    (o.line_items ?? []).forEach(item => {
      const key = item.title;
      if (!productMap[key]) productMap[key] = { name: item.title, qty: 0, revenue: 0 };
      productMap[key].qty += item.quantity;
      // Subtract line-level discounts so product revenue reconciles with order totals.
      productMap[key].revenue += parseFloat(item.price) * item.quantity - parseFloat(item.total_discount ?? "0");
      totalItems += item.quantity;
    });
  });

  const avgItemsPerOrder = totalOrders ? +(totalItems / totalOrders).toFixed(1) : 0;
  const allProducts = Object.values(productMap);
  const topByQty = [...allProducts].sort((a, b) => b.qty - a.qty).slice(0, 5).map(p => ({ ...p, revenue: Math.round(p.revenue) }));
  const topByRevenue = [...allProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => ({ ...p, revenue: Math.round(p.revenue) }));
  const allBySku = [...allProducts].sort((a, b) => b.revenue - a.revenue).slice(0, 20).map(p => ({ ...p, revenue: Math.round(p.revenue) }));

  /* ── City & State ── */
  const cityMap: Record<string, { orders: number; revenue: number }> = {};
  const stateMap: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach(o => {
    const city = o.shipping_address?.city?.trim();
    const state = o.shipping_address?.province?.trim();
    const rev = orderRevenue(o);
    if (city) {
      cityMap[city] = cityMap[city] ?? { orders: 0, revenue: 0 };
      cityMap[city].orders++; cityMap[city].revenue += rev;
    }
    if (state) {
      stateMap[state] = stateMap[state] ?? { orders: 0, revenue: 0 };
      stateMap[state].orders++; stateMap[state].revenue += rev;
    }
  });

  const topCities = Object.entries(cityMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8)
    .map(([city, d]) => ({ city, orders: d.orders, revenue: Math.round(d.revenue) }));
  const topStates = Object.entries(stateMap).sort((a, b) => b[1].orders - a[1].orders).slice(0, 6)
    .map(([state, d]) => ({ state, orders: d.orders, revenue: Math.round(d.revenue) }));

  /* ── Recent orders ── */
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map(o => ({
      name: o.name ?? `#${o.id}`,
      total: Math.round(orderRevenue(o)),
      status: o.financial_status,
      gateway: o.payment_gateway ?? "",
      city: o.shipping_address?.city ?? "",
      isCod: isCod(o),
      date: o.created_at.substring(5, 10),
    }));

  const result = {
    kpis: { grossSales: Math.round(grossSales), totalOrders, aov: Math.round(aov), newCustomers, returningCustomers, codOrders, prepaidOrders, avgItemsPerOrder },
    topByQty, topByRevenue, allBySku, topCities, topStates, recentOrders,
    period: { days },
  };
  kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
