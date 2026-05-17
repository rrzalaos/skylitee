import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch, ShopifyOrder } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const shop = req.cookies.get("shopify_shop")?.value;
  const token = req.cookies.get("shopify_token")?.value;
  if (!shop || !token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { orders } = await shopifyFetch<{ orders: ShopifyOrder[] }>(
    shop, token,
    `/orders.json?status=any&created_at_min=${monthStart}&limit=250&fields=id,total_price,created_at,financial_status,payment_gateway,customer,line_items,shipping_address`
  );

  // KPIs
  const grossSales = orders.reduce((s, o) => s + parseFloat(o.total_price), 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? grossSales / totalOrders : 0;
  const newCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) === 1).length;
  const returningCustomers = orders.filter(o => (o.customer?.orders_count ?? 0) > 1).length;

  // COD vs Prepaid
  const codOrders = orders.filter(o => o.payment_gateway?.toLowerCase().includes("cod") || o.payment_gateway?.toLowerCase().includes("cash")).length;
  const prepaidOrders = totalOrders - codOrders;

  // Daily revenue for chart
  const dailyMap: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.created_at).getDate();
    dailyMap[d] = (dailyMap[d] || 0) + parseFloat(o.total_price);
  });
  const dailyRevenue = Array.from({ length: now.getDate() }, (_, i) => ({
    day: `${now.getMonth() + 1}/${i + 1}`,
    revenue: Math.round(dailyMap[i + 1] || 0),
  }));

  // Top cities
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
    },
    dailyRevenue,
    topCities,
    period: { from: monthStart, to: now.toISOString(), days: now.getDate() },
  });
}
