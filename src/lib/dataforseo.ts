import { competitorKv } from "./kv";
import { CI_LIMITS, type CountryInfo } from "./competitors";
import type { GoogleAd, GoogleAdFormat, GoogleAdPlatform, GoogleAdsPayload } from "./competitor-shared";

// ── DataForSEO Labs — competitor organic + Google-paid traffic estimates ─────
// Pay-as-you-go (DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD). Every number here is
// DataForSEO's MODEL of Google traffic (rankings × search volume × CTR curves) —
// the UI labels it "Estimate". Results are cached monthly in the shared ci:* cache.

const BASE = "https://api.dataforseo.com/v3/dataforseo_labs/google";
export const USD_INR = 88;

export interface TrafficOverview {
  organicTraffic: number;      // est. monthly visits from Google organic
  organicKeywords: number;
  organicValueInr: number;     // what that organic traffic would cost as ads
  paidTraffic: number;         // est. monthly visits from Google search ads
  paidKeywords: number;
  paidCostInr: number;         // est. monthly Google search-ads spend
}

export interface TrafficMonth { month: string; organic: number; paid: number }

export interface RankedKeyword {
  keyword: string;
  volume: number;
  cpcInr: number | null;
  position: number;
  traffic: number;             // est. monthly visits from this keyword
  url: string | null;
}

export interface GapKeyword { keyword: string; volume: number; cpcInr: number | null; theirPosition: number }

export interface TrafficPayload {
  fetchedAt: string;
  country: string;
  domain: string;
  overview: TrafficOverview | null;
  history: TrafficMonth[];
  topKeywords: RankedKeyword[];
  paidKeywords: RankedKeyword[];
  topPages: { url: string; traffic: number; keywords: number }[];
  gap: GapKeyword[] | null;    // null = user's own domain unknown
  gapAgainst: string | null;
}

export function dfsConfigured(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

type Json = Record<string, unknown>;

const dfs = (endpoint: string, task: Json) => dfsPost(`${BASE}/${endpoint}/live`, task, endpoint);

async function dfsPost(url: string, task: Json, endpoint: string): Promise<Json[]> {
  // Trim: values pasted into Vercel often carry a stray space/newline, which DataForSEO rejects as 401
  const login = process.env.DATAFORSEO_LOGIN?.trim();
  const password = process.env.DATAFORSEO_PASSWORD?.trim();
  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  const json = await res.json().catch(() => null) as { status_code?: number; status_message?: string; tasks?: Json[] } | null;
  if (res.status === 401 || json?.status_code === 40100) {
    throw new Error("DataForSEO rejected the login — check DATAFORSEO_LOGIN is your account email and DATAFORSEO_PASSWORD is the API password from the dashboard's API Access page (not your sign-in password).");
  }
  if (res.status === 402 || json?.status_code === 40200 || json?.status_code === 40210) {
    throw new Error("DataForSEO balance is empty — add funds in the DataForSEO dashboard (Billing → Add funds).");
  }
  if (!res.ok || !json) throw new Error(`DataForSEO ${endpoint} failed (${res.status})`);
  const t = json.tasks?.[0] as { status_code?: number; status_message?: string; result?: Json[] } | undefined;
  // 20000 = ok; 40102 = "no search results" (small/unknown site) → treat as empty, not an error
  if (t?.status_code === 40102) return [];
  if (!t || (t.status_code && t.status_code >= 40000)) throw new Error(t?.status_message ?? json.status_message ?? "DataForSEO error");
  return (t.result ?? []) as Json[];
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);
const get = (o: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Json)[k] : undefined), o);

function locParams(country: CountryInfo): Json {
  return country.dfsLanguage
    ? { location_code: country.dfsLocation, language_code: country.dfsLanguage }
    : { location_code: country.dfsLocation };
}

async function overview(domain: string, country: CountryInfo): Promise<TrafficOverview | null> {
  const result = await dfs("domain_rank_overview", { target: domain, ...locParams(country) });
  const m = get(result[0], "items") as Json[] | undefined;
  const metrics = m?.[0]?.metrics as Json | undefined;
  if (!metrics) return null;
  const o = (metrics.organic ?? {}) as Json;
  const p = (metrics.paid ?? {}) as Json;
  return {
    organicTraffic: Math.round(num(o.etv)),
    organicKeywords: num(o.count),
    organicValueInr: Math.round(num(o.estimated_paid_traffic_cost) * USD_INR),
    paidTraffic: Math.round(num(p.etv)),
    paidKeywords: num(p.count),
    paidCostInr: Math.round(num(p.estimated_paid_traffic_cost) * USD_INR),
  };
}

