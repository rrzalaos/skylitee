import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { resolveMetaAccount, leadCount } from "@/lib/meta";

type ActionEntry = { action_type: string; value: string };
interface Row {
  spend?: string; impressions?: string; clicks?: string; ctr?: string; cpm?: string;
  actions?: ActionEntry[]; action_values?: ActionEntry[]; date_start?: string;
}
const actInt = (arr: ActionEntry[] | undefined, t: string) => Math.round(parseFloat(arr?.find(a => a.action_type === t)?.value ?? "0"));
const actVal = (arr: ActionEntry[] | undefined, t: string) => parseFloat(arr?.find(a => a.action_type === t)?.value ?? "0");

// Month-over-month Meta KPIs. ?months=N (1–12, default 6). Uses Meta's time_increment=monthly.
export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const months = Math.min(12, Math.max(1, parseInt(req.nextUrl.searchParams.get("months") ?? "6", 10)));
  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = await resolveMetaAccount(savedAccount, token);
  if (!selected) return NextResponse.json({ error: "no_accounts" });
  const adAccountId = selected.id;

  const cacheKey = `cache:${shop}:metamonthly:${adAccountId}:${months}`;
  try { const cached = await kv.get(cacheKey); if (cached) return NextResponse.json(cached); } catch { /* skip */ }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const since = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const until = now.toISOString().split("T")[0];
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const attr = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr,cpm,actions,action_values&time_increment=monthly&time_range=${timeRange}&action_attribution_windows=${attr}&access_token=${token}`
    );
    const json = await res.json() as { data?: Row[]; error?: unknown };
    if (!res.ok || json.error) return NextResponse.json({ error: "report_failed" }, { status: 502 });

    const monthsOut = (json.data ?? []).map(r => {
      const spend = parseFloat(r.spend ?? "0");
      const impressions = parseInt(r.impressions ?? "0");
      const clicks = parseInt(r.clicks ?? "0");
      const purchases = Math.max(actInt(r.actions, "offsite_conversion.fb_pixel_purchase"), actInt(r.actions, "purchase"));
      const purchaseValue = Math.max(actVal(r.action_values, "offsite_conversion.fb_pixel_purchase"), actVal(r.action_values, "purchase"));
      const leads = leadCount(r.actions);
      const ds = r.date_start ?? "";                 // "YYYY-MM-DD" (month start)
      const date = new Date(ds);
      return {
        ym: ds.slice(0, 7),
        label: isNaN(date.getTime()) ? ds : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        spend: Math.round(spend),
        impressions, clicks,
        ctr: +parseFloat(r.ctr ?? "0").toFixed(2),
        cpm: +parseFloat(r.cpm ?? "0").toFixed(0),
        purchases,
        purchaseValue: Math.round(purchaseValue),
        roas: spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0,
        cac: purchases > 0 ? Math.round(spend / purchases) : 0,
        leads,
        cpl: leads > 0 ? Math.round(spend / leads) : 0,
      };
    }).sort((a, b) => a.ym.localeCompare(b.ym));

    const result = { account: selected.name, months: monthsOut };
    kv.set(cacheKey, result, { ex: 1800 }).catch(() => {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "report_failed" }, { status: 502 });
  }
}
