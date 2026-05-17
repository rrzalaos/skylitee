import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google";

interface GA4Metric { name: string; }
interface GA4Dimension { name: string; }
interface GA4Row { dimensionValues: { value: string }[]; metricValues: { value: string }[]; }

export async function GET(req: NextRequest) {
  const refreshToken =
    req.cookies.get("google_ga4_token")?.value ??
    req.cookies.get("google_refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const token = await getGoogleAccessToken(refreshToken);

  const properties: { property: string; displayName: string }[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json() as {
      accountSummaries?: { propertySummaries?: { property: string; displayName: string }[] }[];
      nextPageToken?: string;
    };
    properties.push(...(data.accountSummaries ?? []).flatMap(a => a.propertySummaries ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  if (properties.length === 0) return NextResponse.json({ error: "no_properties" });

  const savedProperty = req.cookies.get("google_ga4_property")?.value;
  const selected = (savedProperty && properties.find(p => p.property === savedProperty)) || properties[0];
  const propertyId = selected.property;
  const propertyName = selected.displayName;

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const startDate = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const endDate = req.nextUrl.searchParams.get("to") ?? defaultEnd;
  const dateRanges = [{ startDate, endDate }];

  const runReport = async (dimensions: GA4Dimension[], metrics: GA4Metric[], limit = 10) => {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ dateRanges, dimensions, metrics, limit }),
    });
    return res.json() as Promise<{ rows?: GA4Row[] }>;
  };

  const [overviewData, channelData, pageData, deviceData, countryData, dailyData, landingData] = await Promise.all([
    runReport([], [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
      { name: "newUsers" },
    ], 1),
    runReport([{ name: "sessionDefaultChannelGroup" }], [
      { name: "sessions" },
      { name: "activeUsers" },
    ], 10),
    runReport([{ name: "pagePath" }], [
      { name: "screenPageViews" },
      { name: "sessions" },
      { name: "bounceRate" },
    ], 20),
    runReport([{ name: "deviceCategory" }], [
      { name: "sessions" },
      { name: "activeUsers" },
    ], 5),
    runReport([{ name: "country" }], [
      { name: "sessions" },
      { name: "activeUsers" },
    ], 15),
    runReport([{ name: "date" }], [
      { name: "sessions" },
      { name: "activeUsers" },
    ], 90),
    runReport([{ name: "landingPage" }], [
      { name: "sessions" },
      { name: "bounceRate" },
      { name: "newUsers" },
    ], 10),
  ]);

  const ovRow = overviewData.rows?.[0];
  const sessions = ovRow ? parseInt(ovRow.metricValues[0].value) : 0;
  const users = ovRow ? parseInt(ovRow.metricValues[1].value) : 0;
  const pageviews = ovRow ? parseInt(ovRow.metricValues[2].value) : 0;
  const bounceRate = ovRow ? +(parseFloat(ovRow.metricValues[3].value) * 100).toFixed(1) : 0;
  const avgSessionSec = ovRow ? Math.round(parseFloat(ovRow.metricValues[4].value)) : 0;
  const avgSessionMin = `${Math.floor(avgSessionSec / 60)}m ${avgSessionSec % 60}s`;
  const newUsers = ovRow ? parseInt(ovRow.metricValues[5].value) : 0;

  return NextResponse.json({
    property: propertyName,
    period: { startDate, endDate },
    kpis: { sessions, users, pageviews, bounceRate, avgSessionMin, newUsers },
    channels: (channelData.rows ?? []).map(r => ({
      channel: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    pages: (pageData.rows ?? []).map(r => ({
      page: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
      sessions: parseInt(r.metricValues[1].value),
      bounceRate: +(parseFloat(r.metricValues[2].value) * 100).toFixed(1),
    })),
    devices: (deviceData.rows ?? []).map(r => ({
      device: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    countries: (countryData.rows ?? []).map(r => ({
      country: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    daily: (dailyData.rows ?? []).map(r => ({
      date: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    landingPages: (landingData.rows ?? []).map(r => ({
      page: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      bounceRate: +(parseFloat(r.metricValues[1].value) * 100).toFixed(1),
      newUsers: parseInt(r.metricValues[2].value),
    })),
  });
}
