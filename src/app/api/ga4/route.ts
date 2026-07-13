import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getGoogleAccessToken } from "@/lib/google";
import { getGa4RefreshToken, getGa4Property, getAuthorizedShop } from "@/lib/session";

interface GA4Metric { name: string }
interface GA4Dimension { name: string }
interface GA4Row { dimensionValues: { value: string }[]; metricValues: { value: string }[] }

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const refreshToken = await getGa4RefreshToken(req, shop);
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  let token: string;
  try {
    token = await getGoogleAccessToken(refreshToken);
  } catch (e) {
    return NextResponse.json({ error: "ga4_auth_error", detail: String(e) }, { status: 502 });
  }

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

  const savedProperty = await getGa4Property(req, shop);
  const selected = (savedProperty && properties.find(p => p.property === savedProperty)) || properties[0];
  const propertyId = selected.property;
  const propertyName = selected.displayName;

  // Default to GA4 relative dates — GA4 resolves "today"/"NdaysAgo" in the PROPERTY's
  // timezone, so the default window matches the GA4 UI instead of the server's UTC day.
  const startDate = req.nextUrl.searchParams.get("from") ?? "28daysAgo";
  const endDate = req.nextUrl.searchParams.get("to") ?? "today";

  // ?organic=1 adds an Organic-Search-only block (summary + landing pages) for the SEO report.
  const organic = req.nextUrl.searchParams.get("organic") === "1";
  const cacheKey = `cache:${shop}:ga4:v2:${startDate}:${endDate}:org${organic ? 1 : 0}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const dateRanges = [{ startDate, endDate }];

  const runReport = async (dimensions: GA4Dimension[], metrics: GA4Metric[], limit = 10, dimensionFilter?: object) => {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ dateRanges, dimensions, metrics, limit, ...(dimensionFilter ? { dimensionFilter } : {}) }),
    });
    const json = await res.json() as { rows?: GA4Row[]; error?: unknown };
    // Throw on API errors (quota/permission/invalid metric) so this report resolves to null
    // via Promise.allSettled instead of being read as real "zero" data.
    if (!res.ok || json.error) throw new Error(`GA4 report failed: ${res.status}`);
    return json;
  };

  const [
    overviewData, channelData, pageData, deviceData, countryData,
    dailyData, landingData, ecomData, itemData, newReturningData, cityData, regionData,
  ] = await Promise.allSettled([
    runReport([], [
      { name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" },
      { name: "bounceRate" }, { name: "averageSessionDuration" }, { name: "newUsers" },
    ], 1),
    runReport([{ name: "sessionDefaultChannelGroup" }], [
      { name: "sessions" }, { name: "activeUsers" },
      { name: "ecommercePurchases" }, { name: "purchaseRevenue" },
    ], 10),
    runReport([{ name: "pagePath" }], [
      { name: "screenPageViews" }, { name: "sessions" }, { name: "bounceRate" },
    ], 20),
    runReport([{ name: "deviceCategory" }], [
      { name: "sessions" }, { name: "activeUsers" },
    ], 5),
    runReport([{ name: "country" }], [
      { name: "sessions" }, { name: "activeUsers" },
    ], 15),
    runReport([{ name: "date" }], [
      { name: "sessions" }, { name: "activeUsers" },
    ], 90),
    runReport([{ name: "landingPage" }], [
      { name: "sessions" }, { name: "bounceRate" }, { name: "newUsers" },
    ], 10),
    // Ecommerce aggregate
    runReport([], [
      { name: "itemsViewed" }, { name: "itemsAddedToCart" },
      { name: "itemsCheckedOut" }, { name: "itemsPurchased" },
      { name: "ecommercePurchases" }, { name: "purchaseRevenue" },
    ], 1),
    // Item-level ecommerce
    runReport([{ name: "itemName" }], [
      { name: "itemsViewed" }, { name: "itemsAddedToCart" },
      { name: "itemsCheckedOut" }, { name: "itemsPurchased" }, { name: "itemRevenue" },
    ], 20),
    // New vs Returning
    runReport([{ name: "newVsReturning" }], [
      { name: "sessions" }, { name: "activeUsers" },
      { name: "ecommercePurchases" }, { name: "purchaseRevenue" },
    ], 5),
    // Cities
    runReport([{ name: "city" }], [{ name: "sessions" }, { name: "activeUsers" }], 10),
    // Regions (states)
    runReport([{ name: "region" }], [{ name: "sessions" }, { name: "activeUsers" }], 10),
  ]);

  const safe = <T>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  const overview = safe(overviewData);
  const channels = safe(channelData);
  const pages = safe(pageData);
  const devices = safe(deviceData);
  const countries = safe(countryData);
  const daily = safe(dailyData);
  const landing = safe(landingData);
  const ecom = safe(ecomData);
  const items = safe(itemData);
  const newRet = safe(newReturningData);
  const cities = safe(cityData);
  const regions = safe(regionData);

  const ovRow = overview?.rows?.[0];
  const sessions = ovRow ? parseInt(ovRow.metricValues[0].value) : 0;
  const users = ovRow ? parseInt(ovRow.metricValues[1].value) : 0;
  const pageviews = ovRow ? parseInt(ovRow.metricValues[2].value) : 0;
  const bounceRate = ovRow ? +(parseFloat(ovRow.metricValues[3].value) * 100).toFixed(1) : 0;
  const avgSessionSec = ovRow ? Math.round(parseFloat(ovRow.metricValues[4].value)) : 0;
  const avgSessionMin = `${Math.floor(avgSessionSec / 60)}m ${avgSessionSec % 60}s`;
  const newUsers = ovRow ? parseInt(ovRow.metricValues[5].value) : 0;

  // Ecommerce funnel
  const eRow = ecom?.rows?.[0];
  const ecommerce = eRow ? {
    itemsViewed: parseInt(eRow.metricValues[0].value),
    itemsAddedToCart: parseInt(eRow.metricValues[1].value),
    itemsCheckedOut: parseInt(eRow.metricValues[2].value),
    itemsPurchased: parseInt(eRow.metricValues[3].value),
    purchases: parseInt(eRow.metricValues[4].value),
    revenue: parseFloat(eRow.metricValues[5].value),
    atcRate: eRow ? +(parseInt(eRow.metricValues[1].value) / Math.max(parseInt(eRow.metricValues[0].value), 1) * 100).toFixed(1) : 0,
    checkoutRate: eRow ? +(parseInt(eRow.metricValues[2].value) / Math.max(parseInt(eRow.metricValues[1].value), 1) * 100).toFixed(1) : 0,
    purchaseRate: eRow ? +(parseInt(eRow.metricValues[3].value) / Math.max(parseInt(eRow.metricValues[2].value), 1) * 100).toFixed(1) : 0,
  } : null;

  // Organic-Search-only block (SEO report). Channel-filtered so we measure the quality and
  // revenue of search-driven visits specifically, not all traffic.
  const ORGANIC_FILTER = { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { value: "Organic Search", matchType: "EXACT" } } };
  let organicSummary: {
    sessions: number; users: number; bounceRate: number; avgSessionSec: number;
    purchases: number; revenue: number; engagementRate: number;
  } | null = null;
  let organicLandingPages: { page: string; sessions: number; bounceRate: number; purchases: number; revenue: number }[] = [];
  if (organic) {
    const [osData, olData] = await Promise.allSettled([
      runReport([], [
        { name: "sessions" }, { name: "activeUsers" }, { name: "bounceRate" },
        { name: "averageSessionDuration" }, { name: "ecommercePurchases" },
        { name: "purchaseRevenue" }, { name: "engagementRate" },
      ], 1, ORGANIC_FILTER),
      runReport([{ name: "landingPage" }], [
        { name: "sessions" }, { name: "bounceRate" },
        { name: "ecommercePurchases" }, { name: "purchaseRevenue" },
      ], 100, ORGANIC_FILTER),
    ]);
    const os = safe(osData); const ol = safe(olData);
    const osRow = os?.rows?.[0];
    organicSummary = osRow ? {
      sessions: parseInt(osRow.metricValues[0].value),
      users: parseInt(osRow.metricValues[1].value),
      bounceRate: +(parseFloat(osRow.metricValues[2].value) * 100).toFixed(1),
      avgSessionSec: Math.round(parseFloat(osRow.metricValues[3].value)),
      purchases: parseInt(osRow.metricValues[4].value),
      revenue: parseFloat(osRow.metricValues[5].value),
      engagementRate: +(parseFloat(osRow.metricValues[6].value) * 100).toFixed(1),
    } : null;
    organicLandingPages = (ol?.rows ?? []).map(r => ({
      page: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      bounceRate: +(parseFloat(r.metricValues[1].value) * 100).toFixed(1),
      purchases: parseInt(r.metricValues[2].value),
      revenue: parseFloat(r.metricValues[3].value),
    }));
  }

  const result = {
    property: propertyName,
    period: { startDate, endDate },
    organic: organicSummary,
    organicLandingPages,
    kpis: { sessions, users, pageviews, bounceRate, avgSessionMin, newUsers },
    channels: (channels?.rows ?? []).map(r => ({
      channel: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
      purchases: parseInt(r.metricValues[2].value),
      revenue: parseFloat(r.metricValues[3].value),
    })),
    pages: (pages?.rows ?? []).map(r => ({
      page: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
      sessions: parseInt(r.metricValues[1].value),
      bounceRate: +(parseFloat(r.metricValues[2].value) * 100).toFixed(1),
    })),
    devices: (devices?.rows ?? []).map(r => ({
      device: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    countries: (countries?.rows ?? []).map(r => ({
      country: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    daily: (daily?.rows ?? []).map(r => ({
      date: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    landingPages: (landing?.rows ?? []).map(r => ({
      page: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      bounceRate: +(parseFloat(r.metricValues[1].value) * 100).toFixed(1),
      newUsers: parseInt(r.metricValues[2].value),
    })),
    ecommerce,
    items: (items?.rows ?? []).map(r => ({
      name: r.dimensionValues[0].value,
      viewed: parseInt(r.metricValues[0].value),
      addedToCart: parseInt(r.metricValues[1].value),
      checkedOut: parseInt(r.metricValues[2].value),
      purchased: parseInt(r.metricValues[3].value),
      revenue: parseFloat(r.metricValues[4].value),
    })),
    newVsReturning: (newRet?.rows ?? []).map(r => ({
      type: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
      purchases: parseInt(r.metricValues[2].value),
      revenue: parseFloat(r.metricValues[3].value),
    })),
    cities: (cities?.rows ?? []).filter(r => r.dimensionValues[0].value !== "(not set)").map(r => ({
      city: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    regions: (regions?.rows ?? []).filter(r => r.dimensionValues[0].value !== "(not set)").map(r => ({
      region: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
  };
  kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
