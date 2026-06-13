import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { shopifyFetch, fetchOrdersInRange, orderRevenue, ShopifyProduct } from "@/lib/shopify";
import { getShopifySession } from "@/lib/session";

interface Customer { orders_count: number; total_spent: string; }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const days = now.getDate();

  const [orders, { products }, { customers }] = await Promise.all([
    fetchOrdersInRange(shop, token, monthStart),
    shopifyFetch<{ products: ShopifyProduct[] }>(shop, token, "/products.json?limit=250&fields=id,title,variants"),
    shopifyFetch<{ customers: Customer[] }>(shop, token, "/customers.json?limit=250&fields=id,orders_count,total_spent"),
  ]);

  const grossSales = orders.reduce((s, o) => s + orderRevenue(o), 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? Math.round(grossSales / totalOrders) : 0;
  const codOrders = orders.filter(o => o.payment_gateway?.toLowerCase().includes("cod") || o.payment_gateway?.toLowerCase().includes("cash")).length;
  const codPct = totalOrders ? Math.round((codOrders / totalOrders) * 100) : 0;
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => c.orders_count > 1).length;
  const repeatRate = totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const avgLTV = totalCustomers ? Math.round(customers.reduce((s, c) => s + parseFloat(c.total_spent), 0) / totalCustomers) : 0;

  const productSummary = products.slice(0, 10).map(p => {
    const stock = p.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0);
    return `${p.title}: stock ${stock}`;
  }).join(", ");

  const dailyAvg = days > 0 ? Math.round(grossSales / days) : 0;
  const projectedMonthly = dailyAvg * 30;

  const dataContext = `
Store: ${shop}
Month so far (${days} days): ₹${Math.round(grossSales)} revenue, ${totalOrders} orders, AOV ₹${aov}
Daily average: ₹${dailyAvg} → projected monthly ₹${projectedMonthly}
COD ratio: ${codPct}% (${codOrders} of ${totalOrders} orders)
Total customers: ${totalCustomers}, Repeat rate: ${repeatRate}%, Avg LTV: ₹${avgLTV}
Products (top 10): ${productSummary}
`.trim();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: `You are Skylitee AI, an expert D2C ecommerce analytics advisor for Indian brands.
Analyse the real store data and give exactly 3 specific, actionable insights the brand owner can act on TODAY.
Format each insight as:
**[Insight title]**
[1-2 sentences with specific numbers and a clear action]

Be direct, India-specific, and use ₹ for currency. Never give generic advice. Focus only on what the data shows.`,
    messages: [{ role: "user", content: `Give me 3 key insights from this store data:\n\n${dataContext}` }],
  });

  const aiText = response.content[0].type === "text" ? response.content[0].text : "";

  return NextResponse.json({
    insights: aiText,
    metrics: { grossSales: Math.round(grossSales), totalOrders, aov, codPct, repeatRate, avgLTV, projectedMonthly, days },
  });
}