async function history(domain: string, country: CountryInfo): Promise<TrafficMonth[]> {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 12, 1).toISOString().slice(0, 10);
  const result = await dfs("historical_rank_overview", { target: domain, date_from: from, ...locParams(country) });
  const items = (get(result[0], "items") as Json[] | undefined) ?? [];
  return items
    .map(i => ({
      month: `${num(i.year)}-${String(num(i.month)).padStart(2, "0")}`,
      organic: Math.round(num(get(i, "metrics", "organic", "etv"))),
      paid: Math.round(num(get(i, "metrics", "paid", "etv"))),
    }))
    .filter(r => r.month.length === 7 && !r.month.startsWith("0"))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function toRanked(i: Json): RankedKeyword {
  const cpc = get(i, "keyword_data", "keyword_info", "cpc");
  return {
    keyword: String(get(i, "keyword_data", "keyword") ?? ""),
    volume: num(get(i, "keyword_data", "keyword_info", "search_volume")),
    cpcInr: cpc == null ? null : Math.round(num(cpc) * USD_INR),
    position: num(get(i, "ranked_serp_element", "serp_item", "rank_group")),
    traffic: Math.round(num(get(i, "ranked_serp_element", "serp_item", "etv"))),
    url: (get(i, "ranked_serp_element", "serp_item", "url") as string | undefined) ?? null,
  };
}

async function ranked(domain: string, country: CountryInfo, type: "organic" | "paid", limit: number): Promise<RankedKeyword[]> {
  const result = await dfs("ranked_keywords", {
    target: domain, ...locParams(country),
    item_types: [type], limit,
    order_by: ["ranked_serp_element.serp_item.etv,desc"],
  });
  const items = (get(result[0], "items") as Json[] | undefined) ?? [];
  return items.map(toRanked).filter(k => k.keyword);
}

async function keywordGap(theirs: string, ours: string, country: CountryInfo): Promise<GapKeyword[]> {
  // intersections:false → keywords target1 ranks for that target2 does NOT
  const result = await dfs("domain_intersection", {
    target1: theirs, target2: ours, intersections: false, ...locParams(country),
    item_types: ["organic"], limit: 50,
    order_by: ["keyword_data.keyword_info.search_volume,desc"],
  });
  const items = (get(result[0], "items") as Json[] | undefined) ?? [];
  return items.map(i => {
    const cpc = get(i, "keyword_data", "keyword_info", "cpc");
    const serp = (get(i, "first_domain_serp_element") ?? get(i, "ranked_serp_element", "serp_item")) as Json | undefined;
    return {
      keyword: String(get(i, "keyword_data", "keyword") ?? ""),
      volume: num(get(i, "keyword_data", "keyword_info", "search_volume")),
      cpcInr: cpc == null ? null : Math.round(num(cpc) * USD_INR),
      theirPosition: num(serp?.rank_group),
    };
  }).filter(k => k.keyword && k.theirPosition > 0 && k.theirPosition <= 20);
}

function topPagesFrom(keywords: RankedKeyword[]) {
  const pages = new Map<string, { traffic: number; keywords: number }>();
  for (const k of keywords) {
    if (!k.url) continue;
    const p = pages.get(k.url) ?? { traffic: 0, keywords: 0 };
    p.traffic += k.traffic; p.keywords++;
    pages.set(k.url, p);
  }
  return [...pages.entries()].map(([url, v]) => ({ url, ...v })).sort((a, b) => b.traffic - a.traffic).slice(0, 10);
}

export type TrafficResult =
  | { status: "ok"; data: TrafficPayload; cached: boolean; refreshBlocked?: boolean }
  | { status: "setup_needed"; missing: string[]; message: string }
  | { status: "error"; message: string };

