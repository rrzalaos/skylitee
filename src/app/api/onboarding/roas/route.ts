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
    const [metaRes, orders, shopInfo] = await Promise.all([
      fetch(`https://graph.facebook.com/v19.0/${account.id}/insights?fields=spend,actions,action_values&time_range=${timeRange}&action_attribution_windows=${attrWindows}&access_token=${metaToken}`),
      fetchOrdersInRange(shop, shopToken, zonedDayStartISO(from, tz)),
      shopifyFetch<{ shop?: { currency?: string } }>(shop, shopToken, "/shop.json?fields=currency").catch(() => ({ shop: undefined })),
    ]);
    const metaData = await metaRes.json() as { data?: { spend?: string; actions?: ActionEntry[]; action_values?: ActionEntry[] }[]; error?: { message?: string } };
    if (!metaRes.ok || metaData.error) {
      return NextResponse.json({ error: "meta_api_error", detail: metaData.error?.message ?? `Meta API ${metaRes.status}` }, { status: 502 });
    }

    const o = metaData.data?.[0];
    const spend = parseFloat(o?.spend ?? "0");
    const metaPurchaseValue = Math.max(actVal(o?.action_values, "offsite_conversion.fb_pixel_purchase"), actVal(o?.action_values, "purchase"));
    const metaPurchases = Math.round(Math.max(actVal(o?.actions, "offsite_conversion.fb_pixel_purchase"), actVal(o?.actions, "purchase")));
    const leads = leadCount(o?.actions);

    const shopRevenue = orders.reduce((s, x) => s + orderRevenue(x), 0);
    const shopCurrency = shopInfo.shop?.currency ?? null;
    const r2 = (n: number) => Math.round(n * 100) / 100;

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
    });
  } catch (e) {
    return NextResponse.json({ error: "failed", detail: e instanceof Error ? e.message : "" }, { status: 502 });
  }
}
