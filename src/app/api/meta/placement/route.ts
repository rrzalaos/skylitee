import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getShopFromRequest } from "@/lib/session";
import { resolveMetaAccount } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };

interface PlacementRow {
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

function actInt(arr: ActionEntry[] | undefined, type: string): number {
  return Math.round(parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0"));
}
function actVal(arr: ActionEntry[] | undefined, type: string): number {
  return parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0");
}

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

function platformGroup(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "facebook") return "Facebook";
  if (p === "instagram") return "Instagram";
  if (p === "audience_network") return "Audience Network";
  if (p === "messenger") return "Messenger";
  return platform;
}

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

  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });

  const fields = "spend,impressions,clicks,ctr,cpc,cpm,reach,actions,action_values";
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${selected.id}/insights?fields=${fields}&breakdowns=publisher_platform,platform_position&time_range=${timeRange}&limit=50&access_token=${token}`
  );
  const data = await res.json() as { data?: PlacementRow[]; error?: { message: string } };
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });

  const placements = (data.data ?? []).map(row => {
    const spend = parseFloat(row.spend ?? "0");
    const purchases = Math.max(
      actInt(row.actions, "offsite_conversion.fb_pixel_purchase"),
      actInt(row.actions, "purchase")
    );
    const purchaseValue = Math.max(
      actVal(row.action_values, "offsite_conversion.fb_pixel_purchase"),
      actVal(row.action_values, "purchase")
    );
    const atc = Math.max(
      actInt(row.actions, "offsite_conversion.fb_pixel_add_to_cart"),
      actInt(row.actions, "add_to_cart")
    );
    const clicks = parseInt(row.clicks ?? "0");
    const lpv = actInt(row.actions, "landing_page_view");
    return {
      platform: row.publisher_platform ?? "",
      position: row.platform_position ?? "",
      label: friendlyLabel(row.publisher_platform ?? "", row.platform_position ?? ""),
      group: platformGroup(row.publisher_platform ?? ""),
      spend: +spend.toFixed(2),
      impressions: parseInt(row.impressions ?? "0"),
      clicks,
      ctr: +parseFloat(row.ctr ?? "0").toFixed(2),
      cpc: +parseFloat(row.cpc ?? "0").toFixed(2),
      cpm: +parseFloat(row.cpm ?? "0").toFixed(2),
      reach: parseInt(row.reach ?? "0"),
      purchases,
      purchaseValue: +purchaseValue.toFixed(2),
      atc,
      lpv,
      roas: spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0,
      cac: purchases > 0 ? +(spend / purchases).toFixed(2) : 0,
      lpRatio: clicks > 0 ? +(lpv / clicks * 100).toFixed(1) : 0,
    };
  }).sort((a, b) => b.spend - a.spend);

  const totalSpend = placements.reduce((s, p) => s + p.spend, 0);

  return NextResponse.json({
    adAccountName: selected.name,
    currency: selected.currency,
    period: { from, to },
    totalSpend: +totalSpend.toFixed(2),
    placements,
  });
}
