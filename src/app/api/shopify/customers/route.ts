import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { shopifyFetchAll, ShopifyCustomer } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  // ?refresh=1 forces a live pull from Shopify (the page's "Refresh" button); otherwise we
  // serve the short cache — this endpoint paginates the FULL customer base (~250/page), so
  // re-pulling on every open would be slow and risk Shopify rate limits.
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const cacheKey = `cache:${shop}:customers`;
  if (!refresh) {
    try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }
  }

  // Paginate through the FULL customer base — not just the first 250 — so totals,
  // LTV, repeat rate and city splits reflect every customer.
  const customers = await shopifyFetchAll<ShopifyCustomer>(
    shop, token,
    "/customers.json?limit=250&fields=id,orders_count,total_spent,created_at,default_address",
    "customers"
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

  const result = {
    kpis: { totalCustomers, repeat, oneTime, avgLTV: Math.round(avgLTV), newThisMonth },
    topCities,
    fetchedAt: new Date().toISOString(),
  };
  kv.set(cacheKey, result, { ex: 600 }).catch(() => {}); // 10-minute cache
  return NextResponse.json(result);
}
