import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google";

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get("google_refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const token = await getGoogleAccessToken(refreshToken);

  // List sites
  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sitesData = await sitesRes.json() as { siteEntry?: { siteUrl: string }[] };
  const sites = sitesData.siteEntry ?? [];

  if (sites.length === 0) return NextResponse.json({ error: "no_sites" });

  const savedSite = req.cookies.get("google_gsc_site")?.value;
  const siteUrl = savedSite && sites.find(s => s.siteUrl === savedSite)
    ? savedSite
    : sites[0].siteUrl;
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];
  const startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Aggregate totals
  const [totalsRes, keywordsRes, pagesRes] = await Promise.all([
    fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, rowLimit: 1 }),
    }),
    fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["query"], rowLimit: 20, dimensionFilterGroups: [] }),
    }),
    fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 10 }),
    }),
  ]);

  interface GSCRow { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number; }
  const totals = await totalsRes.json() as { rows?: GSCRow[] };
  const keywords = await keywordsRes.json() as { rows?: GSCRow[] };
  const pages = await pagesRes.json() as { rows?: GSCRow[] };

  const aggRow = totals.rows?.[0];

  return NextResponse.json({
    site: siteUrl,
    period: { startDate, endDate },
    kpis: {
      clicks: aggRow?.clicks ?? 0,
      impressions: aggRow?.impressions ?? 0,
      ctr: aggRow ? +(aggRow.ctr * 100).toFixed(1) : 0,
      avgPosition: aggRow ? +aggRow.position.toFixed(1) : 0,
    },
    keywords: (keywords.rows ?? []).map(r => ({
      query: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
      position: +r.position.toFixed(1),
    })),
    pages: (pages.rows ?? []).map(r => ({
      page: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(1),
    })),
  });
}
