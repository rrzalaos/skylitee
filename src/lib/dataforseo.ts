import { competitorKv } from "./kv";
import { CI_LIMITS, type CountryInfo } from "./competitors";

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

async function dfs(endpoint: string, task: Json): Promise<Json[]> {
  // Trim: values pasted into Vercel often carry a stray space/newline, which DataForSEO rejects as 401
  const login = process.env.DATAFORSEO_LOGIN?.trim();
  const password = process.env.DATAFORSEO_PASSWORD?.trim();
  const auth = Buffer.from(`${login}:${password}`).toString("base64");
  const res = await fetch(`${BASE}/${endpoint}/live`, {
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
