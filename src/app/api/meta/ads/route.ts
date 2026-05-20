import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };

interface AdInsightRow {
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
  video_thruplay_watched_actions?: ActionEntry[];
}

interface AdRow {
  id: string;
  name: string;
  status: string;
  creative?: {
    thumbnail_url?: string;
    object_type?: string;
    image_url?: string;
  };
}

function actVal(arr: ActionEntry[] | undefined, type: string): number {
  return parseFloat(arr?.find(a => a.action_type === type)?.value ?? "0");
}
function actInt(arr: ActionEntry[] | undefined, type: string): number {
  return Math.round(actVal(arr, type));
}
function sumArr(arr: ActionEntry[] | undefined): number {
  return (arr ?? []).reduce((s, a) => s + parseFloat(a.value), 0);
}

function computeScore(roas: number, ctr: number, freq: number): number {
  const roasScore = Math.min(roas / 3, 1);
  const ctrScore = Math.min(ctr / 4, 1);
  const fatigueScore = Math.max(0, Math.min((freq - 1.5) / 1.5, 1));
  return Math.max(0, Math.min(100, Math.round(40 * roasScore + 30 * ctrScore + 30 * (1 - fatigueScore))));
}

function computeSignal(score: number, roas: number, freq: number, spend: number): "scale" | "keep" | "refresh" | "pause" {
  if (spend > 500 && roas === 0) return "pause";
  if (freq > 3) return "pause";
  if (score >= 75) return "scale";
  if (score >= 55) return "keep";
  if (score >= 35) return "refresh";
  return "pause";
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
  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });

  const insightFields = [
    "ad_id,ad_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency",
    "actions,action_values,video_thruplay_watched_actions",
  ].join(",");

  const [insightsRes, adsRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/insights?fields=${insightFields}&level=ad&time_range=${timeRange}&limit=50&sort=spend_descending&action_attribution_windows=${attrWindows}&access_token=${token}`),
    fetch(`https://graph.facebook.com/v19.0/${selected.id}/ads?fields=id,name,status,creative%7Bthumbnail_url,object_type,image_url%7D&limit=100&access_token=${token}`),
  ]);

  const [insightsData, adsData] = await Promise.all([
    insightsRes.json() as Promise<{ data?: AdInsightRow[]; error?: { message: string } }>,
    adsRes.json() as Promise<{ data?: AdRow[] }>,
  ]);

  if (insightsData.error) return NextResponse.json({ error: insightsData.error.message }, { status: 400 });

  const thumbnailMap = new Map<string, { thumbnail?: string; objectType?: string; status?: string }>();
  for (const ad of adsData.data ?? []) {
    thumbnailMap.set(ad.id, {
      thumbnail: ad.creative?.thumbnail_url ?? ad.creative?.image_url,
      objectType: ad.creative?.object_type,
      status: ad.status,
    });
  }

  const ads = (insightsData.data ?? []).map(row => {
    const adId = row.ad_id ?? "";
    const spend = parseFloat(row.spend ?? "0");
    const impressions = parseInt(row.impressions ?? "0");
    const clicks = parseInt(row.clicks ?? "0");
    const freq = parseFloat(row.frequency ?? "0");
    const ctr = parseFloat(row.ctr ?? "0");

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
    const videoViews3s = actInt(row.actions, "video_view");
    const thruplay = Math.round(sumArr(row.video_thruplay_watched_actions));
    const roas = spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0;
    const cac = purchases > 0 ? +(spend / purchases).toFixed(2) : 0;
    const thumbStopRatio = impressions > 0 ? +(videoViews3s / impressions * 100).toFixed(1) : 0;
    const holdRatio = videoViews3s > 0 ? +(thruplay / videoViews3s * 100).toFixed(1) : 0;

    const score = computeScore(roas, ctr, freq);
    const signal = computeSignal(score, roas, freq, spend);
    const creativeInfo = thumbnailMap.get(adId);

    return {
      id: adId,
      name: row.ad_name ?? "",
      status: creativeInfo?.status ?? "UNKNOWN",
      thumbnail: creativeInfo?.thumbnail ?? null,
      objectType: creativeInfo?.objectType ?? null,
      spend: +spend.toFixed(2),
      impressions,
      clicks,
      ctr: +ctr.toFixed(2),
      cpc: +parseFloat(row.cpc ?? "0").toFixed(2),
      cpm: +parseFloat(row.cpm ?? "0").toFixed(2),
      reach: parseInt(row.reach ?? "0"),
      frequency: +freq.toFixed(2),
      purchases,
      purchaseValue: +purchaseValue.toFixed(2),
      atc,
      roas,
      cac,
      videoViews3s,
      thruplay,
      thumbStopRatio,
      holdRatio,
      score,
      signal,
    };
  });

  return NextResponse.json({
    adAccountName: selected.name,
    currency: selected.currency,
    period: { from, to },
    ads,
  });
}
