import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch, ShopifyOrder } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const now = new Date();
  const periodStart = fromParam
    ? new Date(fromParam + "T00:00:00.000Z")
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = toParam
    ? new Date(toParam + "T23:59:59.999Z")
    : now;

  const days = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

  const { orders } = await shopifyFetch<{ orders: ShopifyOrder[] }>(
    shop, token,
    `/orders.json?status=any&created_at_min=${periodStart.toISOString()}&created_at_max=${periodEnd.toISOString()}&limit=250&fields=id,total_price,subtotal_price,total_discounts,created_at,financial_status,payment_gateway,customer,line_items,shipping_address`
  );

  const grossSales = orders.reduce((s, o) => s + parseFloat(o.total_price), 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? grossSales / totalOrders : 0;
  const newCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) === 1).length;
  const returningCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) > 1).length;

  const codOrders = orders.filter(o => o.payment_gateway?.toLowerCase().includes("cod") || o.payment_gateway?.toLowerCase().includes("cash")).length;
  const prepaidOrders = totalOrders - codOrders;

  const totalDiscounts = orders.reduce((s, o) => s + parseFloat(o.total_discounts ?? "0"), 0);
  const refundedOrders = orders.filter(o => o.financial_status === "refunded" || o.financial_status === "partially_refunded");
  const refundedRevenue = refundedOrders.reduce((s, o) => s + parseFloat(o.total_price), 0);

  const dailyMap: Record<string, number> = {};
  orders.forEach(o => {
    const d = o.created_at.substring(0, 10);
    dailyMap[d] = (dailyMap[d] || 0) + parseFloat(o.total_price);
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
    if (city) cityMap[city] = (cityMap[city] || 0) + parseFloat(o.total_price);
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, revenue]) => ({ city, revenue: Math.round(revenue) }));

  return NextResponse.json({
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
  });
}
