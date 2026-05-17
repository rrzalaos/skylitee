import { NextRequest, NextResponse } from "next/server";

interface MetaInsightRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  date_start?: string;
  campaign_id?: string;
  campaign_name?: string;
}

interface MetaCampaignMeta {
  id: string;
  name: string;
  status: string;
  objective?: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("meta_token")?.value;
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const from = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const to = req.nextUrl.searchParams.get("to") ?? defaultEnd;
  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));

  // Get ad accounts
  const savedAccount = req.cookies.get("meta_ad_account")?.value;
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency&access_token=${token}`
  );
  const accountsData = await accountsRes.json() as {
    data?: { id: string; name: string; currency: string }[];
    error?: { message: string };
  };

  if (accountsData.error) return NextResponse.json({ error: "token_expired" }, { status: 401 });

  const accounts = accountsData.data ?? [];
  if (accounts.length === 0) return NextResponse.json({ error: "no_accounts" });

  const selected = (savedAccount && accounts.find(a => a.id === savedAccount)) || accounts[0];
  const adAccountId = selected.id;

  const overviewFields = "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions";
  const campaignFields = "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm";

  const [overviewRes, campaignInsightsRes, dailyRes, campaignsMetaRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=${overviewFields}&time_range=${timeRange}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=${campaignFields}&time_range=${timeRange}&level=campaign&limit=20&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=spend,impressions,clicks&time_range=${timeRange}&time_increment=1&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,objective&limit=50&access_token=${token}`),
  ]);

  const [overviewData, campaignInsightsData, dailyData, campaignsMetaData] = await Promise.all([
    overviewRes.json() as Promise<{ data?: MetaInsightRow[] }>,
    campaignInsightsRes.json() as Promise<{ data?: MetaInsightRow[] }>,
    dailyRes.json() as Promise<{ data?: (MetaInsightRow & { date_start: string })[] }>,
    campaignsMetaRes.json() as Promise<{ data?: MetaCampaignMeta[] }>,
  ]);

  const overview = overviewData.data?.[0];
  const spend = parseFloat(overview?.spend ?? "0");

  // ROAS: look for purchase or pixel purchase action
  const purchases = overview?.actions?.find(a => a.action_type === "purchase")?.value;
  const pixelPurchases = overview?.actions?.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase")?.value;
  const totalPurchases = parseInt(purchases ?? pixelPurchases ?? "0");

  const statusMap = new Map((campaignsMetaData.data ?? []).map(c => [c.id, c]));

  const campaigns = (campaignInsightsData.data ?? []).map(c => {
    const meta = statusMap.get(c.campaign_id ?? "");
    return {
      id: c.campaign_id ?? "",
      name: c.campaign_name ?? "",
      status: meta?.status ?? "UNKNOWN",
      objective: meta?.objective ?? "",
      spend: +parseFloat(c.spend ?? "0").toFixed(2),
      impressions: parseInt(c.impressions ?? "0"),
      clicks: parseInt(c.clicks ?? "0"),
      ctr: +parseFloat(c.ctr ?? "0").toFixed(2),
      cpc: +parseFloat(c.cpc ?? "0").toFixed(2),
      cpm: +parseFloat(c.cpm ?? "0").toFixed(2),
    };
  });

  const daily = (dailyData.data ?? []).map(d => ({
    date: d.date_start ?? "",
    spend: +parseFloat(d.spend ?? "0").toFixed(2),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
  }));

  return NextResponse.json({
    adAccountId: selected.id,
    adAccountName: selected.name,
    currency: selected.currency,
    accounts: accounts.map(a => ({ id: a.id, name: a.name })),
    period: { from, to },
    kpis: {
      spend: +spend.toFixed(2),
      impressions: parseInt(overview?.impressions ?? "0"),
      clicks: parseInt(overview?.clicks ?? "0"),
      ctr: +parseFloat(overview?.ctr ?? "0").toFixed(2),
      cpc: +parseFloat(overview?.cpc ?? "0").toFixed(2),
      cpm: +parseFloat(overview?.cpm ?? "0").toFixed(2),
      reach: parseInt(overview?.reach ?? "0"),
      frequency: +parseFloat(overview?.frequency ?? "0").toFixed(2),
      purchases: totalPurchases,
    },
    campaigns,
    daily,
  });
}
