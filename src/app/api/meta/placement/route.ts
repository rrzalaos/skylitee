import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount, leadCount } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };

interface PlacementRow {
  campaign_id?: string;
  publisher_platform?: string;
  platform_position?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
}

// Generic row for the age / gender / device / hourly breakdowns (same metric fields,
// just a different breakdown key column).
interface BreakdownRow {
  age?: string;
  gender?: string;
  impression_device?: string;
  hourly_stats_aggregated_by_advertiser_time_zone?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
}

function actInt(arr: ActionEntry[] | undefined, type: string): number {
  return Math.round(parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0"));
}
function actVal(arr: ActionEntry[] | undefined, type: string): number {
  return parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0");
}

// leadCount shared from @/lib/meta — matches Ads Manager "Results" (priority, not max).

function friendlyLabel(platform: string, position: string): string {
  const p = platform.toLowerCase();
  const pos = position.toLowerCase();
  if (p === "facebook") {
    if (pos === "feed") return "Facebook Feed";
    if (pos === "video_feeds") return "Facebook Video Feed";
    if (pos === "right_hand_column") return "Facebook Right Column";
    if (pos === "stories") return "Facebook Stories";
    if (pos === "reels") return "Facebook Reels";
    if (pos === "search") return "Facebook Search";
    if (pos === "marketplace") return "Facebook Marketplace";
    return `Facebook · ${position}`;
  }
  if (p === "instagram") {
    if (pos === "stream") return "Instagram Feed";
    if (pos === "story") return "Instagram Stories";
    if (pos === "reels") return "Instagram Reels";
    if (pos === "explore") return "Instagram Explore";
    if (pos === "explore_home") return "Instagram Explore Home";
    if (pos === "profile_feed") return "Instagram Profile";
    return `Instagram · ${position}`;
  }
  if (p === "audience_network") return `Audience Network · ${position}`;
  if (p === "messenger") {
    if (pos === "story") return "Messenger Stories";
    return "Messenger";
  }
  return `${platform} · ${position}`;
}

// Normalize a Meta campaign objective to the buckets the UI filters by.
function normObj(raw: string): string {
  const r = (raw ?? "").toUpperCase();
  if (r.includes("SALES") || r.includes("CONVERSION")) return "SALES";
  if (r.includes("TRAFFIC") || r.includes("LINK_CLICK")) return "TRAFFIC";
  if (r.includes("AWARENESS") || r.includes("REACH") || r.includes("BRAND") || r.includes("VIDEO")) return "AWARENESS";
  if (r.includes("ENGAGEMENT")) return "ENGAGEMENT";
  if (r.includes("LEAD")) return "LEADS";
  if (r.includes("APP")) return "APP";
  return "OTHER";
}

function platformGroup(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "facebook") return "Facebook";
  if (p === "instagram") return "Instagram";
  if (p === "audience_network") return "Audience Network";
  if (p === "messenger") return "Messenger";
  return platform;
}

const GRAPH = "https://graph.facebook.com/v19.0";
const METRIC_FIELDS = "spend,impressions,clicks,ctr,cpc,cpm,reach,actions,action_values";

// One bucket of a breakdown (age range, gender, device, hour) with the full metric set.
function bucketFromRow(row: BreakdownRow, key: string, label: string, sort: number) {
  const spend = parseFloat(row.spend ?? "0");
  const purchases = Math.max(actInt(row.actions, "offsite_conversion.fb_pixel_purchase"), actInt(row.actions, "purchase"));
  const purchaseValue = Math.max(actVal(row.action_values, "offsite_conversion.fb_pixel_purchase"), actVal(row.action_values, "purchase"));
  const atc = Math.max(actInt(row.actions, "offsite_conversion.fb_pixel_add_to_cart"), actInt(row.actions, "add_to_cart"));
  const clicks = parseInt(row.clicks ?? "0");
  const lpv = actInt(row.actions, "landing_page_view");
  const leads = leadCount(row.actions);
  return {
    key, label, sort,
    spend: +spend.toFixed(2),
    impressions: parseInt(row.impressions ?? "0"),
    reach: parseInt(row.reach ?? "0"),
    clicks,
    ctr: +parseFloat(row.ctr ?? "0").toFixed(2),
    cpc: +parseFloat(row.cpc ?? "0").toFixed(2),
    cpm: +parseFloat(row.cpm ?? "0").toFixed(2),
    purchases,
    purchaseValue: +purchaseValue.toFixed(2),
    atc,
    lpv,
    leads,
    roas: spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0,
    cac: purchases > 0 ? +(spend / purchases).toFixed(2) : 0,
    costPerLead: leads > 0 ? +(spend / leads).toFixed(2) : 0,
    lpRatio: clicks > 0 ? +(lpv / clicks * 100).toFixed(1) : 0,
    costPerLpv: lpv > 0 ? +(spend / lpv).toFixed(2) : 0,
    convRate: clicks > 0 ? +(purchases / clicks * 100).toFixed(2) : 0,
    spendPct: 0, // filled in once the dimension total is known
  };
}
type Bucket = ReturnType<typeof bucketFromRow>;

