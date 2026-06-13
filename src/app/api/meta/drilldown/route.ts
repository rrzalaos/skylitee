import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount, leadCount } from "@/lib/meta";

// Drill-down: given a campaign id returns its ad sets, given an ad set id returns its
// ads (with parsed creative — image / carousel / video + CTA + copy). Lazy-loaded by
// the Meta Campaigns page as the user clicks down the Campaign → Ad Set → Ad tree.

type ActionEntry = { action_type: string; value: string };

interface InsightRow {
  adset_id?: string; adset_name?: string;
  ad_id?: string; ad_name?: string;
  spend?: string; impressions?: string; reach?: string; frequency?: string;
  clicks?: string; ctr?: string; cpc?: string; cpm?: string;
  outbound_clicks?: ActionEntry[];
  actions?: ActionEntry[]; action_values?: ActionEntry[];
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
  bodies?: { text?: string }[]; titles?: { text?: string }[];
  call_to_action_types?: string[];
}
interface Creative {
  id?: string; name?: string; thumbnail_url?: string; image_url?: string;
  object_type?: string; call_to_action_type?: string; video_id?: string;
  effective_object_story_id?: string;
  object_story_spec?: ObjectStorySpec; asset_feed_spec?: AssetFeedSpec;
}
interface AdMeta { id: string; name: string; status: string; creative?: Creative }
interface AdSetMeta { id: string; name: string; status: string; daily_budget?: string; lifetime_budget?: string; optimization_goal?: string }

function actVal(arr: ActionEntry[] | undefined, type: string): number {
  return parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0");
}
function actInt(arr: ActionEntry[] | undefined, type: string): number {
  return Math.round(actVal(arr, type));
}
function sumArr(arr: ActionEntry[] | undefined): number {
  return (arr ?? []).reduce((s, a) => s + parseFloat(a.value), 0);
}
// leadCount shared from @/lib/meta — matches Ads Manager "Results" (priority, not max).
function purchasesOf(arr: ActionEntry[] | undefined): number {
  return Math.max(actInt(arr, "offsite_conversion.fb_pixel_purchase"), actInt(arr, "purchase"));
}
function purchaseValueOf(arr: ActionEntry[] | undefined): number {
  return Math.max(actVal(arr, "offsite_conversion.fb_pixel_purchase"), actVal(arr, "purchase"));
}

function metricsFromRow(row: InsightRow) {
  const spend = parseFloat(row.spend ?? "0");
  const impressions = parseInt(row.impressions ?? "0");
  const clicks = parseInt(row.clicks ?? "0");
  const purchases = purchasesOf(row.actions);
  const purchaseValue = purchaseValueOf(row.action_values);
  return {
    spend: +spend.toFixed(2),
    impressions,
    reach: parseInt(row.reach ?? "0"),
    frequency: +parseFloat(row.frequency ?? "0").toFixed(2),
    clicks,
    ctr: +parseFloat(row.ctr ?? "0").toFixed(2),
    cpc: +parseFloat(row.cpc ?? "0").toFixed(2),
    cpm: +parseFloat(row.cpm ?? "0").toFixed(2),
    outboundClicks: actInt(row.outbound_clicks, "outbound_click"),
    lpv: actInt(row.actions, "landing_page_view"),
    leads: leadCount(row.actions),
    purchases,
    purchaseValue: +purchaseValue.toFixed(2),
    roas: spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0,
    cac: purchases > 0 ? +(spend / purchases).toFixed(2) : 0,
    atc: Math.max(actInt(row.actions, "offsite_conversion.fb_pixel_add_to_cart"), actInt(row.actions, "add_to_cart")),
  };
}

interface ParsedCreative {
  type: "image" | "carousel" | "video" | "unknown";
  images: string[];
  videoThumb: string | null;
  videoSrc: string | null;
  videoId: string | null;
  cta: string | null;
  primaryText: string | null;
  headline: string | null;
}

function parseCreative(cr: Creative | undefined): ParsedCreative {
  const oss = cr?.object_story_spec;
  const afs = cr?.asset_feed_spec;
  const ld = oss?.link_data;
  const vd = oss?.video_data;

  const cta =
    cr?.call_to_action_type ??
    ld?.call_to_action?.type ??
    vd?.call_to_action?.type ??
    ld?.child_attachments?.[0]?.call_to_action?.type ??
    afs?.call_to_action_types?.[0] ??
    null;

  const primaryText = ld?.message ?? vd?.message ?? afs?.bodies?.[0]?.text ?? null;
  const headline = ld?.name ?? vd?.title ?? afs?.titles?.[0]?.text ?? null;

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
    videoThumb = vd?.image_url ?? afs?.videos?.[0]?.thumbnail_url ?? cr?.thumbnail_url ?? cr?.image_url ?? null;
  } else {
    const img = cr?.image_url ?? ld?.picture ?? oss?.photo_data?.image_url ?? afs?.images?.[0]?.url ?? cr?.thumbnail_url ?? null;
    if (img) { type = "image"; images = [img]; }
    else if (cr?.thumbnail_url) { type = "image"; images = [cr.thumbnail_url]; }
  }

  return { type, images, videoThumb, videoSrc: null, videoId, cta, primaryText, headline };
}

