import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount, leadCount } from "@/lib/meta";

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

interface CTA { type?: string }
interface ChildAttachment { image_url?: string; name?: string; description?: string; link?: string; call_to_action?: CTA }
interface LinkData { message?: string; name?: string; description?: string; picture?: string; link?: string; call_to_action?: CTA; child_attachments?: ChildAttachment[] }
interface VideoData { message?: string; title?: string; image_url?: string; video_id?: string; call_to_action?: CTA }
interface ObjectStorySpec { link_data?: LinkData; video_data?: VideoData; photo_data?: { image_url?: string } }
interface AssetFeedSpec {
  images?: { url?: string; hash?: string }[];
  videos?: { video_id?: string; thumbnail_url?: string }[];
  bodies?: { text?: string }[]; titles?: { text?: string }[]; descriptions?: { text?: string }[];
  call_to_action_types?: string[];
}
interface Creative {
  id?: string; name?: string; thumbnail_url?: string; image_url?: string;
  object_type?: string; call_to_action_type?: string; video_id?: string;
  object_story_spec?: ObjectStorySpec; asset_feed_spec?: AssetFeedSpec;
}

interface AdRow {
  id: string;
  name: string;
  status: string;
  creative?: Creative;
  campaign?: { objective?: string };
}

export interface ParsedCreative {
  type: "image" | "carousel" | "video" | "unknown";
  images: string[];
  videoThumb: string | null;
  videoId: string | null;
  cta: string | null;
  primaryText: string | null;
  headline: string | null;
  description: string | null;
}

// Parse the full creative spec into usable media + copy. Mirrors /api/meta/drilldown so the
// Creative Studio shows the same real creative (full-res image / all carousel frames / video
// thumb) and the ad copy (primary text, headline, CTA) instead of just a low-res thumbnail.
function parseCreative(cr: Creative | undefined): ParsedCreative {
  const oss = cr?.object_story_spec;
  const afs = cr?.asset_feed_spec;
  const ld = oss?.link_data;
  const vd = oss?.video_data;

  const cta = cr?.call_to_action_type ?? ld?.call_to_action?.type ?? vd?.call_to_action?.type
    ?? ld?.child_attachments?.[0]?.call_to_action?.type ?? afs?.call_to_action_types?.[0] ?? null;
  const primaryText = ld?.message ?? vd?.message ?? afs?.bodies?.[0]?.text ?? null;
  const headline = ld?.name ?? vd?.title ?? afs?.titles?.[0]?.text ?? null;
  const description = ld?.description ?? afs?.descriptions?.[0]?.text ?? null;

  const children = ld?.child_attachments ?? [];
  const isCarousel = children.length > 1;
  const videoId = cr?.video_id ?? vd?.video_id ?? afs?.videos?.[0]?.video_id ?? null;
  const isVideo = !isCarousel && (cr?.object_type === "VIDEO" || !!vd || !!videoId || (afs?.videos?.length ?? 0) > 0);

  let type: ParsedCreative["type"] = "unknown";
  let images: string[] = [];
  let videoThumb: string | null = null;

  if (isCarousel) {
    type = "carousel";
    images = children.map(c => c.image_url).filter((u): u is string => !!u);
  } else if (isVideo) {
    type = "video";
    videoThumb = vd?.image_url ?? afs?.videos?.[0]?.thumbnail_url ?? cr?.image_url ?? cr?.thumbnail_url ?? null;
  } else {
    const img = cr?.image_url ?? ld?.picture ?? oss?.photo_data?.image_url ?? afs?.images?.[0]?.url ?? cr?.thumbnail_url ?? null;
    if (img) { type = "image"; images = [img]; }
  }

  return { type, images, videoThumb, videoId, cta, primaryText, headline, description };
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

// leadCount is shared from @/lib/meta so ads, drill-down, placement & overview all match
// Ads Manager's "Results" (first result-event in priority order, not the over-counting max).

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
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/ads?fields=id,name,status,creative%7Bid,name,thumbnail_url,image_url,object_type,call_to_action_type,video_id,object_story_spec%7Blink_data%7Bmessage,name,description,picture,link,call_to_action,child_attachments%7D,video_data%7Bmessage,title,image_url,video_id,call_to_action%7D,photo_data%7Bimage_url%7D%7D,asset_feed_spec%7Bimages,videos,bodies,titles,descriptions,call_to_action_types%7D%7D,campaign%7Bobjective%7D&limit=100&access_token=${token}`),
  ]);

  const [insightsData, adsData] = await Promise.all([
    insightsRes.json() as Promise<{ data?: AdInsightRow[]; error?: { message: string } }>,
    adsRes.json() as Promise<{ data?: AdRow[] }>,
  ]);

  if (insightsData.error) return NextResponse.json({ error: insightsData.error.message }, { status: 400 });

  const creativeMap = new Map<string, { thumbnail?: string; objectType?: string; status?: string; objective?: string; creative: ParsedCreative }>();
  for (const ad of adsData.data ?? []) {
    creativeMap.set(ad.id, {
      thumbnail: ad.creative?.thumbnail_url ?? ad.creative?.image_url,
      objectType: ad.creative?.object_type,
      status: ad.status,
      objective: ad.campaign?.objective,
      creative: parseCreative(ad.creative),
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

    const creativeInfo = creativeMap.get(adId);
    const parsed = creativeInfo?.creative ?? { type: "unknown" as const, images: [], videoThumb: null, videoId: null, cta: null, primaryText: null, headline: null, description: null };
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
      format: parsed.type === "unknown" ? "image" : parsed.type,
      creative: parsed,
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
