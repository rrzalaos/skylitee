import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };

interface AdInsightRow {
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
  video_thruplay_watched_actions?: ActionEntry[];
}

interface AdRow {
  id: string;
  name: string;
  status: string;
  creative?: {
    thumbnail_url?: string;
    object_type?: string;
    image_url?: string;
  };
  campaign?: { objective?: string };
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

// Lead = whatever result a leads campaign was optimized for (form, website pixel,
// messaging/WhatsApp/IG DM, call, registration). Mirrors /api/meta + /placement.
const LEAD_ACTION_PATTERNS = ["lead", "messaging_conversation_started", "total_messaging_connection", "messaging_first_reply", "complete_registration", "click_to_call"];
function leadCount(arr: ActionEntry[] | undefined): number {
  if (!arr) return 0;
  let max = 0;
  for (const a of arr) {
    const t = a.action_type.toLowerCase();
    if (LEAD_ACTION_PATTERNS.some(p => t.includes(p))) max = Math.max(max, Math.round(parseFloat(a.value) || 0));
  }
  return max;
}

export type Objective = "SALES" | "TRAFFIC" | "AWARENESS" | "ENGAGEMENT" | "LEADS" | "APP" | "OTHER";
// Map Meta's raw objective (OUTCOME_SALES / LEAD_GENERATION / …) to our normalized buckets.
// Same logic as the Meta Overview so a creative is judged on the same KPI as its campaign.
function normalizeObj(raw: string): Objective {
  const r = (raw ?? "").toUpperCase();
  if (r.includes("SALES") || r.includes("CONVERSIONS")) return "SALES";
  if (r.includes("TRAFFIC") || r.includes("LINK_CLICKS")) return "TRAFFIC";
  if (r.includes("AWARENESS") || r.includes("REACH") || r.includes("BRAND")) return "AWARENESS";
  if (r.includes("ENGAGEMENT")) return "ENGAGEMENT";
  if (r.includes("LEAD")) return "LEADS";
  if (r.includes("APP")) return "APP";
  return "OTHER";
}

interface ScoreInputs {
  obj: Objective; roas: number; ctr: number; freq: number;
  cpl: number; leads: number; cpm: number; cpc: number; costPerVisit: number; lpv: number; clicks: number;
}

// Creative Score (0–100) = 40% Efficiency + 30% Engagement (CTR) + 30% Freshness (low frequency).
// The Efficiency component is measured against the KPI the ad is OPTIMIZED for, so a
// Leads / Awareness / Traffic creative is no longer penalised for having no ROAS.
// Benchmarks match the rest of the app: ROAS 3x · CPL ₹200 · CPM ₹150 · Cost/Visit ₹8 · CPC ₹10.
function computeScore(s: ScoreInputs): number {
  let eff: number;
  switch (s.obj) {
    case "SALES":     eff = Math.min(s.roas / 3, 1); break;
    case "LEADS":     eff = s.cpl > 0 ? Math.min(200 / s.cpl, 1) : 0; break;
    case "AWARENESS": eff = s.cpm > 0 ? Math.min(150 / s.cpm, 1) : 0; break;
    case "TRAFFIC":   eff = s.costPerVisit > 0 ? Math.min(8 / s.costPerVisit, 1) : (s.cpc > 0 ? Math.min(10 / s.cpc, 1) : 0); break;
    default:          eff = Math.min(s.ctr / 1.5, 1); break; // engagement / app / other → CTR is the result
  }
  const engScore = Math.min(s.ctr / 2, 1);
  const fatigue = Math.max(0, Math.min((s.freq - 1.5) / 1.5, 1));
  return Math.max(0, Math.min(100, Math.round(40 * eff + 30 * engScore + 30 * (1 - fatigue))));
}

// Has the ad produced the result its objective was after? (drives the "pause on no result" rule)
function hasResult(s: ScoreInputs): boolean {
  if (s.obj === "SALES") return s.roas > 0;
  if (s.obj === "LEADS") return s.leads > 0;
  if (s.obj === "TRAFFIC") return (s.lpv > 0 || s.clicks > 0);
  return true; // awareness / engagement always "deliver" (reach / impressions)
}

function computeSignal(score: number, freq: number, spend: number, s: ScoreInputs): "scale" | "keep" | "refresh" | "pause" {
  if (spend > 500 && !hasResult(s)) return "pause";
  if (freq > 3) return "pause";
  if (score >= 75) return "scale";
  if (score >= 55) return "keep";
  if (score >= 35) return "refresh";
  return "pause";
}

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
  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });

  const insightFields = [
    "ad_id,ad_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency",
    "actions,action_values,video_thruplay_watched_actions",
  ].join(",");

  const [insightsRes, adsRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/insights?fields=${insightFields}&level=ad&time_range=${timeRange}&limit=50&sort=spend_descending&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/ads?fields=id,name,status,creative%7Bthumbnail_url,object_type,image_url%7D,campaign%7Bobjective%7D&limit=100&access_token=${token}`),
  ]);

  const [insightsData, adsData] = await Promise.all([
    insightsRes.json() as Promise<{ data?: AdInsightRow[]; error?: { message: string } }>,
    adsRes.json() as Promise<{ data?: AdRow[] }>,
  ]);

  if (insightsData.error) return NextResponse.json({ error: insightsData.error.message }, { status: 400 });

  const thumbnailMap = new Map<string, { thumbnail?: string; objectType?: string; status?: string; objective?: string }>();
  for (const ad of adsData.data ?? []) {
    thumbnailMap.set(ad.id, {
      thumbnail: ad.creative?.thumbnail_url ?? ad.creative?.image_url,
      objectType: ad.creative?.object_type,
      status: ad.status,
      objective: ad.campaign?.objective,
    });
  }

  const ads = (insightsData.data ?? []).map(row => {
    const adId = row.ad_id ?? "";
    const spend = parseFloat(row.spend ?? "0");
    const impressions = parseInt(row.impressions ?? "0");
    const clicks = parseInt(row.clicks ?? "0");
    const freq = parseFloat(row.frequency ?? "0");
    const ctr = parseFloat(row.ctr ?? "0");

    const purchases = Math.max(
      actInt(row.actions, "offsite_conversion.fb_pixel_purchase"),
      actInt(row.actions, "purchase")
    );
    const purchaseValue = Math.max(
      actVal(row.action_values, "offsite_conversion.fb_pixel_purchase"),
      actVal(row.action_values, "purchase")
    );
    const atc = Math.max(
      actInt(row.actions, "offsite_conversion.fb_pixel_add_to_cart"),
      actInt(row.actions, "add_to_cart")
    );
    const leads = leadCount(row.actions);
    const lpv = actInt(row.actions, "landing_page_view");
    const reach = parseInt(row.reach ?? "0");
    const cpm = +parseFloat(row.cpm ?? "0").toFixed(2);
    const cpc = +parseFloat(row.cpc ?? "0").toFixed(2);
    const videoViews3s = actInt(row.actions, "video_view");
    const thruplay = Math.round(sumArr(row.video_thruplay_watched_actions));
    const roas = spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0;
    const cac = purchases > 0 ? +(spend / purchases).toFixed(2) : 0;
    const costPerLead = leads > 0 ? +(spend / leads).toFixed(2) : 0;
    const costPerVisit = lpv > 0 ? +(spend / lpv).toFixed(2) : 0;
    const thumbStopRatio = impressions > 0 ? +(videoViews3s / impressions * 100).toFixed(1) : 0;
    const holdRatio = videoViews3s > 0 ? +(thruplay / videoViews3s * 100).toFixed(1) : 0;

    const creativeInfo = thumbnailMap.get(adId);
    const objective = normalizeObj(creativeInfo?.objective ?? "");
    const scoreInputs: ScoreInputs = { obj: objective, roas, ctr, freq, cpl: costPerLead, leads, cpm, cpc, costPerVisit, lpv, clicks };
    const score = computeScore(scoreInputs);
    const signal = computeSignal(score, freq, spend, scoreInputs);

    return {
      id: adId,
      name: row.ad_name ?? "",
      status: creativeInfo?.status ?? "UNKNOWN",
      thumbnail: creativeInfo?.thumbnail ?? null,
      objectType: creativeInfo?.objectType ?? null,
      objective,
      spend: +spend.toFixed(2),
      impressions,
      clicks,
      ctr: +ctr.toFixed(2),
      cpc,
      cpm,
      reach,
      frequency: +freq.toFixed(2),
      purchases,
      purchaseValue: +purchaseValue.toFixed(2),
      atc,
      leads,
      lpv,
      roas,
      cac,
      costPerLead,
      costPerVisit,
      videoViews3s,
      thruplay,
      thumbStopRatio,
      holdRatio,
      score,
      signal,
    };
  });

  return NextResponse.json({
    adAccountName: selected.name,
    currency: selected.currency,
    period: { from, to },
    ads,
  });
}
