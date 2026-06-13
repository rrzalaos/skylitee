import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { shopifyFetch, fetchOrdersInRange, ShopifyProduct } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const cacheKey = `cache:${shop}:products:v2`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ products }, orders] = await Promise.all([
    shopifyFetch<{ products: ShopifyProduct[] }>(shop, token, "/products.json?limit=250&fields=id,title,variants"),
    fetchOrdersInRange(shop, token, monthStart),
  ]);

  // Build sales map from orders
  const salesMap: Record<number, { qty: number; revenue: number }> = {};
  orders.forEach(o => {
    o.line_items.forEach(item => {
      if (!salesMap[item.product_id]) salesMap[item.product_id] = { qty: 0, revenue: 0 };
      salesMap[item.product_id].qty += item.quantity;
      salesMap[item.product_id].revenue += parseFloat(item.price) * item.quantity - parseFloat(item.total_discount ?? "0");
    });
  });

  const result = products.map(p => {
    const stock = p.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0);
    const price = parseFloat(p.variants[0]?.price || "0");
    const sold = salesMap[p.id]?.qty || 0;
    const revenue = salesMap[p.id]?.revenue || 0;
    const signal = stock <= 10 ? "reorder" : sold > 50 ? "bestseller" : sold > 20 ? "good" : "bundle";
    return { id: p.id, name: p.title, total: sold, revenue: Math.round(revenue), stock, price, signal };
  }).sort((a, b) => b.revenue - a.revenue);

  const response = { products: result };
  kv.set(cacheKey, response, { ex: 900 }).catch(() => {});
  return NextResponse.json(response);
}
