import { NextRequest, NextResponse } from "next/server";
import { getShopifySession, getMetaToken, getMetaAdAccount } from "@/lib/session";
import { resolveMetaAccount, leadCount } from "@/lib/meta";
import { fetchOrdersInRange, getShopTimezone, orderRevenue, shopifyFetch } from "@/lib/shopify";
import { daysAgoInTz, todayInTz, zonedDayStartISO } from "@/lib/timezone";

// "Real ROAS" reveal on /welcome, right after Meta connects. Last 30 days:
//   metaRoas  = purchase value Meta attributes to its ads ÷ Meta spend   (what Ads Manager shows)
//   realRoas  = ALL Shopify sales ÷ Meta spend                            (what the bank account sees)
// If Meta claims more sales than the whole store made, its attribution is over-counting.

type ActionEntry = { action_type: string; value: string };
const actVal = (arr: ActionEntry[] | undefined, t: string) => parseFloat(arr?.find(a => a.action_type === t)?.value ?? "0");

type MetaRow = {
  campaign_name?: string; objective?: string; spend?: string; impressions?: string;
  inline_link_clicks?: string; frequency?: string; actions?: ActionEntry[]; action_values?: ActionEntry[];
};
const purchases = (r?: MetaRow) => Math.round(Math.max(actVal(r?.actions, "offsite_conversion.fb_pixel_purchase"), actVal(r?.actions, "purchase")));
const purchaseValue = (r?: MetaRow) => Math.max(actVal(r?.action_values, "offsite_conversion.fb_pixel_purchase"), actVal(r?.action_values, "purchase"));
// Objectives whose job is an order / lead — zero results there is wasted spend
// (awareness / traffic / engagement campaigns aren't judged on results).
const SALES_OBJ = /SALES|CONVERSIONS|CATALOG/i;
const RESULT_OBJ = /SALES|CONVERSIONS|CATALOG|LEAD|MESSAGES/i;

