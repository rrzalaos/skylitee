import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch, ShopifyProduct, ShopifyOrder } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const shop = process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value;
  const token = process.env.SHOPIFY_ACCESS_TOKEN ?? req.cookies.get("shopify_token")?.value;
  if (!shop || !token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ products }, { orders }] = await Promise.all([
    shopifyFetch<{ products: ShopifyProduct[] }>(shop, token, "/products.json?limit=250&fields=id,title,variants"),
    shopifyFetch<{ orders: ShopifyOrder[] }>(shop, token, `/orders.json?status=any&created_at_min=${monthStart}&limit=250&fields=line_items`),
  ]);

  // Build sales map from orders
  const salesMap: Record<number, { qty: number; revenue: number }> = {};
  orders.forEach(o => {
    o.line_items.forEach(item => {
      if (!salesMap[item.product_id]) salesMap[item.product_id] = { qty: 0, revenue: 0 };
      salesMap[item.product_id].qty += item.quantity;
      salesMap[item.product_id].revenue += parseFloat(item.price) * item.quantity;
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

  return NextResponse.json({ products: result });
}
