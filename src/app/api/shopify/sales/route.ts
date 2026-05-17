import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify";

interface LineItem { product_id: number; title: string; quantity: number; price: string; sku?: string }
interface Order {
  id: number; name?: string; total_price: string; created_at: string;
  financial_status: string; payment_gateway: string;
  customer?: { orders_count: number };
  line_items: LineItem[];
  shipping_address?: { city: string; province: string };
}

function isCod(o: Order) {
  const gw = o.payment_gateway?.toLowerCase() ?? "";
  return gw.includes("cod") || gw.includes("cash");
}

export async function GET(req: NextRequest) {
  const shop = process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value;
  const token = process.env.SHOPIFY_ACCESS_TOKEN ?? req.cookies.get("shopify_token")?.value;
  if (!shop || !token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const url = new URL(req.url);
  const now = new Date();
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const periodStart = fromParam ? new Date(fromParam + "T00:00:00.000Z") : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = toParam ? new Date(toParam + "T23:59:59.999Z") : now;
  const days = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));

  const fields = "id,name,total_price,created_at,financial_status,payment_gateway,customer,line_items,shipping_address";
  const { orders } = await shopifyFetch<{ orders: Order[] }>(
    shop, token,
    `/orders.json?status=any&created_at_min=${periodStart.toISOString()}&created_at_max=${periodEnd.toISOString()}&limit=250&fields=${fields}`
  );

  /* ── KPIs ── */
  const grossSales = orders.reduce((s, o) => s + parseFloat(o.total_price), 0);
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
      productMap[key].revenue += parseFloat(item.price) * item.quantity;
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
    const rev = parseFloat(o.total_price);
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
      total: Math.round(parseFloat(o.total_price)),
      status: o.financial_status,
      gateway: o.payment_gateway ?? "",
      city: o.shipping_address?.city ?? "",
      isCod: isCod(o),
      date: o.created_at.substring(5, 10),
    }));

  return NextResponse.json({
    kpis: { grossSales: Math.round(grossSales), totalOrders, aov: Math.round(aov), newCustomers, returningCustomers, codOrders, prepaidOrders, avgItemsPerOrder },
    topByQty, topByRevenue, allBySku, topCities, topStates, recentOrders,
    period: { days },
  });
}
