import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { shopifyFetch, fetchOrdersInRange, resolveShopifyPeriod, ShopifyProduct } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const cacheKey = `cache:${shop}:products:v3:${fromParam ?? "mtd"}:${toParam ?? "now"}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  // Sales window follows the selected date range (in the store's timezone).
  const { startISO, endISO, days } = await resolveShopifyPeriod(shop, token, fromParam, toParam);

  const [{ products }, orders] = await Promise.all([
    shopifyFetch<{ products: ShopifyProduct[] }>(shop, token, "/products.json?limit=250&fields=id,title,variants"),
    fetchOrdersInRange(shop, token, startISO, endISO),
  ]);

  // Units + revenue sold per product within the window.
  const salesMap: Record<number, { qty: number; revenue: number }> = {};
  orders.forEach(o => {
    o.line_items.forEach(item => {
      if (!salesMap[item.product_id]) salesMap[item.product_id] = { qty: 0, revenue: 0 };
      salesMap[item.product_id].qty += item.quantity;
      salesMap[item.product_id].revenue += parseFloat(item.price) * item.quantity - parseFloat(item.total_discount ?? "0");
    });
  });

  const rows = products.map(p => {
    const stock = p.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0);
    const price = parseFloat(p.variants[0]?.price || "0");
    const sold = salesMap[p.id]?.qty || 0;
    const revenue = Math.round(salesMap[p.id]?.revenue || 0);
    const soldPerDay = days > 0 ? +(sold / days).toFixed(2) : 0;
    const daysLeft = soldPerDay > 0 ? Math.round(stock / soldPerDay) : null;
    let signal: "oos" | "reorder" | "bestseller" | "good" | "dead" | "bundle";
    if (stock <= 0) signal = "oos";
    else if (sold === 0) signal = "dead";                       // capital locked, no movement in window
    else if (daysLeft !== null && daysLeft <= 15) signal = "reorder";
    else if (sold >= 10) signal = "bestseller";
    else if (sold > 0) signal = "good";
    else signal = "bundle";
    return { id: p.id, name: p.title, total: sold, revenue, stock, price, soldPerDay, daysLeft, signal };
  }).sort((a, b) => b.revenue - a.revenue);

  // ── Aggregate inventory intelligence ──
  const withSales = rows.filter(p => p.total > 0);
  const periodRevenue = rows.reduce((s, p) => s + p.revenue, 0);
  const unitsSold = rows.reduce((s, p) => s + p.total, 0);
  const lowStock = rows.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = rows.filter(p => p.stock <= 0).length;
  const dead = rows.filter(p => p.stock > 0 && p.total === 0);
  const deadStockValue = Math.round(dead.reduce((s, p) => s + p.stock * p.price, 0));
  const inventoryUnits = rows.reduce((s, p) => s + Math.max(0, p.stock), 0);
  const inventoryValue = Math.round(rows.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0));
  // Bestsellers that are now out of stock = lost sales.
  const oosBestsellers = [...withSales].sort((a, b) => b.total - a.total).filter(p => p.stock <= 0).slice(0, 5);
  const bestSeller = [...withSales].sort((a, b) => b.total - a.total)[0] ?? null;   // by units
  const bestEarner = withSales[0] ?? null;                                          // by revenue (rows already sorted)

  const response = {
    products: rows,
    stats: {
      totalProducts: rows.length,
      withSales: withSales.length,
      unitsSold,
      periodRevenue,
      lowStock,
      outOfStock,
      deadStockCount: dead.length,
      deadStockValue,
      inventoryUnits,
      inventoryValue,
      oosBestsellers,
      bestSeller: bestSeller ? { name: bestSeller.name, total: bestSeller.total, revenue: bestSeller.revenue } : null,
      bestEarner: bestEarner ? { name: bestEarner.name, revenue: bestEarner.revenue, total: bestEarner.total } : null,
    },
    period: { from: startISO, to: endISO, days },
  };
  kv.set(cacheKey, response, { ex: 900 }).catch(() => {});
  return NextResponse.json(response);
}
