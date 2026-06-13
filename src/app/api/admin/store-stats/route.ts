import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getSession, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";
import { fetchOrdersInRange, orderRevenue } from "@/lib/shopify";

async function kvGet<T>(key: string): Promise<T | null> {
  try { return await kv.get<T>(key); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session || session.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const [shopifyToken, metaToken] = await Promise.allSettled([
    kvGet<string>(`shop:${shop}:shopify_token`),
    kvGet<string>(`shop:${shop}:meta_token`),
  ]);

  const sToken = shopifyToken.status === "fulfilled" ? shopifyToken.value : null;
  if (!sToken) return NextResponse.json({ error: "no_shopify" });

  // Current month date range
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = now.toISOString();

  try {
    const orders = await fetchOrdersInRange(shop, sToken, from, to);

    const revenue = orders.reduce((s, o) => s + orderRevenue(o), 0);
    const ordersCount = orders.length;
    const aov = ordersCount ? Math.round(revenue / ordersCount) : 0;
    const codOrders = orders.filter(o => {
      const gw = (o.payment_gateway ?? "").toLowerCase();
      return gw.includes("cod") || gw.includes("cash");
    }).length;
    const codPct = ordersCount ? Math.round((codOrders / ordersCount) * 100) : 0;
    const hasMetaToken = metaToken.status === "fulfilled" && !!metaToken.value;

    return NextResponse.json({ revenue: Math.round(revenue), orders: ordersCount, aov, codPct, hasMetaToken });
  } catch {
    return NextResponse.json({ error: "shopify_error" });
  }
}
