import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getGoogleAccessToken } from "@/lib/google";
import { getGscRefreshToken, getGscSite, getAuthorizedShop } from "@/lib/session";
import { daysAgoInTz } from "@/lib/timezone";

interface GSCRow { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }

// Month-over-month GSC KPIs. ?months=N (1–12, default 6). One date-dimension query,
// bucketed to months (position is impression-weighted, the only correct way to average it).
export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const refreshToken = await getGscRefreshToken(req, shop);
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const token = await getGoogleAccessToken(refreshToken);

  const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: { Authorization: `Bearer ${token}` } });
  const sitesData = await sitesRes.json() as { siteEntry?: { siteUrl: string }[] };
  const sites = sitesData.siteEntry ?? [];
  if (sites.length === 0) return NextResponse.json({ error: "no_sites" });
  const savedSite = await getGscSite(req, shop);
  const siteUrl = savedSite && sites.find(s => s.siteUrl === savedSite) ? savedSite : sites[0].siteUrl;

  const months = Math.min(12, Math.max(1, parseInt(req.nextUrl.searchParams.get("months") ?? "6", 10)));
  const cacheKey = `cache:${shop}:gscmonthly:${siteUrl}:${months}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  // First day of month (months-1) back → 3 days ago in Pacific (GSC lag), both as PT dates.
  const PT = "America/Los_Angeles";
  const endDate = daysAgoInTz(PT, 3);
  const startMonth = endDate.slice(0, 7);                       // YYYY-MM of the end
  const [ey, em] = startMonth.split("-").map(Number);
  const startD = new Date(ey, em - 1 - (months - 1), 1);
  const startDate = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, "0")}-01`;

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date"], type: "web", dataState: "final", rowLimit: 1000 }),
    }
  );
  const json = await res.json() as { rows?: GSCRow[]; error?: unknown };
  if (!res.ok || json.error) return NextResponse.json({ error: "report_failed" }, { status: 502 });

  // Bucket daily rows into months; position averaged weighted by impressions.
  const acc: Record<string, { clicks: number; impressions: number; posWeighted: number }> = {};
  for (const r of json.rows ?? []) {
    const ym = (r.keys?.[0] ?? "").slice(0, 7);                 // date is "YYYY-MM-DD"
    if (!ym) continue;
    const a = acc[ym] ?? { clicks: 0, impressions: 0, posWeighted: 0 };
    a.clicks += r.clicks; a.impressions += r.impressions; a.posWeighted += r.position * r.impressions;
    acc[ym] = a;
  }

  const monthsOut = Object.entries(acc).map(([ym, a]) => {
    const date = new Date(parseInt(ym.slice(0, 4)), parseInt(ym.slice(5, 7)) - 1, 1);
    return {
      ym,
      label: date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      clicks: a.clicks,
      impressions: a.impressions,
      ctr: a.impressions > 0 ? +((a.clicks / a.impressions) * 100).toFixed(2) : 0,
      position: a.impressions > 0 ? +(a.posWeighted / a.impressions).toFixed(1) : 0,
    };
  }).sort((x, y) => x.ym.localeCompare(y.ym));

  const result = { site: siteUrl, months: monthsOut };
  kv.set(cacheKey, result, { ex: 1800 }).catch(() => {});
  return NextResponse.json(result);
}
