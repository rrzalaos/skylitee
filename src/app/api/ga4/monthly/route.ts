import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getGoogleAccessToken } from "@/lib/google";
import { getGa4RefreshToken, getGa4Property, getAuthorizedShop } from "@/lib/session";

interface GA4Row { dimensionValues: { value: string }[]; metricValues: { value: string }[] }

// Month-over-month GA4 KPIs. ?months=N (1–12, default 6). Returns one row per calendar
// month so the dashboard can render a KPI × month trend table.
export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const refreshToken = await getGa4RefreshToken(req, shop);
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const token = await getGoogleAccessToken(refreshToken);

  // Resolve property (same as /api/ga4).
  const properties: { property: string; displayName: string }[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json() as { accountSummaries?: { propertySummaries?: { property: string; displayName: string }[] }[]; nextPageToken?: string };
    properties.push(...(data.accountSummaries ?? []).flatMap(a => a.propertySummaries ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  if (properties.length === 0) return NextResponse.json({ error: "no_properties" });

  const savedProperty = await getGa4Property(req, shop);
  const selected = (savedProperty && properties.find(p => p.property === savedProperty)) || properties[0];
  const propertyId = selected.property;

  const months = Math.min(12, Math.max(1, parseInt(req.nextUrl.searchParams.get("months") ?? "6", 10)));
  const cacheKey = `cache:${shop}:ga4monthly:${propertyId}:${months}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  // First day of the month (months-1) back → today.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const dateRanges = [{ startDate, endDate: "today" }];

  const run = async (dimensions: { name: string }[], metrics: { name: string }[]) => {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ dateRanges, dimensions, metrics, limit: 1000 }),
    });
    const json = await res.json() as { rows?: GA4Row[]; error?: unknown };
    if (!res.ok || json.error) throw new Error("GA4 monthly report failed");
    return json.rows ?? [];
  };

  try {
    const [coreRows, channelRows] = await Promise.all([
      run([{ name: "yearMonth" }], [
        { name: "sessions" }, { name: "activeUsers" }, { name: "newUsers" },
        { name: "screenPageViews" }, { name: "bounceRate" }, { name: "averageSessionDuration" },
        { name: "engagementRate" }, { name: "ecommercePurchases" }, { name: "purchaseRevenue" },
      ]),
      run([{ name: "yearMonth" }, { name: "sessionDefaultChannelGroup" }], [{ name: "sessions" }]),
    ]);

    // Organic-search sessions per yearMonth.
    const organicByYm: Record<string, number> = {};
    for (const r of channelRows) {
      const ym = r.dimensionValues[0]?.value ?? "";
      const ch = (r.dimensionValues[1]?.value ?? "").toLowerCase();
      if (ch.includes("organic")) organicByYm[ym] = (organicByYm[ym] ?? 0) + parseInt(r.metricValues[0]?.value ?? "0");
    }

    const monthsOut = coreRows.map(r => {
      const ym = r.dimensionValues[0]?.value ?? "";          // "YYYYMM"
      const m = r.metricValues.map(v => parseFloat(v.value || "0"));
      const sessions = Math.round(m[0]), users = Math.round(m[1]), newUsers = Math.round(m[2]);
      const date = new Date(parseInt(ym.slice(0, 4)), parseInt(ym.slice(4, 6)) - 1, 1);
      return {
        ym,
        label: date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        sessions, users, newUsers,
        returningUsers: Math.max(0, users - newUsers),
        pageviews: Math.round(m[3]),
        bounceRate: +(m[4] * 100).toFixed(1),
        avgDurationSec: Math.round(m[5]),
        engagementRate: +(m[6] * 100).toFixed(1),
        purchases: Math.round(m[7]),
        revenue: Math.round(m[8]),
        organic: organicByYm[ym] ?? 0,
        convRate: sessions > 0 ? +((m[7] / sessions) * 100).toFixed(2) : 0,
      };
    }).sort((a, b) => a.ym.localeCompare(b.ym));

    const result = { property: selected.displayName, months: monthsOut };
    kv.set(cacheKey, result, { ex: 1800 }).catch(() => {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "report_failed" }, { status: 502 });
  }
}
