import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getGoogleAccessToken } from "@/lib/google";
import { getGscRefreshToken, getGscSite, getAuthorizedShop } from "@/lib/session";

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const refreshToken = await getGscRefreshToken(req, shop);
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const token = await getGoogleAccessToken(refreshToken);

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

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const startDate = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const endDate = req.nextUrl.searchParams.get("to") ?? defaultEnd;

  const cacheKey = `cache:${shop}:gsc:${startDate}:${endDate}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const query = (extra: object) =>
    fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, ...extra }),
      }
    );

  const [totalsRes, keywordsRes, pagesRes, devicesRes, countriesRes, dailyRes, sitemapsRes] =
    await Promise.all([
      query({ rowLimit: 1 }),
      query({ dimensions: ["query"], rowLimit: 50 }),
      query({ dimensions: ["page"], rowLimit: 20 }),
      query({ dimensions: ["device"], rowLimit: 10 }),
      query({ dimensions: ["country"], rowLimit: 15 }),
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
    totalsRes.json() as Promise<{ rows?: GSCRow[] }>,
    keywordsRes.json() as Promise<{ rows?: GSCRow[] }>,
    pagesRes.json() as Promise<{ rows?: GSCRow[] }>,
    devicesRes.json() as Promise<{ rows?: GSCRow[] }>,
    countriesRes.json() as Promise<{ rows?: GSCRow[] }>,
    dailyRes.json() as Promise<{ rows?: GSCRow[] }>,
    sitemapsRes.json() as Promise<{ sitemap?: Sitemap[] }>,
  ]);

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
    keywords: kwRows.map(r => ({
      query: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
      position: +r.position.toFixed(1),
    })),
    pages: pageRows.map(r => ({
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
  };
  kv.set(cacheKey, result, { ex: 1800 }).catch(() => {});
  return NextResponse.json(result);
}
