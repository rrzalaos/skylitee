import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount, leadCount, leadBreakdown, leadChannels } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };

interface MetaInsightRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  outbound_clicks?: ActionEntry[];
  outbound_clicks_ctr?: ActionEntry[];
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
  video_thruplay_watched_actions?: ActionEntry[];
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

function actVal(arr: ActionEntry[] | undefined, type: string): number {
  return parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0");
}
function actInt(arr: ActionEntry[] | undefined, type: string): number {
  return Math.round(actVal(arr, type));
}
function sumArr(arr: ActionEntry[] | undefined): number {
  return (arr ?? []).reduce((s, a) => s + parseFloat(a.value), 0);
}
// leadCount / leadBreakdown live in @/lib/meta so every Meta route counts leads the same
// way and matches Ads Manager's "Results" (first result-event in priority order, not the
// max of all lead-ish events — which over-counts when a website Lead pixel fires loosely).

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const from = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const to = req.nextUrl.searchParams.get("to") ?? defaultEnd;

  // ?debug=1 returns the raw action types Meta sent (and bypasses cache) so we can map
  // the right "result" action for each objective when a count looks wrong (e.g. leads = 0).
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  const cacheKey = `cache:${shop}:meta:v2:${from}:${to}`;
  if (!debug) { try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ } }

  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });
  const adAccountId = selected.id;

  const overviewFields = [
    "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency",
    "outbound_clicks,outbound_clicks_ctr",
    "actions,action_values",
    "video_thruplay_watched_actions",
  ].join(",");
  const campaignFields = "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,outbound_clicks,actions,action_values";

  const [overviewRes, campaignInsightsRes, dailyRes, campaignsMetaRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=${overviewFields}&time_range=${timeRange}&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=${campaignFields}&time_range=${timeRange}&level=campaign&limit=500&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=spend,impressions,clicks,actions,action_values&time_range=${timeRange}&time_increment=1&limit=1000&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,objective&limit=50&access_token=${token}`),
  ]);

  const [overviewData, campaignInsightsData, dailyData, campaignsMetaData] = await Promise.all([
    overviewRes.json() as Promise<{ data?: MetaInsightRow[] }>,
    campaignInsightsRes.json() as Promise<{ data?: MetaInsightRow[] }>,
    dailyRes.json() as Promise<{ data?: (MetaInsightRow & { date_start: string })[] }>,
    campaignsMetaRes.json() as Promise<{ data?: MetaCampaignMeta[] }>,
  ]);

  const o = overviewData.data?.[0];
  const spend = parseFloat(o?.spend ?? "0");
  const impressions = parseInt(o?.impressions ?? "0");
  const clicks = parseInt(o?.clicks ?? "0");

  const outboundClicks = actInt(o?.outbound_clicks, "outbound_click");
  const outboundCtr = +actVal(o?.outbound_clicks_ctr, "outbound_click").toFixed(2);

  const lpv = actInt(o?.actions, "landing_page_view");
  const atc = Math.max(
    actInt(o?.actions, "offsite_conversion.fb_pixel_add_to_cart"),
    actInt(o?.actions, "add_to_cart"),
    actInt(o?.actions, "onsite_conversion.add_to_cart")
  );
  const checkout = Math.max(
    actInt(o?.actions, "offsite_conversion.fb_pixel_initiate_checkout"),
    actInt(o?.actions, "initiate_checkout")
  );
  const purchases = Math.max(
    actInt(o?.actions, "offsite_conversion.fb_pixel_purchase"),
    actInt(o?.actions, "purchase")
  );
  const videoViews3s = actInt(o?.actions, "video_view");
  const leads = leadCount(o?.actions);
  const leadsByType = leadChannels(o?.actions);

  const atcValue = Math.max(
    actVal(o?.action_values, "offsite_conversion.fb_pixel_add_to_cart"),
    actVal(o?.action_values, "add_to_cart")
  );
  const checkoutValue = Math.max(
    actVal(o?.action_values, "offsite_conversion.fb_pixel_initiate_checkout"),
    actVal(o?.action_values, "initiate_checkout")
  );
  const purchaseValue = Math.max(
    actVal(o?.action_values, "offsite_conversion.fb_pixel_purchase"),
    actVal(o?.action_values, "purchase")
  );

  const thruplay = Math.round(sumArr(o?.video_thruplay_watched_actions));

  const roas = spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0;
  const cac = purchases > 0 ? +(spend / purchases).toFixed(2) : 0;
  const costPerLead = leads > 0 ? +(spend / leads).toFixed(2) : 0;
  const lpRatio = clicks > 0 ? +(lpv / clicks * 100).toFixed(1) : 0;
  const atcRatio = lpv > 0 ? +(atc / lpv * 100).toFixed(1) : 0;
  const checkoutRatio = atc > 0 ? +(checkout / atc * 100).toFixed(1) : 0;
  const purchaseRatio = checkout > 0 ? +(purchases / checkout * 100).toFixed(1) : 0;
  const conversionRatio = clicks > 0 ? +(purchases / clicks * 100).toFixed(2) : 0;
  const thumbStopRatio = impressions > 0 ? +(videoViews3s / impressions * 100).toFixed(1) : 0;
  const holdRatio = videoViews3s > 0 ? +(thruplay / videoViews3s * 100).toFixed(1) : 0;

  const statusMap = new Map((campaignsMetaData.data ?? []).map(c => [c.id, c]));

  const campaigns = (campaignInsightsData.data ?? []).map(c => {
    const meta = statusMap.get(c.campaign_id ?? "");
    const cPurchases = Math.max(
      actInt(c?.actions, "offsite_conversion.fb_pixel_purchase"),
      actInt(c?.actions, "purchase")
    );
    const cPurchaseValue = Math.max(
      actVal(c?.action_values, "offsite_conversion.fb_pixel_purchase"),
      actVal(c?.action_values, "purchase")
    );
    const cAtc = Math.max(
      actInt(c?.actions, "offsite_conversion.fb_pixel_add_to_cart"),
      actInt(c?.actions, "add_to_cart")
    );
    const cSpend = parseFloat(c.spend ?? "0");
    const cLpv = actInt(c?.actions, "landing_page_view");
    const cLeads = leadCount(c?.actions);
    return {
      id: c.campaign_id ?? "",
      name: c.campaign_name ?? "",
      status: meta?.status ?? "UNKNOWN",
      objective: meta?.objective ?? "",
      spend: +cSpend.toFixed(2),
      impressions: parseInt(c.impressions ?? "0"),
      reach: parseInt(c.reach ?? "0"),
      frequency: +parseFloat(c.frequency ?? "0").toFixed(2),
      clicks: parseInt(c.clicks ?? "0"),
      ctr: +parseFloat(c.ctr ?? "0").toFixed(2),
      cpc: +parseFloat(c.cpc ?? "0").toFixed(2),
      cpm: +parseFloat(c.cpm ?? "0").toFixed(2),
      outboundClicks: actInt(c?.outbound_clicks, "outbound_click"),
      lpv: cLpv,
      leads: cLeads,
      purchases: cPurchases,
      purchaseValue: +cPurchaseValue.toFixed(2),
      roas: cSpend > 0 ? +(cPurchaseValue / cSpend).toFixed(2) : 0,
      atc: cAtc,
    };
  });

  const daily = (dailyData.data ?? []).map(d => ({
    date: d.date_start ?? "",
    spend: +parseFloat(d.spend ?? "0").toFixed(2),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
    purchases: Math.max(
      actInt(d?.actions, "offsite_conversion.fb_pixel_purchase"),
      actInt(d?.actions, "purchase")
    ),
    purchaseValue: +Math.max(
      actVal(d?.action_values, "offsite_conversion.fb_pixel_purchase"),
      actVal(d?.action_values, "purchase")
    ).toFixed(2),
  }));

  const result = {
    adAccountId: selected.id,
    adAccountName: selected.name,
    currency: selected.currency,
    period: { from, to },
    kpis: {
      spend: +spend.toFixed(2), roas, cac, purchases, purchaseValue: +purchaseValue.toFixed(2),
      leads, costPerLead, leadsByType,
      impressions, reach: parseInt(o?.reach ?? "0"),
      frequency: +parseFloat(o?.frequency ?? "0").toFixed(2),
      cpm: +parseFloat(o?.cpm ?? "0").toFixed(2),
      clicks, ctr: +parseFloat(o?.ctr ?? "0").toFixed(2),
      cpc: +parseFloat(o?.cpc ?? "0").toFixed(2),
      outboundClicks, outboundCtr,
      lpv, lpRatio, atc, atcValue: +atcValue.toFixed(2), atcRatio,
      checkout, checkoutValue: +checkoutValue.toFixed(2), checkoutRatio,
      purchaseRatio, conversionRatio,
      videoViews3s, thruplay, thumbStopRatio, holdRatio,
    },
    campaigns,
    daily,
    ...(debug ? {
      _debug: {
        note: "leads = what we now report (Ads Manager 'Results'). leadBreakdown lists every lead-ish event; chosen=true is the one we counted.",
        overview: { leads: leadCount(o?.actions), leadBreakdown: leadBreakdown(o?.actions) },
        campaigns: (campaignInsightsData.data ?? []).map(c => ({
          name: c.campaign_name,
          objective: statusMap.get(c.campaign_id ?? "")?.objective ?? "",
          spend: c.spend,
          leads: leadCount(c.actions),
          leadBreakdown: leadBreakdown(c.actions),
          allActions: (c.actions ?? []).map(a => ({ type: a.action_type, value: a.value })),
        })),
      },
    } : {}),
  };
  if (!debug) kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