const GRAPH = "https://graph.facebook.com/v19.0";

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const level = req.nextUrl.searchParams.get("level");
  const parentId = req.nextUrl.searchParams.get("parentId");
  if (level !== "adset" && level !== "ad") return NextResponse.json({ error: "bad_level" }, { status: 400 });
  if (!parentId) return NextResponse.json({ error: "missing_parent" }, { status: 400 });

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const from = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const to = req.nextUrl.searchParams.get("to") ?? defaultEnd;

  const cacheKey = `cache:${shop}:meta:drill:v2:${level}:${parentId}:${from}:${to}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  // Verify the saved Meta account is still resolvable (token sanity) — parentId is the scope.
  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });
  const cur = selected.currency;

  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  if (level === "adset") {
    const fields = "adset_id,adset_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,outbound_clicks,actions,action_values";
    const [insRes, metaRes] = await Promise.all([
      fetch(`${GRAPH}/${parentId}/insights?fields=${fields}&level=adset&time_range=${timeRange}&limit=100&action_attribution_windows=${attrWindows}&access_token=${token}`),
      fetch(`${GRAPH}/${parentId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,optimization_goal&limit=200&access_token=${token}`),
    ]);
    const [insData, metaData] = await Promise.all([
      insRes.json() as Promise<{ data?: InsightRow[]; error?: { message: string } }>,
      metaRes.json() as Promise<{ data?: AdSetMeta[] }>,
    ]);
    if (insData.error) return NextResponse.json({ error: insData.error.message }, { status: 400 });

    const metaMap = new Map((metaData.data ?? []).map(a => [a.id, a]));
    const budget = (a: AdSetMeta | undefined): number | null => {
      const b = a?.daily_budget ?? a?.lifetime_budget;
      return b ? +(parseInt(b) / 100).toFixed(2) : null;
    };
    const rows = (insData.data ?? []).map(r => {
      const id = r.adset_id ?? "";
      const m = metaMap.get(id);
      return {
        id, name: r.adset_name ?? m?.name ?? "",
        status: m?.status ?? "UNKNOWN",
        optimizationGoal: m?.optimization_goal ?? null,
        budget: budget(m),
        ...metricsFromRow(r),
      };
    }).sort((a, b) => b.spend - a.spend);

    const result = { level, parentId, currency: cur, period: { from, to }, rows };
    kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
    return NextResponse.json(result);
  }

  // level === "ad"
  const fields = "ad_id,ad_name,spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,outbound_clicks,actions,action_values,video_thruplay_watched_actions";
  const creativeFields = "id,name,status,creative%7Bid,name,thumbnail_url,image_url,object_type,call_to_action_type,video_id,effective_object_story_id,object_story_spec%7Blink_data%7Bmessage,name,description,picture,link,call_to_action,child_attachments%7D,video_data%7Bmessage,title,image_url,video_id,call_to_action%7D,photo_data%7Bimage_url%7D%7D,asset_feed_spec%7Bimages,videos,bodies,titles,call_to_action_types%7D%7D";
  const [insRes, adsRes] = await Promise.all([
    fetch(`${GRAPH}/${parentId}/insights?fields=${fields}&level=ad&time_range=${timeRange}&limit=100&sort=spend_descending&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`${GRAPH}/${parentId}/ads?fields=${creativeFields}&limit=200&access_token=${token}`),
  ]);
  const [insData, adsData] = await Promise.all([
    insRes.json() as Promise<{ data?: InsightRow[]; error?: { message: string } }>,
    adsRes.json() as Promise<{ data?: AdMeta[] }>,
  ]);
  if (insData.error) return NextResponse.json({ error: insData.error.message }, { status: 400 });

  const adMap = new Map((adsData.data ?? []).map(a => [a.id, a]));
  const parsed = new Map<string, ParsedCreative>();
  for (const a of adsData.data ?? []) parsed.set(a.id, parseCreative(a.creative));

  // Batch-resolve playable video sources so the UI can render a real <video>.
  const videoIds = Array.from(new Set(Array.from(parsed.values()).map(p => p.videoId).filter((v): v is string => !!v)));
  if (videoIds.length > 0) {
    try {
      const vRes = await fetch(`${GRAPH}/?ids=${videoIds.join(",")}&fields=source,permalink_url&access_token=${token}`);
      const vData = await vRes.json() as Record<string, { source?: string; permalink_url?: string }>;
      for (const p of parsed.values()) {
        if (p.videoId && vData[p.videoId]?.source) p.videoSrc = vData[p.videoId].source ?? null;
      }
    } catch { /* video source is best-effort; thumbnail still shows */ }
  }

  const rows = (insData.data ?? []).map(r => {
    const id = r.ad_id ?? "";
    const m = adMap.get(id);
    return {
      id, name: r.ad_name ?? m?.name ?? "",
      status: m?.status ?? "UNKNOWN",
      creative: parsed.get(id) ?? { type: "unknown", images: [], videoThumb: null, videoSrc: null, videoId: null, cta: null, primaryText: null, headline: null },
      ...metricsFromRow(r),
      videoViews3s: actInt(r.actions, "video_view"),
      thruplay: Math.round(sumArr(r.video_thruplay_watched_actions)),
      thumbStopRatio: parseInt(r.impressions ?? "0") > 0 ? +(actInt(r.actions, "video_view") / parseInt(r.impressions ?? "1") * 100).toFixed(1) : 0,
    };
  }).sort((a, b) => b.spend - a.spend);

  const result = { level, parentId, currency: cur, period: { from, to }, rows };
  kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
