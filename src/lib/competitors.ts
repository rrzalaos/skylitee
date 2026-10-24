import Anthropic from "@anthropic-ai/sdk";
import { competitorKv } from "./kv";
import type { Competitor, CountryInfo, CompetitorAd, AdFormat, AdHooks, AdsPayload } from "./competitor-shared";
export * from "./competitor-shared";

// ── Competitor Intel — shared types + Meta ad fetching ────────────────────────
// Data sources (see COMPETITOR-INTEL-SCOPE.md):
//   • Ads, any country: Apify "Facebook Ad Library" scraper (APIFY_TOKEN). Meta's official
//     ads_archive API returns nothing for commercial ads outside the EU.
//   • EU countries: the official Ad Library API adds REAL reach (eu_total_reach) per ad →
//     high-confidence spend estimates. Needs a token from an ID-verified Meta account
//     (META_AD_LIBRARY_TOKEN), falls back to the store's own Meta token.
// Everything fetched is cached in a SHARED cache (ci:*), so one competitor is paid for once
// across all stores. Nothing here ever invents data — a missing source returns setup_needed.

export const CI_LIMITS = {
  maxCompetitors: Number(process.env.CI_MAX_COMPETITORS) || 5,
  maxAds: Number(process.env.CI_MAX_ADS) || 100,
  adsTtl: 8 * 24 * 3600,        // weekly refresh (+1 day grace)
  adsLock: 24 * 3600,           // manual refresh: once a day per competitor/country
  trafficTtl: 32 * 24 * 3600,   // monthly refresh
  trafficLock: 7 * 24 * 3600,   // manual refresh: once a week
  storeTtl: 7 * 24 * 3600,
};

const GRAPH = "https://graph.facebook.com/v23.0";
const DAY = 86_400_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function normalizeDomain(input: string | undefined | null): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s) ? s : null;
}

/** Numeric page id from an Ad Library URL (view_all_page_id=) or a profile.php?id= URL. */
export function pageIdFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const m = url.match(/[?&](?:view_all_page_id|id)=(\d{5,})/);
  return m ? m[1] : null;
}