export type Finding = { flag: "good" | "bad"; title: string; value: number; valueKind: "money" | "pct" | "x"; why: string };

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { shop, token: shopToken } = session;

  const metaToken = await getMetaToken(req, shop);
  if (!metaToken) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  const account = await resolveMetaAccount(await getMetaAdAccount(req, shop), metaToken);
  if (!account) return NextResponse.json({ error: "no_ad_account" }, { status: 400 });

  const tz = await getShopTimezone(shop, shopToken);
  const from = daysAgoInTz(tz, 29);
  const to = todayInTz(tz);
  const timeRange = encodeURIComponent(JSON.stringify({ since: from, until: to }));
  const attrWindows = encodeURIComponent(JSON.stringify(["7d_click", "1d_view"]));

  try {
    const base = `https://graph.facebook.com/v19.0/${account.id}/insights?time_range=${timeRange}&action_attribution_windows=${attrWindows}&access_token=${metaToken}`;
    const [metaRes, campRes, orders, shopInfo] = await Promise.all([
      fetch(`${base}&fields=spend,impressions,inline_link_clicks,frequency,actions,action_values`),
      fetch(`${base}&level=campaign&limit=200&fields=campaign_name,objective,spend,impressions,inline_link_clicks,actions,action_values`),
      fetchOrdersInRange(shop, shopToken, zonedDayStartISO(from, tz)),
      shopifyFetch<{ shop?: { currency?: string } }>(shop, shopToken, "/shop.json?fields=currency").catch(() => ({ shop: undefined })),
    ]);
    const metaData = await metaRes.json() as { data?: { spend?: string; actions?: ActionEntry[]; action_values?: ActionEntry[] }[]; error?: { message?: string } };
    if (!metaRes.ok || metaData.error) {
      return NextResponse.json({ error: "meta_api_error", detail: metaData.error?.message ?? `Meta API ${metaRes.status}` }, { status: 502 });
    }

    const o = metaData.data?.[0] as (MetaRow | undefined);
    const spend = parseFloat(o?.spend ?? "0");
    const metaPurchaseValue = purchaseValue(o);
    const metaPurchases = purchases(o);
    const leads = leadCount(o?.actions);

    const shopRevenue = orders.reduce((s, x) => s + orderRevenue(x), 0);
    const shopCurrency = shopInfo.shop?.currency ?? null;
    const r2 = (n: number) => Math.round(n * 100) / 100;

    // ── Campaign-level findings (best effort — the reveal still works without them) ──
    const campData = await campRes.json().catch(() => ({})) as { data?: MetaRow[] };
    const campaigns = (campData.data ?? []).map(c => {
      const p = purchases(c);
      const l = leadCount(c.actions);
      return {
        name: c.campaign_name ?? "Campaign",
        objective: c.objective ?? "",
        spend: parseFloat(c.spend ?? "0"),
        results: p > 0 ? p : l,
        resultType: (p > 0 || SALES_OBJ.test(c.objective ?? "") ? "order" : "lead") as "order" | "lead",
        value: purchaseValue(c),
      };
    }).filter(c => c.spend > 0);

    const impressions = parseFloat(o?.impressions ?? "0");
    const linkClicks = parseFloat(o?.inline_link_clicks ?? "0");
    const frequency = parseFloat(o?.frequency ?? "0");
    const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : null;

    // Campaigns built to get orders/leads that spent money and got none.
    const wasted = campaigns.filter(c => RESULT_OBJ.test(c.objective) && c.results === 0);
    const wastedSpend = wasted.reduce((s, c) => s + c.spend, 0);
    // Best / worst cost per result among campaigns that did produce results (same result type).
    const producing = campaigns.filter(c => c.results > 0).map(c => ({ ...c, cpr: c.spend / c.results }));
    const mainType = producing.filter(c => c.resultType === "order").length >= producing.filter(c => c.resultType === "lead").length ? "order" : "lead";
    const ranked = producing.filter(c => c.resultType === mainType).sort((a, b) => a.cpr - b.cpr);
    const best = ranked[0] ?? null;
    const worst = ranked.length >= 2 && ranked[ranked.length - 1].cpr > ranked[0].cpr * 1.5 ? ranked[ranked.length - 1] : null;

    const findings: Finding[] = [];
    if (wasted.length > 0) findings.push({
      flag: "bad", title: "Spend with zero results",
      value: r2(wastedSpend), valueKind: "money",
      why: `${wasted.length} campaign${wasted.length > 1 ? "s" : ""} spent money and got no ${mainType === "order" ? "orders" : "leads"} — e.g. "${wasted.sort((a, b) => b.spend - a.spend)[0].name}". Pausing these is the fastest saving.`,
    });
    else if (campaigns.length > 0) findings.push({
      flag: "good", title: "Spend with zero results", value: 0, valueKind: "money",
      why: "Every campaign that spent money brought at least one result — no dead campaigns.",
    });
    if (best) findings.push({
      flag: "good", title: `Best campaign — cost per ${best.resultType}`,
      value: r2(best.cpr), valueKind: "money",
      why: `"${best.name}" — ${best.results} ${best.resultType}s from ${Math.round(best.spend).toLocaleString("en-IN")} spent. Give this one more budget first.`,
    });
    if (worst && best) findings.push({
      flag: "bad", title: `Costliest campaign — cost per ${worst.resultType}`,
      value: r2(worst.cpr), valueKind: "money",
      why: `"${worst.name}" pays ${(worst.cpr / best.cpr).toFixed(1)}× more per ${worst.resultType} than your best campaign. Move budget from here.`,
    });
    if (ctr !== null && impressions >= 1000) findings.push({
      flag: ctr >= 1 ? "good" : "bad", title: "Link click-through rate",
      value: Math.round(ctr * 100) / 100, valueKind: "pct",
      why: ctr >= 1 ? "At or above the 1% benchmark — your ads make people click."
        : "Below the 1% benchmark — people scroll past. Fresh creatives and a stronger first line usually fix this.",
    });
    if (frequency > 0) findings.push({
      flag: frequency > 3 ? "bad" : "good", title: "Ad frequency (times each person saw your ads)",
      value: Math.round(frequency * 10) / 10, valueKind: "x",
      why: frequency > 3 ? "Above 3 — the same people keep seeing the same ads. Expect costs to rise; rotate creatives or widen the audience."
        : "Under 3 — your audience isn't tired of your ads yet.",
    });
    if (linkClicks >= 50 && mainType === "order") {
      const conv = (orders.length / linkClicks) * 100;
      findings.push({
        flag: conv >= 1 ? "good" : "bad", title: "Ad clicks that became orders",
        value: Math.round(conv * 100) / 100, valueKind: "pct",
        why: orders.length === 0
          ? `${Math.round(linkClicks).toLocaleString("en-IN")} people clicked your ads but the store got 0 orders — check your product page, price and checkout.`
          : conv >= 1 ? `${Math.round(linkClicks).toLocaleString("en-IN")} ad clicks → ${orders.length} store orders. At or above the 1% benchmark.`
          : `${Math.round(linkClicks).toLocaleString("en-IN")} ad clicks → only ${orders.length} orders. Below the 1% benchmark — the store page is losing buyers after the click.`,
      });
    }

    return NextResponse.json({
      period: { from, to },
      adAccountName: account.name,
      metaCurrency: account.currency,
      shopCurrency,
      currencyMismatch: !!shopCurrency && shopCurrency !== account.currency,
      spend: r2(spend),
      metaPurchaseValue: r2(metaPurchaseValue),
      metaPurchases,
      leads,
      shopRevenue: r2(shopRevenue),
      shopOrders: orders.length,
      metaRoas: spend > 0 ? r2(metaPurchaseValue / spend) : null,
      realRoas: spend > 0 ? r2(shopRevenue / spend) : null,
      // Share of the store's real sales that Meta claims credit for.
      metaClaimPct: shopRevenue > 0 ? Math.round((metaPurchaseValue / shopRevenue) * 100) : null,
      campaignCount: campaigns.length,
      wastedSpend: r2(wastedSpend),
      linkClicks: Math.round(linkClicks),
      findings,
    });
  } catch (e) {
    return NextResponse.json({ error: "failed", detail: e instanceof Error ? e.message : "" }, { status: 502 });
  }
}