// Tolerant breakdown fetch — if one breakdown errors (e.g. an unsupported field combo),
// return [] so the rest of the page still loads.
async function getBreakdown(accountId: string, token: string, breakdown: string, timeRange: string, attrWindows: string, includeReach = true): Promise<BreakdownRow[]> {
  const fields = includeReach ? METRIC_FIELDS : METRIC_FIELDS.replace(",reach", "");
  try {
    const res = await fetch(`${GRAPH}/${accountId}/insights?fields=${fields}&breakdowns=${breakdown}&time_range=${timeRange}&limit=500&action_attribution_windows=${attrWindows}&access_token=${token}`);
    const d = await res.json() as { data?: BreakdownRow[]; error?: unknown };
    if (d.error) return [];
    return d.data ?? [];
  } catch { return []; }
}

function finalize(buckets: Bucket[]): Bucket[] {
  const total = buckets.reduce((s, b) => s + b.spend, 0);
  for (const b of buckets) b.spendPct = total > 0 ? +(b.spend / total * 100).toFixed(1) : 0;
  return buckets.sort((a, b) => a.sort - b.sort);
}

const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const GENDER_LABEL: Record<string, string> = { male: "Male", female: "Female", unknown: "Uncategorized" };
function deviceLabel(d: string): string {
  const m: Record<string, string> = {
    iphone: "iPhone", ipad: "iPad", ipod: "iPod",
    android_smartphone: "Android Phone", android_tablet: "Android Tablet",
    desktop: "Desktop", other: "Other",
  };
  return m[d.toLowerCase()] ?? d.replace(/_/g, " ");
}
function hourLabel(raw: string): { label: string; hour: number } {
  const hour = parseInt(raw.slice(0, 2));
  const end = (hour + 1);
  return { label: `${hour}:00–${end}:00`, hour: isNaN(hour) ? 99 : hour };
}

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const defaultStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const from = req.nextUrl.searchParams.get("from") ?? defaultStart;
  const to = req.nextUrl.searchParams.get("to") ?? defaultEnd;

  const cacheKey = `cache:${shop}:meta:placement:v3:${from}:${to}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });

  // Placement is fetched at CAMPAIGN level (so each row carries campaign_id → objective),
  // letting us split placement performance per objective instead of one blended figure.
  // The age/gender/device/time breakdowns stay account-level (across all objectives).
  const [campRes, placementRes, ageRows, genderRows, deviceRows, hourlyRows] = await Promise.all([
    fetch(`${GRAPH}/${selected.id}/campaigns?fields=id,objective&limit=500&access_token=${token}`),
    fetch(`${GRAPH}/${selected.id}/insights?fields=campaign_id,${METRIC_FIELDS}&breakdowns=publisher_platform,platform_position&level=campaign&time_range=${timeRange}&limit=500&action_attribution_windows=${attrWindows}&access_token=${token}`),
    getBreakdown(selected.id, token, "age", timeRange, attrWindows),
    getBreakdown(selected.id, token, "gender", timeRange, attrWindows),
    getBreakdown(selected.id, token, "impression_device", timeRange, attrWindows),
    getBreakdown(selected.id, token, "hourly_stats_aggregated_by_advertiser_time_zone", timeRange, attrWindows, false),
  ]);

  const campJson = await campRes.json() as { data?: { id: string; objective: string }[] };
  const objMap = new Map((campJson.data ?? []).map(c => [c.id, normObj(c.objective)]));

  const placementData = await placementRes.json() as { data?: PlacementRow[]; error?: { message: string } };
  if (placementData.error) return NextResponse.json({ error: placementData.error.message }, { status: 400 });

  // Accumulate raw metrics per objective × placement (and an "ALL" blend), then derive rates
  // once — summing rates would be wrong, so we keep raw counts and compute ROAS/CTR/etc. after.
  interface Raw { spend: number; impressions: number; clicks: number; reach: number; purchases: number; purchaseValue: number; atc: number; lpv: number; leads: number; }
  const groups = new Map<string, { objective: string; platform: string; position: string; r: Raw }>();
  const addRow = (objective: string, row: PlacementRow) => {
    const platform = row.publisher_platform ?? "", position = row.platform_position ?? "";
    const key = `${objective}${platform}${position}`;
    let g = groups.get(key);
    if (!g) { g = { objective, platform, position, r: { spend: 0, impressions: 0, clicks: 0, reach: 0, purchases: 0, purchaseValue: 0, atc: 0, lpv: 0, leads: 0 } }; groups.set(key, g); }
    const r = g.r;
    r.spend += parseFloat(row.spend ?? "0");
    r.impressions += parseInt(row.impressions ?? "0");
    r.clicks += parseInt(row.clicks ?? "0");
    r.reach += parseInt(row.reach ?? "0");
    r.purchases += Math.max(actInt(row.actions, "offsite_conversion.fb_pixel_purchase"), actInt(row.actions, "purchase"));
    r.purchaseValue += Math.max(actVal(row.action_values, "offsite_conversion.fb_pixel_purchase"), actVal(row.action_values, "purchase"));
    r.atc += Math.max(actInt(row.actions, "offsite_conversion.fb_pixel_add_to_cart"), actInt(row.actions, "add_to_cart"));
    r.lpv += actInt(row.actions, "landing_page_view");
    r.leads += leadCount(row.actions);
  };
  for (const row of placementData.data ?? []) {
    const obj = objMap.get(row.campaign_id ?? "") ?? "OTHER";
    addRow(obj, row);
    addRow("ALL", row);
  }

  const toPlacement = (g: { objective: string; platform: string; position: string; r: Raw }) => {
    const r = g.r;
    return {
      platform: g.platform,
      position: g.position,
      label: friendlyLabel(g.platform, g.position),
      group: platformGroup(g.platform),
      spend: +r.spend.toFixed(2),
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.impressions > 0 ? +(r.clicks / r.impressions * 100).toFixed(2) : 0,
      cpc: r.clicks > 0 ? +(r.spend / r.clicks).toFixed(2) : 0,
      cpm: r.impressions > 0 ? +(r.spend / r.impressions * 1000).toFixed(2) : 0,
      reach: r.reach,
      purchases: r.purchases,
      purchaseValue: +r.purchaseValue.toFixed(2),
      atc: r.atc,
      lpv: r.lpv,
      leads: r.leads,
      roas: r.spend > 0 ? +(r.purchaseValue / r.spend).toFixed(2) : 0,
      cac: r.purchases > 0 ? +(r.spend / r.purchases).toFixed(2) : 0,
      costPerLead: r.leads > 0 ? +(r.spend / r.leads).toFixed(2) : 0,
      lpRatio: r.clicks > 0 ? +(r.lpv / r.clicks * 100).toFixed(1) : 0,
    };
  };

  const placementsByObjective: Record<string, ReturnType<typeof toPlacement>[]> = {};
  const totalSpendByObjective: Record<string, number> = {};
  for (const g of groups.values()) {
    (placementsByObjective[g.objective] ??= []).push(toPlacement(g));
    totalSpendByObjective[g.objective] = (totalSpendByObjective[g.objective] ?? 0) + g.r.spend;
  }
  for (const k of Object.keys(placementsByObjective)) placementsByObjective[k].sort((a, b) => b.spend - a.spend);
  for (const k of Object.keys(totalSpendByObjective)) totalSpendByObjective[k] = +totalSpendByObjective[k].toFixed(2);

  // Objective tabs to show: ALL first, then objectives that actually spent, in a stable order.
  const OBJ_DISPLAY = ["SALES", "TRAFFIC", "AWARENESS", "LEADS", "ENGAGEMENT", "APP", "OTHER"];
  const objectives = ["ALL", ...OBJ_DISPLAY.filter(o => (totalSpendByObjective[o] ?? 0) > 0)];

  const placements = placementsByObjective["ALL"] ?? [];
  const totalSpend = totalSpendByObjective["ALL"] ?? 0;

  const age = finalize(ageRows.map(r => bucketFromRow(r, r.age ?? "", r.age ?? "Unknown", AGE_ORDER.indexOf(r.age ?? "") < 0 ? 99 : AGE_ORDER.indexOf(r.age ?? ""))));
  const gender = finalize(genderRows.map(r => bucketFromRow(r, r.gender ?? "", GENDER_LABEL[(r.gender ?? "").toLowerCase()] ?? (r.gender ?? "Unknown"), 0)).map(b => ({ ...b, sort: -b.spend })));
  const device = finalize(deviceRows.map(r => bucketFromRow(r, r.impression_device ?? "", deviceLabel(r.impression_device ?? ""), 0)).map(b => ({ ...b, sort: -b.spend })));
  const hourly = finalize(hourlyRows.map(r => {
    const h = hourLabel(r.hourly_stats_aggregated_by_advertiser_time_zone ?? "");
    return bucketFromRow(r, r.hourly_stats_aggregated_by_advertiser_time_zone ?? "", h.label, h.hour);
  }));

  const result = {
    adAccountName: selected.name,
    currency: selected.currency,
    period: { from, to },
    totalSpend: +totalSpend.toFixed(2),
    placements,
    objectives,
    placementsByObjective,
    totalSpendByObjective,
    breakdowns: { age, gender, device, hourly },
  };
  kv.set(cacheKey, result, { ex: 900 }).catch(() => {});
  return NextResponse.json(result);
}