export async function getCompetitorTraffic(
  domain: string,
  country: CountryInfo,
  opts: { refresh: boolean; ownDomain: string | null },
): Promise<TrafficResult> {
  // Domain data is shared across every store; the keyword gap depends on the viewer's own
  // domain, so it's cached separately.
  const cacheKey = `traffic:${country.code}:${domain}`;
  const own = opts.ownDomain && opts.ownDomain !== domain ? opts.ownDomain : null;
  const gapKey = own ? `gap:${country.code}:${domain}:${own}` : null;
  const cached = await competitorKv.getCache<TrafficPayload>(cacheKey);
  let refreshBlocked = false;
  if (cached && opts.refresh) refreshBlocked = !(await competitorKv.tryLock(cacheKey, CI_LIMITS.trafficLock));
  if (cached && (!opts.refresh || refreshBlocked)) {
    let gap: GapKeyword[] | null = null;
    if (gapKey) {
      gap = await competitorKv.getCache<GapKeyword[]>(gapKey);
      if (!gap && dfsConfigured()) {
        gap = await keywordGap(domain, own!, country).catch(() => null);
        if (gap) await competitorKv.setCache(gapKey, gap, CI_LIMITS.trafficTtl);
      }
    }
    return { status: "ok", data: { ...cached, gap, gapAgainst: own }, cached: true, refreshBlocked };
  }

  if (!dfsConfigured()) {
    return {
      status: "setup_needed", missing: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"],
      message: "Traffic estimates aren't switched on yet — the traffic data provider still needs to be connected.",
    };
  }
  if (!cached) await competitorKv.tryLock(cacheKey, CI_LIMITS.trafficLock);

  const [ov, hist, org, paid, gap] = await Promise.allSettled([
    overview(domain, country),
    history(domain, country),
    ranked(domain, country, "organic", 100),
    ranked(domain, country, "paid", 30),
    own ? keywordGap(domain, own, country) : Promise.resolve(null),
  ]);
  if (ov.status === "rejected" && org.status === "rejected") {
    if (cached) return { status: "ok", data: cached, cached: true };
    return { status: "error", message: ov.reason instanceof Error ? ov.reason.message : "Couldn't fetch traffic data" };
  }
  const topKeywords = org.status === "fulfilled" ? org.value : [];
  const data: TrafficPayload = {
    fetchedAt: new Date().toISOString(),
    country: country.code, domain,
    overview: ov.status === "fulfilled" ? ov.value : null,
    history: hist.status === "fulfilled" ? hist.value : [],
    topKeywords: topKeywords.slice(0, 30),
    paidKeywords: paid.status === "fulfilled" ? paid.value : [],
    topPages: topPagesFrom(topKeywords),
    gap: null,
    gapAgainst: null,
  };
  await competitorKv.setCache(cacheKey, data, CI_LIMITS.trafficTtl);
  const gapValue = gap.status === "fulfilled" ? gap.value : null;
  if (gapKey && gapValue) await competitorKv.setCache(gapKey, gapValue, CI_LIMITS.trafficTtl);
  return { status: "ok", data: { ...data, gap: gapValue, gapAgainst: own }, cached: false };
}

// ── Google Ads Transparency Center — a competitor's live Google ads ──────────
// SERP API "ads_search": every ad Google has shown for the domain, with first/last shown
// dates and a rendered preview (text ads included). No spend or impressions — Google
// publishes those only for political ads. Items carry no platform, so Search/Shopping/
// YouTube are tagged from three extra platform-filtered lookups.

const ADS_URL = "https://api.dataforseo.com/v3/serp/google/ads_search/live/advanced";
const ADS_DEPTH = 120;           // DataForSEO max; billed per 40 results
const PLATFORM_DEPTH = 120;
const MAX_VIDEO_LOOKUPS = 30;
const DAY_MS = 86_400_000;

export type GoogleAdsResult =
  | { status: "ok"; data: GoogleAdsPayload; cached: boolean; refreshBlocked?: boolean }
  | { status: "setup_needed"; missing: string[]; message: string }
  | { status: "error"; message: string };

