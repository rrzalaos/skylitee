import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch, ShopifyCustomer } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const { customers } = await shopifyFetch<{ customers: ShopifyCustomer[] }>(
    shop, token,
    "/customers.json?limit=250&fields=id,orders_count,total_spent,created_at,default_address"
  );

  const totalCustomers = customers.length;
  const repeat = customers.filter(c => c.orders_count > 1).length;
  const oneTime = customers.filter(c => c.orders_count === 1).length;
  const totalRevenue = customers.reduce((s, c) => s + parseFloat(c.total_spent), 0);
  const avgLTV = totalCustomers ? totalRevenue / totalCustomers : 0;

  // City breakdown
  const cityMap: Record<string, number> = {};
  customers.forEach(c => {
    const city = c.default_address?.city;
    if (city) cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count, pct: Math.round((count / totalCustomers) * 100) }));

  // New customers this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = customers.filter(c => new Date(c.created_at) >= monthStart).length;

  return NextResponse.json({
    kpis: { totalCustomers, repeat, oneTime, avgLTV: Math.round(avgLTV), newThisMonth },
    topCities,
  });
}