/** Cache key for a competitor's Meta page — page id when known, else the page URL slug. */
export function pageKey(c: Competitor): string | null {
  if (c.pageId) return `p${c.pageId}`;
  if (!c.pageUrl) return null;
  const slug = c.pageUrl.toLowerCase().replace(/^https?:\/\/(www\.|m\.)?facebook\.com\//, "").split(/[?#]/)[0].replace(/\/+$/, "");
  return slug ? `u${slug.replace(/[^a-z0-9._-]/g, "_")}` : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function pick(o: Record<string, unknown> | undefined | null, ...keys: string[]): unknown {
  if (!o) return undefined;
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

/** Accepts unix seconds, unix ms, or an ISO/date string. */
function toIso(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v).toISOString();
  if (typeof v === "string") {
    if (/^\d+$/.test(v)) return toIso(Number(v));
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function daysBetween(startIso: string | null, endIso: string | null, active: boolean): number | null {
  if (!startIso) return null;
  const end = active || !endIso ? Date.now() : new Date(endIso).getTime();
  return Math.max(1, Math.round((end - new Date(startIso).getTime()) / DAY));
}

// Dynamic product ads carry template text like "{{product.name}}" — not real copy.
const isTemplate = (s: string) => /\{\{\s*product\./i.test(s);

export function libraryUrl(adId: string, country: string): string {
  return `https://www.facebook.com/ads/library/?id=${adId}&country=${country}`;
}

// ── Apify scraper ─────────────────────────────────────────────────────────────

/** Normalise one scraper item. Defensive: accepts snake_case or camelCase keys. */
export function normalizeScrapedAd(raw: Record<string, unknown>, country: string): CompetitorAd | null {
  const id = str(pick(raw, "ad_archive_id", "adArchiveID", "adArchiveId", "adArchive_id", "id"));
  if (!id) return null;
  const snap = (pick(raw, "snapshot") ?? {}) as Record<string, unknown>;
  const cards = (pick(snap, "cards") as Record<string, unknown>[] | undefined) ?? [];
  const images = (pick(snap, "images") as Record<string, unknown>[] | undefined) ?? [];
  const videos = (pick(snap, "videos") as Record<string, unknown>[] | undefined) ?? [];
  const firstCard = cards[0];

  const bodyObj = pick(snap, "body");
  let body = typeof bodyObj === "string" ? bodyObj : str(pick(bodyObj as Record<string, unknown>, "text", "markup"));
  if (!body || isTemplate(body)) body = str(pick(firstCard, "body")) || body;
  if (isTemplate(body)) body = "";
  let title = str(pick(snap, "title"));
  if (!title || isTemplate(title)) title = str(pick(firstCard, "title"));
  if (isTemplate(title)) title = "";

  const displayFormat = str(pick(snap, "display_format", "displayFormat")).toUpperCase();
  const videoUrl = str(pick(videos[0], "video_hd_url", "videoHdUrl", "video_sd_url", "videoSdUrl"))
    || str(pick(firstCard, "video_hd_url", "videoHdUrl", "video_sd_url", "videoSdUrl")) || null;
  const imageUrl = str(pick(images[0], "original_image_url", "originalImageUrl", "resized_image_url", "resizedImageUrl"))
    || str(pick(videos[0], "video_preview_image_url", "videoPreviewImageUrl"))
    || str(pick(firstCard, "original_image_url", "originalImageUrl", "resized_image_url", "resizedImageUrl", "video_preview_image_url", "videoPreviewImageUrl"))
    || null;
  const format: AdFormat =
    displayFormat.includes("CAROUSEL") || displayFormat === "DCO" || cards.length > 1 ? "carousel"
    : displayFormat.includes("VIDEO") || videoUrl ? "video"
    : imageUrl ? "image" : "text";

  const isActive = pick(raw, "is_active", "isActive") !== false;
  const startDate = toIso(pick(raw, "start_date", "startDate", "ad_delivery_start_time"));
  const endDate = toIso(pick(raw, "end_date", "endDate", "ad_delivery_stop_time"));
  const platformsRaw = pick(raw, "publisher_platform", "publisherPlatform", "publisher_platforms") as unknown;
  const platforms = (Array.isArray(platformsRaw) ? platformsRaw : platformsRaw ? [platformsRaw] : [])
    .map(p => str(p).toLowerCase()).filter(Boolean);

  return {
    id,
    pageId: str(pick(raw, "page_id", "pageID", "pageId")) || str(pick(snap, "page_id", "pageId")) || null,
    pageName: str(pick(raw, "page_name", "pageName")) || str(pick(snap, "page_name", "pageName")) || null,
    startDate, endDate, isActive,
    daysRunning: daysBetween(startDate, endDate, isActive),
    platforms,
    body: body.slice(0, 2000),
    title: title.slice(0, 300),
    linkUrl: str(pick(snap, "link_url", "linkUrl")) || str(pick(firstCard, "link_url", "linkUrl")) || null,
    cta: str(pick(snap, "cta_text", "ctaText")) || str(pick(firstCard, "cta_text", "ctaText")) || null,
    format, imageUrl, videoUrl,
    collationCount: Math.max(1, Number(pick(raw, "collation_count", "collationCount")) || 1),
    collationId: str(pick(raw, "collation_id", "collationID", "collationId")) || null,
    libraryUrl: libraryUrl(id, country),
    euReach: null,
  };
}

function adLibrarySearchUrl(c: Competitor, country: string): string | null {
  if (c.pageId) {
    return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${c.pageId}&media_type=all`;
  }
  return c.pageUrl ?? null;
}

async function fetchViaApify(c: Competitor, country: string): Promise<CompetitorAd[]> {
  const token = process.env.APIFY_TOKEN!;
  const actor = (process.env.APIFY_FB_ADS_ACTOR || "curious_coder~facebook-ads-library-scraper").replace("/", "~");
  const url = adLibrarySearchUrl(c, country);
  if (!url) throw new Error("Add the competitor's Facebook page URL first");
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=240`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [{ url }],
        count: CI_LIMITS.maxAds,
        "scrapePageAds.activeStatus": "active",
        "scrapePageAds.sortBy": "impressions_desc",
        "scrapePageAds.countryCode": country,
      }),
    },
  );
  if (!res.ok) throw new Error(`Ad scraper failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const items = await res.json() as Record<string, unknown>[];
  if (!Array.isArray(items)) throw new Error("Ad scraper returned an unexpected response");
  return items
    .map(i => normalizeScrapedAd(i, country))
    .filter((a): a is CompetitorAd => !!a && a.isActive);
}

// ── Official Meta Ad Library API (EU) ─────────────────────────────────────────

interface ArchiveAd {
  id: string;
  page_id?: string;
  page_name?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  publisher_platforms?: string[];
  eu_total_reach?: number | string;
}

async function fetchArchive(pageId: string, country: string, token: string): Promise<ArchiveAd[]> {
  const fields = "id,page_id,page_name,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_titles,publisher_platforms,eu_total_reach";
  const out: ArchiveAd[] = [];
  let next: string | null =
    `${GRAPH}/ads_archive?search_page_ids=${pageId}&ad_reached_countries=${encodeURIComponent(JSON.stringify([country]))}` +
    `&ad_active_status=ACTIVE&ad_type=ALL&fields=${fields}&limit=100&access_token=${encodeURIComponent(token)}`;
  while (next && out.length < CI_LIMITS.maxAds) {
    const res: Response = await fetch(next);
    const json = await res.json() as { data?: ArchiveAd[]; paging?: { next?: string }; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message ?? "Meta Ad Library error");
    out.push(...(json.data ?? []));
    next = json.paging?.next ?? null;
  }
  return out.slice(0, CI_LIMITS.maxAds);
}

function archiveToAd(a: ArchiveAd, country: string): CompetitorAd {
  const startDate = toIso(a.ad_delivery_start_time);
  const endDate = toIso(a.ad_delivery_stop_time);
  const reach = Number(a.eu_total_reach);
  return {
    id: a.id,
    pageId: a.page_id ?? null,
    pageName: a.page_name ?? null,
    startDate, endDate, isActive: true,
    daysRunning: daysBetween(startDate, endDate, true),
    platforms: (a.publisher_platforms ?? []).map(p => p.toLowerCase()),
    body: (a.ad_creative_bodies?.[0] ?? "").slice(0, 2000),
    title: (a.ad_creative_link_titles?.[0] ?? "").slice(0, 300),
    linkUrl: null, cta: null,
    format: "text", imageUrl: null, videoUrl: null,   // creative media isn't in the API — open the library link
    collationCount: 1, collationId: null,
    libraryUrl: libraryUrl(a.id, country),
    euReach: Number.isFinite(reach) && reach > 0 ? reach : null,
  };
}

// ── AI hooks (Claude Haiku) ───────────────────────────────────────────────────

export async function extractHooks(ads: CompetitorAd[], brand: string): Promise<AdHooks | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const copies = [...new Set(ads.map(a => [a.title, a.body].filter(Boolean).join(" — ").trim()).filter(Boolean))]
    .slice(0, 40)
    .map((t, i) => `${i + 1}. ${t.slice(0, 500)}`);
  if (copies.length === 0) return null;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 2000,
      system:
        "You analyse a D2C brand's live Meta ad copy for a competitor-research dashboard. " +
        "Only report what the copy actually says — never guess prices, discounts or claims that aren't in the text. " +
        'Reply with JSON only, no prose: {"summary": string (2 short sentences, plain English, what they push and how), ' +
        '"offers": string[] (concrete offers/discounts/free gifts/COD/shipping promises, max 6), ' +
        '"hooks": string[] (opening hooks or headline angles, max 6, quote briefly), ' +
        '"angles": string[] (selling angles e.g. "price", "social proof", "festive gifting", max 5)}',
      messages: [{ role: "user", content: `Brand: ${brand}\nActive ad copy:\n${copies.join("\n")}` }],
    } as Anthropic.MessageCreateParamsNonStreaming);
    if (response.stop_reason === "refusal") return null;
    const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as Partial<AdHooks>;
    const list = (v: unknown, n: number) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, n) : []);
    return {
      summary: str(parsed.summary),
      offers: list(parsed.offers, 6),
      hooks: list(parsed.hooks, 6),
      angles: list(parsed.angles, 5),
    };
  } catch {
    return null;
  }
}

// ── Public entry: cached competitor ads ───────────────────────────────────────

export type AdsResult =
  | { status: "ok"; data: AdsPayload; cached: boolean; refreshBlocked?: boolean }
  | { status: "setup_needed"; missing: string[]; message: string }
  | { status: "error"; message: string };

export function adsSetup(country: CountryInfo, hasShopMetaToken: boolean): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  const apify = !!process.env.APIFY_TOKEN;
  const official = !!process.env.META_AD_LIBRARY_TOKEN || hasShopMetaToken;
  if (!apify && !(country.eu && official)) missing.push("APIFY_TOKEN");
  return { ready: missing.length === 0, missing };
}

export async function getCompetitorAds(
  c: Competitor,
  country: CountryInfo,
  opts: { refresh: boolean; shopMetaToken: string | null },
): Promise<AdsResult & { learnedPageId?: string }> {
  const key = pageKey(c);
  if (!key) return { status: "error", message: "Add this competitor's Facebook page URL to see their ads." };
  const cacheKey = `ads:${country.code}:${key}`;
  const cached = await competitorKv.getCache<AdsPayload>(cacheKey);

  let refreshBlocked = false;
  if (cached && opts.refresh) {
    refreshBlocked = !(await competitorKv.tryLock(cacheKey, CI_LIMITS.adsLock));
  }
  if (cached && (!opts.refresh || refreshBlocked)) {
    return { status: "ok", data: cached, cached: true, refreshBlocked };
  }

  const setup = adsSetup(country, !!opts.shopMetaToken);
  if (!setup.ready) {
    return {
      status: "setup_needed", missing: setup.missing,
      message: "Competitor ad tracking isn't switched on yet — the ad data provider still needs to be connected.",
    };
  }
  if (!cached) await competitorKv.tryLock(cacheKey, CI_LIMITS.adsLock);

  const libToken = process.env.META_AD_LIBRARY_TOKEN || opts.shopMetaToken;
  try {
    let ads: CompetitorAd[] = [];
    let source: AdsPayload["source"] = "apify";
    if (process.env.APIFY_TOKEN) {
      ads = await fetchViaApify(c, country.code);
    } else {
      const pid = c.pageId ?? pageIdFromUrl(c.pageUrl);
      if (!pid) return { status: "error", message: "Add the competitor's numeric Facebook page ID (from their Ad Library link) to fetch EU ads." };
      ads = (await fetchArchive(pid, country.code, libToken!)).map(a => archiveToAd(a, country.code));
      source = "meta_api";
    }

    const pageId = c.pageId ?? ads.find(a => a.pageId)?.pageId ?? null;
    const pageName = ads.find(a => a.pageName)?.pageName ?? null;

    // EU: attach real reach from the official API (scraper doesn't give it)
    let reachMerged = source === "meta_api" && ads.some(a => a.euReach);
    if (country.eu && source === "apify" && pageId && libToken) {
      try {
        const archive = await fetchArchive(pageId, country.code, libToken);
        const reachById = new Map(archive.map(a => [a.id, Number(a.eu_total_reach)]));
        for (const ad of ads) {
          const r = reachById.get(ad.id);
          if (r && Number.isFinite(r) && r > 0) { ad.euReach = r; reachMerged = true; }
        }
      } catch { /* reach is a bonus — keep scraped ads, confidence stays Low */ }
    }

    ads.sort((a, b) => (b.daysRunning ?? 0) - (a.daysRunning ?? 0));
    const hooks = await extractHooks(ads, pageName ?? c.name);
    const data: AdsPayload = {
      fetchedAt: new Date().toISOString(),
      country: country.code, source, pageId, pageName, ads, hooks, reachMerged,
    };
    await competitorKv.setCache(cacheKey, data, CI_LIMITS.adsTtl);
    if (pageId && !c.pageId) {
      // also cache under the page-id key so other stores that added the same page by id hit it
      await competitorKv.setCache(`ads:${country.code}:p${pageId}`, data, CI_LIMITS.adsTtl);
    }
    return { status: "ok", data, cached: false, learnedPageId: pageId && !c.pageId ? pageId : undefined };
  } catch (e) {
    if (cached) return { status: "ok", data: cached, cached: true };
    return { status: "error", message: e instanceof Error ? e.message : "Couldn't fetch ads" };
  }
}