const isoOrNull = (v: unknown): string | null => {
  if (typeof v !== "string" || !v) return null;
  // "2024-12-13 08:37:19 +00:00" → ISO
  const d = new Date(v.replace(" ", "T").replace(" +00:00", "Z"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

async function adsSearch(domain: string, country: CountryInfo, platform: "all" | "google_search" | "google_shopping" | "youtube", depth: number, days = 90) {
  const day = (offset: number) => new Date(Date.now() - offset * DAY_MS).toISOString().slice(0, 10);
  const result = await dfsPost(ADS_URL, {
    target: domain, location_code: country.dfsLocation, platform, depth,
    date_from: day(days), date_to: day(0),
  }, "ads_search");
  const items = (get(result[0], "items") as Json[] | undefined ?? []).filter(i => i.type === "ads_search" && i.creative_id);
  // se_results_count = Google's full count, beyond the fetched depth
  return { items, total: Math.max(Number(get(result[0], "se_results_count")) || 0, items.length) };
}

export async function getCompetitorGoogleAds(
  domain: string,
  country: CountryInfo,
  opts: { refresh: boolean },
): Promise<GoogleAdsResult> {
  const cacheKey = `gads2:${country.code}:${domain}`; // v2: real totals + live lookup
  const cached = await competitorKv.getCache<GoogleAdsPayload>(cacheKey);
  let refreshBlocked = false;
  if (cached && opts.refresh) refreshBlocked = !(await competitorKv.tryLock(cacheKey, CI_LIMITS.adsLock));
  if (cached && (!opts.refresh || refreshBlocked)) return { status: "ok", data: cached, cached: true, refreshBlocked };

  if (!dfsConfigured()) {
    return {
      status: "setup_needed", missing: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"],
      message: "Google ad tracking isn't switched on yet — the data provider still needs to be connected.",
    };
  }
  if (!cached) await competitorKv.tryLock(cacheKey, CI_LIMITS.adsLock);

  // "live" = shown in the last 7 days, fetched separately so no live ad falls past the 90-day cap
  const [all, live, search, shopping, youtube] = await Promise.allSettled([
    adsSearch(domain, country, "all", ADS_DEPTH),
    adsSearch(domain, country, "all", ADS_DEPTH, 7),
    adsSearch(domain, country, "google_search", PLATFORM_DEPTH),
    adsSearch(domain, country, "google_shopping", PLATFORM_DEPTH),
    adsSearch(domain, country, "youtube", PLATFORM_DEPTH),
  ]);
  if (all.status === "rejected") {
    if (cached) return { status: "ok", data: cached, cached: true };
    return { status: "error", message: all.reason instanceof Error ? all.reason.message : "Couldn't fetch Google ads" };
  }
  const liveItems = live.status === "fulfilled" ? live.value.items : [];
  const liveIds = new Set(liveItems.map(i => String(i.creative_id)));
  const items = [...liveItems, ...all.value.items];

  const tags = new Map<string, Set<GoogleAdPlatform>>();
  const tag = (r: PromiseSettledResult<{ items: Json[] }>, p: GoogleAdPlatform) => {
    if (r.status !== "fulfilled") return;
    for (const i of r.value.items) {
      const id = String(i.creative_id);
      if (!tags.has(id)) tags.set(id, new Set());
      tags.get(id)!.add(p);
    }
  };
  tag(search, "search"); tag(shopping, "shopping"); tag(youtube, "youtube");

  const now = Date.now();
  const byId = new Map<string, GoogleAd>();
  for (const i of items) {
    const id = String(i.creative_id);
    if (byId.has(id)) continue;
    const firstShown = isoOrNull(i.first_shown);
    const lastShown = isoOrNull(i.last_shown);
    const fmt = String(i.format ?? "").toLowerCase();
    byId.set(id, {
      id,
      advertiserId: String(i.advertiser_id ?? ""),
      advertiserName: String(i.title ?? ""),
      verified: i.verified === true,
      format: (["text", "image", "video"].includes(fmt) ? fmt : "image") as GoogleAdFormat,
      imageUrl: (get(i, "preview_image", "url") as string | undefined) ?? null,
      youtubeId: null,
      firstShown, lastShown,
      daysRunning: firstShown ? Math.max(1, Math.round(((lastShown ? new Date(lastShown).getTime() : now) - new Date(firstShown).getTime()) / DAY_MS)) : null,
      isActive: liveIds.has(id) || (!!lastShown && now - new Date(lastShown).getTime() <= 7 * DAY_MS),
      platforms: [...(tags.get(id) ?? [])],
      transparencyUrl: typeof i.url === "string" ? i.url
        : `https://adstransparency.google.com/advertiser/${i.advertiser_id}/creative/${id}?region=${country.code}`,
    });
  }
  const ads = [...byId.values()].sort((a, b) => (b.daysRunning ?? 0) - (a.daysRunning ?? 0));

  // Video ads come with no preview image — only Google's preview script, which embeds the
  // YouTube video id. Pull it for a real thumbnail + watch link.
  const previewById = new Map(items.map(i => [String(i.creative_id), typeof i.preview_url === "string" ? i.preview_url : null]));
  const videos = ads.filter(a => a.format === "video" && !a.imageUrl && previewById.get(a.id)).slice(0, MAX_VIDEO_LOOKUPS);
  await Promise.allSettled(videos.map(async a => {
    const res = await fetch(previewById.get(a.id)!, { signal: AbortSignal.timeout(6000) });
    const m = (await res.text()).match(/ytimg\.com\\?\/vi\\?\/([A-Za-z0-9_-]{11})/);
    if (m) { a.youtubeId = m[1]; a.imageUrl = `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`; }
  }));

  const adv = new Map<string, { id: string; name: string; verified: boolean; ads: number }>();
  for (const a of ads) {
    const x = adv.get(a.advertiserId) ?? { id: a.advertiserId, name: a.advertiserName, verified: a.verified, ads: 0 };
    x.ads++;
    adv.set(a.advertiserId, x);
  }

  const data: GoogleAdsPayload = {
    fetchedAt: new Date().toISOString(),
    country: country.code, domain,
    advertisers: [...adv.values()].sort((a, b) => b.ads - a.ads),
    ads,
    capped: all.value.total > all.value.items.length,
    totals: {
      seen90d: Math.max(all.value.total, ads.length),
      live: live.status === "fulfilled" ? live.value.total : ads.filter(a => a.isActive).length,
      search: search.status === "fulfilled" ? search.value.total : 0,
      shopping: shopping.status === "fulfilled" ? shopping.value.total : 0,
      youtube: youtube.status === "fulfilled" ? youtube.value.total : 0,
    },
  };
  await competitorKv.setCache(cacheKey, data, CI_LIMITS.adsTtl);
  return { status: "ok", data, cached: false };
}
