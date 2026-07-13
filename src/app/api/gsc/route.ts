import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getGoogleAccessToken } from "@/lib/google";
import { getGscRefreshToken, getGscSite, getAuthorizedShop } from "@/lib/session";
import { daysAgoInTz } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const refreshToken = await getGscRefreshToken(req, shop);
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  let token: string;
  try {
    token = await getGoogleAccessToken(refreshToken);
  } catch (e) {
    return NextResponse.json({ error: "gsc_auth_error", detail: String(e) }, { status: 502 });
  }

  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sitesData = await sitesRes.json() as { siteEntry?: { siteUrl: string }[] };
  const sites = sitesData.siteEntry ?? [];
  if (sites.length === 0) return NextResponse.json({ error: "no_sites" });

  const savedSite = await getGscSite(req, shop);
  const siteUrl = savedSite && sites.find(s => s.siteUrl === savedSite)
    ? savedSite
    : sites[0].siteUrl;

  // GSC data lags ~2-3 days and its day boundaries are Pacific Time. Defaulting the end to
  // "today" pulls in empty/partial days, so totals read LOWER than the GSC dashboard. Anchor
  // the default window to PT dates, ending 3 days back (28-day window). `dataState: "final"`
  // (below) further guarantees only finalized days count.
  const PT = "America/Los_Angeles";
  const defaultEnd = daysAgoInTz(PT, 3);
  const defaultStart = daysAgoInTz(PT, 30);
  const startDate = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const endDate = req.nextUrl.searchParams.get("to") ?? defaultEnd;

  const cacheKey = `cache:${shop}:gsc:v3:${startDate}:${endDate}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const query = (extra: object) =>
    fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        // type:"web" + dataState:"final" match the GSC dashboard's default, stable view.
        body: JSON.stringify({ startDate, endDate, type: "web", dataState: "final", ...extra }),
      }
    );

  const [totalsRes, keywordsRes, pagesRes, devicesRes, countriesRes, dailyRes, sitemapsRes] =
    await Promise.all([
      query({ rowLimit: 1 }),
      query({ dimensions: ["query"], rowLimit: 1000 }),
      query({ dimensions: ["page"], rowLimit: 1000 }),
      query({ dimensions: ["device"], rowLimit: 10 }),
      query({ dimensions: ["country"], rowLimit: 50 }),
      query({ dimensions: ["date"], rowLimit: 90 }),
      fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

  interface GSCRow { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }
  interface SitemapContent { type: string; submitted: number; indexed: number }
  interface Sitemap {
    path: string;
    lastSubmitted?: string;
    lastDownloaded?: string;
    isPending?: boolean;
    isSitemapsIndex?: boolean;
    warnings?: number;
    errors?: number;
    contents?: SitemapContent[];
  }

  const [totals, keywords, pages, devices, countries, daily, sitemapsData] = await Promise.all([
    totalsRes.json() as Promise<{ rows?: GSCRow[]; error?: { message?: string } }>,
    keywordsRes.json() as Promise<{ rows?: GSCRow[] }>,
    pagesRes.json() as Promise<{ rows?: GSCRow[] }>,
    devicesRes.json() as Promise<{ rows?: GSCRow[] }>,
    countriesRes.json() as Promise<{ rows?: GSCRow[] }>,
    dailyRes.json() as Promise<{ rows?: GSCRow[] }>,
    sitemapsRes.json() as Promise<{ sitemap?: Sitemap[] }>,
  ]);

  // Fail loudly rather than caching all-zero metrics when the query errors
  // (expired token, 403 permission, 429 quota). A silent 0 looks like a real
  // "no traffic" period and would be served from cache for 30 min.
  if (!totalsRes.ok || totals.error) {
    return NextResponse.json(
      { error: "gsc_api_error", detail: totals.error?.message ?? `GSC API returned ${totalsRes.status}` },
      { status: 502 }
    );
  }

  const aggRow = totals.rows?.[0];

  // Sitemaps
  const sitemaps = (sitemapsData.sitemap ?? []).map(s => {
    const web = s.contents?.find(c => c.type === "web") ?? s.contents?.[0];
    return {
      path: s.path,
      lastSubmitted: s.lastSubmitted ?? null,
      lastDownloaded: s.lastDownloaded ?? null,
      isPending: s.isPending ?? false,
      errors: s.errors ?? 0,
      warnings: s.warnings ?? 0,
      submitted: web?.submitted ?? 0,
      indexed: web?.indexed ?? 0,
    };
  });

  // Achievements — computed from real data
  const kwRows = keywords.rows ?? [];
  const pageRows = pages.rows ?? [];
  const clicksTotal = aggRow?.clicks ?? 0;
  const avgPos = aggRow ? +aggRow.position.toFixed(1) : 0;
  const ctrPct = aggRow ? +(aggRow.ctr * 100).toFixed(1) : 0;

  // Branded vs non-branded split. Brand token derived from the site's main domain label
  // (e.g. "sc-domain:naachiyars.in" / "https://naachiyars.in/" → "naachiyars"). A query is
  // "branded" when its space-stripped form contains that token.
  const brandLabel = siteUrl
    .replace(/^sc-domain:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "")
    .split(".")[0]
    .toLowerCase();
  const isBranded = (q: string) => brandLabel.length >= 3 && q.toLowerCase().replace(/\s+/g, "").includes(brandLabel);
  let brandedClicks = 0, brandedImpr = 0, nonBrandedClicks = 0, nonBrandedImpr = 0;
  for (const r of kwRows) {
    const q = r.keys?.[0] ?? "";
    if (isBranded(q)) { brandedClicks += r.clicks; brandedImpr += r.impressions; }
    else { nonBrandedClicks += r.clicks; nonBrandedImpr += r.impressions; }
  }
  const branded = { brandLabel, brandedClicks, brandedImpr, nonBrandedClicks, nonBrandedImpr };

  // Clicks distribution by ranking position — shows where your traffic actually comes from.
  const posBuckets = [
    { label: "1–3", min: 0, max: 3 },
    { label: "4–10", min: 3, max: 10 },
    { label: "11–20", min: 10, max: 20 },
    { label: "21+", min: 20, max: Infinity },
  ];
  const positionBuckets = posBuckets.map(b => {
    const rows = kwRows.filter(r => r.position > b.min && r.position <= b.max);
    return {
      label: b.label,
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      keywords: rows.length,
    };
  });

  const page1Keywords = kwRows.filter(r => r.position <= 10).length;
  const top3Keywords = kwRows.filter(r => r.position <= 3).length;
  const highCtrKws = kwRows.filter(r => r.ctr * 100 >= 5 && r.clicks > 0).length;
  const opportunityKws = kwRows.filter(r => r.impressions > 50 && r.ctr * 100 < 3).length;
  const lowCtrPages = pageRows.filter(r => r.impressions > 20 && r.ctr * 100 < 1).length;

  const achievements = [];
  if (clicksTotal >= 10000) achievements.push({ icon: "🏆", label: `${(clicksTotal / 1000).toFixed(1)}K clicks milestone`, type: "good" });
  else if (clicksTotal >= 1000) achievements.push({ icon: "✅", label: "1,000+ clicks", type: "good" });
  if (avgPos > 0 && avgPos <= 5) achievements.push({ icon: "🥇", label: `Avg position ${avgPos} — Top 5!`, type: "good" });
  else if (avgPos <= 10) achievements.push({ icon: "✅", label: `Avg position ${avgPos} — Page 1`, type: "good" });
  if (ctrPct >= 5) achievements.push({ icon: "🔥", label: `CTR ${ctrPct}% — excellent`, type: "good" });
  else if (ctrPct >= 3) achievements.push({ icon: "✅", label: `CTR ${ctrPct}% — above average`, type: "good" });
  if (top3Keywords > 0) achievements.push({ icon: "🎯", label: `${top3Keywords} keyword${top3Keywords > 1 ? "s" : ""} in top 3`, type: "good" });
  if (page1Keywords > 5) achievements.push({ icon: "📈", label: `${page1Keywords} keywords on page 1`, type: "good" });
  if (highCtrKws > 0) achievements.push({ icon: "⚡", label: `${highCtrKws} keyword${highCtrKws > 1 ? "s" : ""} with CTR ≥ 5%`, type: "good" });

  // Issues
  if (opportunityKws > 0) achievements.push({ icon: "⚠️", label: `${opportunityKws} keywords with high impressions but low CTR`, type: "warn" });
  if (lowCtrPages > 0) achievements.push({ icon: "⚠️", label: `${lowCtrPages} pages with low CTR — improve meta titles`, type: "warn" });
  if (avgPos > 20) achievements.push({ icon: "🔴", label: `Avg position ${avgPos} — most content not on page 1`, type: "bad" });
  if (ctrPct < 1 && clicksTotal > 0) achievements.push({ icon: "🔴", label: `CTR ${ctrPct}% — very low, review page titles and descriptions`, type: "bad" });
  const sitemapErrors = sitemaps.reduce((s, m) => s + m.errors, 0);
  if (sitemapErrors > 0) achievements.push({ icon: "🔴", label: `${sitemapErrors} sitemap error${sitemapErrors > 1 ? "s" : ""} detected`, type: "bad" });

  const result = {
    site: siteUrl,
    period: { startDate, endDate },
    kpis: {
      clicks: clicksTotal,
      impressions: aggRow?.impressions ?? 0,
      ctr: ctrPct,
      avgPosition: avgPos,
    },
    // Counts above use the full row set; the UI only shows the top rows, so trim the payload.
    keywords: kwRows.slice(0, 50).map(r => ({
      query: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
      position: +r.position.toFixed(1),
    })),
    pages: pageRows.slice(0, 20).map(r => ({
      page: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
      position: +r.position.toFixed(1),
    })),
    devices: (devices.rows ?? []).map(r => ({
      device: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
    })),
    countries: (countries.rows ?? []).map(r => ({
      country: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
    })),
    daily: (daily.rows ?? []).map(r => ({
      date: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
    })),
    sitemaps,
    achievements,
    branded,
    positionBuckets,
  };
  kv.set(cacheKey, result, { ex: 1800 }).catch(() => {});
  return NextResponse.json(result);
}
