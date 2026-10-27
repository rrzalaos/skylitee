import { NextRequest, NextResponse } from "next/server";
import { competitorKv } from "@/lib/kv";
import { plainDashes } from "@/lib/utils";
import {
  getCompetitorAds, getCountry, pageKey, adStats, CI_LIMITS,
  type Competitor, type CompetitorAd, type AdFormat, type AdsPayload,
} from "@/lib/competitors";

// Public "Competitor X-Ray" lead magnet (no login): paste a competitor's Facebook page, get
// 3 real findings from their live Meta ads. Uses the same shared ci:* cache as Competitor
// Intel, so a page any store already tracks is free to show. Uncached lookups are paid
// (Apify), so they're capped per IP and per day across the whole site.

export const maxDuration = 300;   // a cold Apify scrape takes 1-2 min

const DAY = 86_400_000;
const IP_LIMIT = Number(process.env.CI_XRAY_IP_LIMIT) || 5;        // lookups per visitor per day
const DAILY_CAP = Number(process.env.CI_XRAY_DAILY_CAP) || 25;     // paid (uncached) lookups per day, site-wide

// facebook.com/<first segment> values that are never a brand page
const NOT_PAGES = new Set([
  "ads", "groups", "events", "watch", "marketplace", "gaming", "share", "login", "help", "settings",
  "search", "stories", "reel", "reels", "photo", "photo.php", "story.php", "hashtag", "people", "messages",
  "notifications", "friends", "pages", "business", "policies", "privacy", "home.php", "permalink.php",
]);

/** A clean facebook.com page URL, or null if the input isn't a brand page link. */
function cleanPageUrl(input: string): string | null {
  const m = input.trim().match(/^(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook|fb)\.com\/(\S*)$/i);
  if (!m) return null;
  const rest = m[1];
  if (/^ads\/library/i.test(rest)) {
    const id = rest.match(/[?&]view_all_page_id=(\d{5,})/)?.[1];
    return id ? `https://www.facebook.com/ads/library/?view_all_page_id=${id}` : null;
  }
  if (/^profile\.php/i.test(rest)) {
    const id = rest.match(/[?&]id=(\d{5,})/)?.[1];
    return id ? `https://www.facebook.com/profile.php?id=${id}` : null;
  }
  const slug = rest.split(/[?#]/)[0].split("/")[0];
  if (!/^[A-Za-z0-9._-]{2,80}$/.test(slug) || NOT_PAGES.has(slug.toLowerCase())) return null;
  return `https://www.facebook.com/${slug}`;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export interface XrayResult {
  status: "ok";
  pageName: string | null;
  country: string;
  fetchedAt: string;
  activity: { active: number; capped: boolean; launched30d: number; proven: number; formats: Record<AdFormat, number> };
  longest: { days: number; snippet: string; format: AdFormat; platforms: string[]; libraryUrl: string; imageUrl: string | null } | null;
  message: { summary: string; offer: string | null; hook: string | null } | null;
  locked: { moreOffers: number; moreHooks: number; angles: number };
}

const fail = (status: number, message: string, code = "error") => NextResponse.json({ status: code, message }, { status });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { pageUrl?: string; country?: string };
  const pageUrl = cleanPageUrl(String(body.pageUrl ?? ""));
  if (!pageUrl) {
    return fail(400, "Paste the brand's Facebook page link, like facebook.com/brandname.", "invalid");
  }
  const country = getCountry(body.country);
  const slug = pageUrl.replace("https://www.facebook.com/", "").split(/[/?]/)[0];
  const c: Competitor = {
    id: "xray",
    name: slug === "ads" || slug === "profile.php" ? "This brand" : slug,
    pageUrl,
    pageId: pageUrl.match(/[?&](?:view_all_page_id|id)=(\d{5,})/)?.[1],
    addedAt: new Date().toISOString(),
  };

  const today = new Date().toISOString().slice(0, 10);
  const ttl = 26 * 3600;
  if ((await competitorKv.bump(`xray:ip:${today}:${clientIp(req)}`, ttl)) > IP_LIMIT) {
    return fail(429, `You've used your ${IP_LIMIT} free X-Rays for today. Install Skylitee to track up to 5 competitors every day.`, "limit");
  }
  const cached = await competitorKv.getCache<AdsPayload>(`ads:${country.code}:${pageKey(c)}`);
  if (!cached && (await competitorKv.bump(`xray:fresh:${today}`, ttl)) > DAILY_CAP) {
    return fail(503, "Lots of X-Rays running today. Try again tomorrow, or install Skylitee to see it right away.", "busy");
  }

  const res = await getCompetitorAds(c, country, { refresh: false, shopMetaToken: null });
  if (res.status !== "ok") {
    console.error("Competitor X-Ray failed:", pageUrl, country.code, res.message);
    return fail(502, "We couldn't read this page's ads right now. Check the link is the brand's Facebook page and try again.");
  }

  const { ads, hooks } = res.data;
  const now = Date.now();
  // Cached data can be up to a week old - age live ads from their start date, not the stored count.
  const age = (a: CompetitorAd) => a.startDate ? Math.max(1, Math.round((now - Date.parse(a.startDate)) / DAY)) : (a.daysRunning ?? 0);
  const longest = ads.reduce<CompetitorAd | null>((best, a) => (!best || age(a) > age(best) ? a : best), null);
  const stats = adStats(ads);

  const result: XrayResult = {
    status: "ok",
    pageName: res.data.pageName,
    country: country.name,
    fetchedAt: res.data.fetchedAt,
    activity: {
      active: ads.length,
      capped: ads.length >= CI_LIMITS.maxAds,
      launched30d: stats.launched30d,
      proven: ads.filter(a => age(a) > 30).length,
      formats: stats.formats,
    },
    longest: longest && {
      days: age(longest),
      snippet: plainDashes([longest.title, longest.body].filter(Boolean).join(" - ").slice(0, 240)),
      format: longest.format,
      platforms: longest.platforms,
      libraryUrl: longest.libraryUrl,
      imageUrl: longest.imageUrl,
    },
    message: hooks && (hooks.summary || hooks.offers.length || hooks.hooks.length)
      ? { summary: hooks.summary, offer: hooks.offers[0] ?? null, hook: hooks.hooks[0] ?? null }
      : null,
    locked: {
      moreOffers: Math.max(0, (hooks?.offers.length ?? 0) - 1),
      moreHooks: Math.max(0, (hooks?.hooks.length ?? 0) - 1),
      angles: hooks?.angles.length ?? 0,
    },
  };
  return NextResponse.json(result);
}
