import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getShopFromRequest } from "@/lib/session";
import { resolveMetaAccount } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };

interface HourlyRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
  hourly_stats_aggregated_by_advertiser_time_zone?: string;
}

interface DailyRow {
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
}

function actInt(arr: ActionEntry[] | undefined, type: string): number {
  return Math.round(parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0"));
}
function actVal(arr: ActionEntry[] | undefined, type: string): number {
  return parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0");
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(req: NextRequest) {
  const shop = getShopFromRequest(req) ?? "unknown";
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const from = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const to = req.nextUrl.searchParams.get("to") ?? defaultEnd;
  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });

  const fields = "spend,impressions,clicks,actions,action_values";

  const [hourlyRes, dailyRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/insights?fields=${fields}&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&time_range=${timeRange}&limit=50&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/insights?fields=${fields}&time_increment=1&time_range=${timeRange}&limit=100&action_attribution_windows=${attrWindows}&access_token=${token}`),
  ]);

  const [hourlyData, dailyData] = await Promise.all([
    hourlyRes.json() as Promise<{ data?: HourlyRow[]; error?: { message: string } }>,
    dailyRes.json() as Promise<{ data?: DailyRow[] }>,
  ]);

  if (hourlyData.error) return NextResponse.json({ error: hourlyData.error.message }, { status: 400 });

  // Build hourly buckets 0–23
  type Bucket = { spend: number; impressions: number; clicks: number; purchases: number; purchaseValue: number };
  const hourlyMap = new Map<number, Bucket>();
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0 });
  }

  for (const row of hourlyData.data ?? []) {
    const hour = parseInt(row.hourly_stats_aggregated_by_advertiser_time_zone ?? "-1");
    if (hour < 0 || hour > 23) continue;
    const purchases = Math.max(
      actInt(row.actions, "offsite_conversion.fb_pixel_purchase"),
      actInt(row.actions, "purchase")
    );
    const purchaseValue = Math.max(
      actVal(row.action_values, "offsite_conversion.fb_pixel_purchase"),
      actVal(row.action_values, "purchase")
    );
    const e = hourlyMap.get(hour)!;
    e.spend += parseFloat(row.spend ?? "0");
    e.impressions += parseInt(row.impressions ?? "0");
    e.clicks += parseInt(row.clicks ?? "0");
    e.purchases += purchases;
    e.purchaseValue += purchaseValue;
  }

  const hourly = Array.from(hourlyMap.entries()).map(([hour, d]) => ({
    hour,
    label: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`,
    spend: +d.spend.toFixed(2),
    impressions: d.impressions,
    clicks: d.clicks,
    purchases: d.purchases,
    purchaseValue: +d.purchaseValue.toFixed(2),
    roas: d.spend > 0 ? +(d.purchaseValue / d.spend).toFixed(2) : 0,
    ctr: d.impressions > 0 ? +(d.clicks / d.impressions * 100).toFixed(2) : 0,
  }));

  // Build day-of-week buckets (0=Sun … 6=Sat)
  type DowBucket = Bucket & { count: number };
  const dowMap = new Map<number, DowBucket>();
  for (let i = 0; i < 7; i++) {
    dowMap.set(i, { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0, count: 0 });
  }

  for (const row of dailyData.data ?? []) {
    if (!row.date_start) continue;
    const dow = new Date(row.date_start + "T12:00:00Z").getUTCDay();
    const purchases = Math.max(
      actInt(row.actions, "offsite_conversion.fb_pixel_purchase"),
      actInt(row.actions, "purchase")
    );
    const purchaseValue = Math.max(
      actVal(row.action_values, "offsite_conversion.fb_pixel_purchase"),
      actVal(row.action_values, "purchase")
    );
    const e = dowMap.get(dow)!;
    e.spend += parseFloat(row.spend ?? "0");
    e.impressions += parseInt(row.impressions ?? "0");
    e.clicks += parseInt(row.clicks ?? "0");
    e.purchases += purchases;
    e.purchaseValue += purchaseValue;
    e.count += 1;
  }

  // Mon-first order
  const dowOrder = [1, 2, 3, 4, 5, 6, 0];
  const dayOfWeek = dowOrder.map(dow => {
    const d = dowMap.get(dow)!;
    return {
      dow,
      label: DAY_NAMES[dow].slice(0, 3),
      days: d.count,
      spend: +d.spend.toFixed(2),
      spendPerDay: d.count > 0 ? +(d.spend / d.count).toFixed(2) : 0,
      purchases: d.purchases,
      purchaseValue: +d.purchaseValue.toFixed(2),
      roas: d.spend > 0 ? +(d.purchaseValue / d.spend).toFixed(2) : 0,
    };
  });

  const peakHour = hourly.reduce((best, h) => h.purchases > best.purchases ? h : best, hourly[0]);
  const peakDay = dayOfWeek.reduce((best, d) => d.roas > best.roas ? d : best, dayOfWeek[0]);
  const totalSpend = hourly.reduce((s, h) => s + h.spend, 0);

  return NextResponse.json({
    adAccountName: selected.name,
    currency: selected.currency,
    period: { from, to },
    hourly,
    dayOfWeek,
    totalSpend: +totalSpend.toFixed(2),
    peaks: {
      hour: peakHour.hour,
      hourLabel: peakHour.label,
      hourPurchases: peakHour.purchases,
      day: peakDay.label,
      dayRoas: peakDay.roas,
    },
  });
}
