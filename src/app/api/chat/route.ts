import Anthropic from "@anthropic-ai/sdk";
import { shopifyFetch, ShopifyProduct } from "@/lib/shopify";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Order { total_price: string; payment_gateway?: string; customer?: { orders_count: number }; }
interface Customer { orders_count: number; total_spent: string; }

async function buildStoreContext(req: NextRequest): Promise<string> {
  const shop = process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value;
  const token = process.env.SHOPIFY_ACCESS_TOKEN ?? req.cookies.get("shopify_token")?.value;
  if (!shop || !token) return "No Shopify store connected.";

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const days = now.getDate();

    const [{ orders }, { products }, { customers }] = await Promise.all([
      shopifyFetch<{ orders: Order[] }>(shop, token, `/orders.json?status=any&created_at_min=${monthStart}&limit=250&fields=id,total_price,payment_gateway,customer`),
      shopifyFetch<{ products: ShopifyProduct[] }>(shop, token, "/products.json?limit=250&fields=id,title,variants"),
      shopifyFetch<{ customers: Customer[] }>(shop, token, "/customers.json?limit=250&fields=id,orders_count,total_spent"),
    ]);

    const grossSales = Math.round(orders.reduce((s, o) => s + parseFloat(o.total_price), 0));
    const totalOrders = orders.length;
    const aov = totalOrders ? Math.round(grossSales / totalOrders) : 0;
    const codOrders = orders.filter(o => o.payment_gateway?.toLowerCase().includes("cod") || o.payment_gateway?.toLowerCase().includes("cash")).length;
    const codPct = totalOrders ? Math.round((codOrders / totalOrders) * 100) : 0;
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.orders_count > 1).length;
    const repeatRate = totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    const avgLTV = totalCustomers ? Math.round(customers.reduce((s, c) => s + parseFloat(c.total_spent), 0) / totalCustomers) : 0;
    const dailyAvg = days > 0 ? Math.round(grossSales / days) : 0;
    const projected = dailyAvg * 30;

    const productList = products.slice(0, 10).map(p => {
      const stock = p.variants.reduce((s, v) => s + (v.inventory_quantity || 0), 0);
      return `  - ${p.title}: stock ${stock}, price ₹${p.variants[0]?.price ?? "?"}`;
    }).join("\n");

    return `
Store: ${shop}
Date: ${now.toDateString()} (day ${days} of the month)
Revenue this month: ₹${grossSales}
Total orders: ${totalOrders}
AOV: ₹${aov}
Daily average: ₹${dailyAvg} → projected monthly ₹${projected}
COD ratio: ${codPct}% (${codOrders} of ${totalOrders} orders)
Total customers: ${totalCustomers}
Repeat rate: ${repeatRate}%
Avg customer LTV: ₹${avgLTV}
Products:
${productList}
`.trim();
  } catch {
    return "Could not load store data at this time.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const storeContext = await buildStoreContext(req);
    const shop = process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value ?? "your store";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are Skylitee AI, an expert D2C ecommerce analytics assistant.
You have real-time access to the brand's Shopify store data.

REAL STORE DATA:
${storeContext}

Give specific, numbers-based recommendations tied to the actual data above. Be concise and actionable.
Use ₹ for currency. Format action items as numbered lists. Keep responses under 300 words unless detailed analysis is requested.
If asked about platforms not connected (Meta Ads, Google Ads, GA4), acknowledge that data isn't available yet.`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") return Response.json({ error: "Unexpected response type" }, { status: 500 });
    return Response.json({ reply: content.text });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
