import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { fetchOrdersInRange, orderRevenue, getShopTimezone } from "@/lib/shopify";
import { ymdInTz } from "@/lib/timezone";
import { getShopifySession } from "@/lib/session";

// Month-over-month Shopify KPIs. ?months=N (1–12, default 6). Buckets real orders by the
// store's local month so revenue/orders/AOV/COD line up with the Shopify admin.
export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const months = Math.min(12, Math.max(1, parseInt(req.nextUrl.searchParams.get("months") ?? "6", 10)));
  const cacheKey = `cache:${shop}:shopmonthly:v2:${months}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const tz = await getShopTimezone(shop, token);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const startISO = new Date(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`).toISOString();

  const orders = await fetchOrdersInRange(shop, token, startISO);

  const isCod = (gw?: string) => { const g = (gw ?? "").toLowerCase(); return g.includes("cod") || g.includes("cash"); };
  const acc: Record<string, { revenue: number; orders: number; codOrders: number; codRevenue: number; returning: number }> = {};
  for (const o of orders) {
    const ym = ymdInTz(new Date(o.created_at), tz).slice(0, 7);   // store-local YYYY-MM
    const a = acc[ym] ?? { revenue: 0, orders: 0, codOrders: 0, codRevenue: 0, returning: 0 };
    const rev = orderRevenue(o);
    a.revenue += rev; a.orders += 1;
    if (isCod(o.payment_gateway)) { a.codOrders += 1; a.codRevenue += rev; }
    // Returning = known buyer (orders_count > 1); new = the rest (incl. guest/COD).
    if ((o.customer?.orders_count ?? 0) > 1) a.returning += 1;
    acc[ym] = a;
  }

  // Emit every requested month (zero-filled) so the "Last N months" selector always shows N
  // columns instead of only the months that happened to have orders.
  const empty = { revenue: 0, orders: 0, codOrders: 0, codRevenue: 0, returning: 0 };
  const monthsOut = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const a = acc[ym] ?? empty;
    return {
      ym,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      revenue: Math.round(a.revenue),
      orders: a.orders,
      aov: a.orders > 0 ? Math.round(a.revenue / a.orders) : 0,
      newCustomers: a.orders - a.returning,
      returningCustomers: a.returning,
      codOrders: a.codOrders,
      codPct: a.orders > 0 ? Math.round((a.codOrders / a.orders) * 100) : 0,
      prepaidRevenue: Math.round(a.revenue - a.codRevenue),
    };
  });

  const result = { shop, months: monthsOut };
  kv.set(cacheKey, result, { ex: 1800 }).catch(() => {});
  return NextResponse.json(result);
}
