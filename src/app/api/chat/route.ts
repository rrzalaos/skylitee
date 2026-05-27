import Anthropic from "@anthropic-ai/sdk";
import { shopifyFetch, ShopifyProduct } from "@/lib/shopify";
import { NextRequest } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopKv } from "@/lib/kv";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Order { total_price: string; payment_gateway?: string; customer?: { orders_count: number }; }
interface Customer { orders_count: number; total_spent: string; }

interface MetaInsightRow {
  spend?: string; impressions?: string; clicks?: string; ctr?: string; cpc?: string;
  cpm?: string; reach?: string; frequency?: string;
  campaign_name?: string; campaign_id?: string;
}

async function buildMetaContext(req: NextRequest, shop: string): Promise<string> {
  const token = (await shopKv.getMetaToken(shop)) ?? req.cookies.get("meta_token")?.value;
  if (!token) return "Meta Ads: not connected.";

  try {
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency&access_token=${token}`
    );
    const accountsData = await accountsRes.json() as { data?: { id: string; name: string; currency: string }[]; error?: { message: string } };
    if (accountsData.error || !accountsData.data?.length) return "Meta Ads: token error or no accounts.";

    const savedAccount = (await shopKv.getMetaAccount(shop)) ?? req.cookies.get("meta_ad_account")?.value;
    const account = (savedAccount && accountsData.data.find(a => a.id === savedAccount)) || accountsData.data[0];
    const cur = account.currency === "INR" ? "₹" : account.currency === "USD" ? "$" : account.currency + " ";

    const now = new Date();
    const to = now.toISOString().split("T")[0];
    const from = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));

    const [overviewRes, campaignRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/${account.id}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm,reach,frequency&time_range=${timeRange}&access_token=${token}`),
      fetch(`https://graph.facebook.com/v19.0/${account.id}/insights?fields=campaign_name,spend,impressions,clicks,ctr&time_range=${timeRange}&level=campaign&limit=5&access_token=${token}`),
    ]);
    const [overviewData, campaignData] = await Promise.all([
      overviewRes.json() as Promise<{ data?: MetaInsightRow[] }>,
      campaignRes.json() as Promise<{ data?: MetaInsightRow[] }>,
    ]);

    const o = overviewData.data?.[0];
    const spend = parseFloat(o?.spend ?? "0").toFixed(2);
    const topCampaigns = (campaignData.data ?? []).slice(0, 5).map(c =>
      `  - ${c.campaign_name}: spend ${cur}${parseFloat(c.spend ?? "0").toFixed(2)}, CTR ${parseFloat(c.ctr ?? "0").toFixed(2)}%`
    ).join("\n");

    return `
Meta Ads (last 28 days · ${account.name}):
Total spend: ${cur}${spend}
Impressions: ${parseInt(o?.impressions ?? "0").toLocaleString()}
Clicks: ${parseInt(o?.clicks ?? "0").toLocaleString()}
CTR: ${parseFloat(o?.ctr ?? "0").toFixed(2)}%
CPC: ${cur}${parseFloat(o?.cpc ?? "0").toFixed(2)}
CPM: ${cur}${parseFloat(o?.cpm ?? "0").toFixed(2)}
Reach: ${parseInt(o?.reach ?? "0").toLocaleString()}
Frequency: ${parseFloat(o?.frequency ?? "0").toFixed(2)}x
Top campaigns (by spend):
${topCampaigns || "  No campaign data"}
`.trim();
  } catch {
    return "Meta Ads: could not load data.";
  }
}

async function buildStoreContext(req: NextRequest): Promise<{ context: string; shop: string | null }> {
  const session = await getShopifySession(req);
  if (!session) return { context: "No Shopify store connected.", shop: null };

  const { shop, token } = session;

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

    return {
      shop,
      context: `
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
`.trim(),
    };
  } catch {
    return { context: "Could not load store data at this time.", shop };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const { context: storeContext, shop } = await buildStoreContext(req);
    const metaContext = shop
      ? await buildMetaContext(req, shop)
      : "Meta Ads: not connected.";

    const displayShop = shop ?? "your store";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are Skylitee AI, an expert D2C ecommerce analytics assistant.
You have real-time access to the brand's Shopify store data and Meta Ads data.

SHOPIFY STORE DATA:
${storeContext}

${metaContext}

Give specific, numbers-based recommendations tied to the actual data above. Be concise and actionable.
Use ₹ for currency. Format action items as numbered lists. Keep responses under 300 words unless detailed analysis is requested.
If asked about Google Ads or GA4, acknowledge that data isn't available yet.`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") return Response.json({ error: "Unexpected response type" }, { status: 500 });
    return Response.json({ reply: content.text, shop: displayShop });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
