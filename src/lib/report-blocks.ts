/* eslint-disable @typescript-eslint/no-explicit-any */
// Catalog for the custom report builder: platform group → section → items. Every KPI is its
// own selectable item (kind "metric") and every list/breakdown is a table item (kind "table").
// When the report is built, selected metrics from the same section merge into ONE
// Metric/Value table, placed where the first of them sits in the report order. A metric whose
// source isn't connected (or has no data) is skipped, never shown as a fake zero.

import { ExportSection } from "@/lib/export";

export type ReportSource =
  | "shopify" | "dashboard" | "customers" | "meta" | "placement" | "gads" | "ga4" | "gsc" | "ai";

export interface ReportCtx {
  shopify?: any | null;     // /api/shopify/sales
  dashboard?: any | null;   // /api/shopify/dashboard
  customers?: any | null;   // /api/shopify/customers/period
  meta?: any | null;        // /api/meta
  placement?: any | null;   // /api/meta/placement
  gads?: any | null;        // /api/google/ads
  ga4?: any | null;         // /api/ga4?organic=1
  gsc?: any | null;         // /api/gsc
  ai?: any | null;          // /api/ai/report (parsed JSON)
}

interface ItemBase { id: string; label: string; sources: ReportSource[] }
export interface ReportMetric extends ItemBase { kind: "metric"; value: (ctx: ReportCtx) => string | number | null }
export interface ReportTable extends ItemBase { kind: "table"; build: (ctx: ReportCtx) => ExportSection[] }
export type ReportItem = ReportMetric | ReportTable;

export interface ReportSection { id: string; label: string; items: ReportItem[] }
export interface ReportGroup { id: string; label: string; sections: ReportSection[] }

// ── helpers ──────────────────────────────────────────────────────────────────
const inr = (n: any) => {
  const v = Number(n ?? 0);
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2 })}`;
};
const num = (n: any) => Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 1 });
const pct = (n: any) => `${n ?? 0}%`;
const times = (n: any) => `${n ?? 0}x`;
const share = (a: number, b: number, digits = 1) => (b > 0 ? +((a / b) * 100).toFixed(digits) : null);
const per = (a: number, b: number, digits = 2) => (b > 0 ? +(a / b).toFixed(digits) : null);
const mmss = (sec: number) => `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
const ymd = (d: string) => (/^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d);
const objective = (o: string) => {
  const s = (o ?? "").replace(/^OUTCOME_/, "").replace(/_/g, " ").toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : "-";
};

// A single KPI. `pick` returns null/undefined when there's no data → the metric is skipped.
const metric = (
  id: string, label: string, sources: ReportSource[],
  pick: (c: ReportCtx) => any, fmt: (v: any) => string | number = v => v,
): ReportMetric => ({
  kind: "metric", id, label, sources,
  value: ctx => {
    try {
      const v = pick(ctx);
      return v == null || (typeof v === "number" && !Number.isFinite(v)) ? null : fmt(v);
    } catch { return null; }
  },
});

// A table. `rows` returns [] / undefined when there's no data → the table is skipped.
const table = (
  id: string, label: string, sources: ReportSource[],
  title: string, headers: string[], rows: (c: ReportCtx) => (string | number)[][] | undefined,
): ReportTable => ({
  kind: "table", id, label, sources,
  build: ctx => {
    try { const r = rows(ctx) ?? []; return r.length ? [{ title, headers, rows: r }] : []; } catch { return []; }
  },
});

// Per-source shortcuts for KPI objects.
const sales = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["shopify"], c => c.shopify?.kpis?.[key], fmt);
const dash = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["dashboard"], c => c.dashboard?.kpis?.[key], fmt);
const cust = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["customers"], c => c.customers?.kpis?.[key], fmt);
const meta = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["meta"], c => c.meta?.kpis?.[key], fmt);
const gads = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["gads"], c => c.gads?.kpis?.[key], fmt);
const ga4 = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["ga4"], c => c.ga4?.kpis?.[key], fmt);
const ecom = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["ga4"], c => c.ga4?.ecommerce?.[key], fmt);
const organic = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["ga4"], c => c.ga4?.organic?.[key], fmt);
const gsc = (id: string, label: string, key: string, fmt?: (v: any) => string | number) =>
  metric(id, label, ["gsc"], c => c.gsc?.kpis?.[key], fmt);

// Meta audience breakdowns (age / gender / device / hour) share one table shape.
const metaBreakdown = (id: string, label: string, key: string, segment: string) =>
  table(id, label, ["placement"], `Meta Ads by ${segment}`,
    [segment, "Spend", "Spend %", "CTR", "Orders", "ROAS", "Leads"],
    c => (c.placement?.breakdowns?.[key] ?? []).map((b: any) => [
      b.label, inr(b.spend), pct(b.spendPct), pct(b.ctr), num(b.purchases), times(b.roas), num(b.leads),
    ]));

// Total ad spend across connected ad platforms; null when none is connected.
const totalAdSpend = (c: ReportCtx) => {
  const m = c.meta?.kpis?.spend, g = c.gads?.kpis?.spend;
  return m == null && g == null ? null : Number(m ?? 0) + Number(g ?? 0);
};

// ── catalog ──────────────────────────────────────────────────────────────────
export const REPORT_GROUPS: ReportGroup[] = [
  {
    id: "sales", label: "Sales & Orders",
    sections: [
      {
        id: "revenue", label: "Revenue & orders",
        items: [
          sales("s_revenue", "Revenue", "grossSales", inr),
          sales("s_orders", "Orders", "totalOrders", num),
          sales("s_aov", "Average order value (AOV)", "aov", inr),
          metric("s_rev_per_day", "Avg revenue per day", ["dashboard"],
            c => per(c.dashboard?.kpis?.grossSales, c.dashboard?.period?.days, 0), inr),
          metric("s_orders_per_day", "Avg orders per day", ["dashboard"],
            c => per(c.dashboard?.kpis?.totalOrders, c.dashboard?.period?.days, 1), num),
          metric("s_best_day", "Best sales day", ["dashboard"], c => {
            const days = c.dashboard?.dailyRevenue ?? [];
            const best = days.reduce((a: any, d: any) => (!a || d.revenue > a.revenue ? d : a), null);
            return best && best.revenue > 0 ? `${best.date} (${inr(best.revenue)})` : null;
          }),
        ],
      },
      {
        id: "payments", label: "Payments (COD vs prepaid)",
        items: [
          sales("s_cod_orders", "COD orders", "codOrders", num),
          sales("s_prepaid_orders", "Prepaid orders", "prepaidOrders", num),
          metric("s_cod_share", "COD share of orders", ["shopify"],
            c => share(c.shopify?.kpis?.codOrders, c.shopify?.kpis?.totalOrders), pct),
          dash("s_cod_revenue", "COD revenue", "codRevenue", inr),
          dash("s_prepaid_revenue", "Prepaid revenue", "prepaidRevenue", inr),
        ],
      },
      {
        id: "buyers", label: "New vs returning orders",
        items: [
          sales("s_new_orders", "Orders from new customers", "newCustomers", num),
          sales("s_returning_orders", "Orders from returning customers", "returningCustomers", num),
          metric("s_returning_share", "Returning customer share of orders", ["shopify"],
            c => share(c.shopify?.kpis?.returningCustomers, c.shopify?.kpis?.totalOrders), pct),
        ],
      },
      {
        id: "basket", label: "Basket & products",
        items: [
          sales("s_items_sold", "Items sold", "totalItems", num),
          sales("s_avg_items", "Avg items per order", "avgItemsPerOrder", num),
          sales("s_distinct_skus", "Distinct products sold", "distinctSkus", num),
        ],
      },
      {
        id: "refunds", label: "Refunds & discounts",
        items: [
          dash("s_refunded", "Refunded revenue", "refundedRevenue", inr),
          metric("s_refund_rate", "Refund rate (% of original sales)", ["dashboard"],
            c => share(c.dashboard?.kpis?.refundedRevenue, c.dashboard?.kpis?.grossSales + c.dashboard?.kpis?.refundedRevenue), pct),
          dash("s_discounts", "Total discounts", "totalDiscounts", inr),
          metric("s_discount_rate", "Discounts as % of revenue", ["dashboard"],
            c => share(c.dashboard?.kpis?.totalDiscounts, c.dashboard?.kpis?.grossSales), pct),
        ],
      },
      {
        id: "tables", label: "Tables",
        items: [
          table("top_products", "Top products by revenue", ["shopify"], "Top Products by Revenue",
            ["Product", "Qty", "Revenue", "% of revenue"],
            c => (c.shopify?.allBySku ?? c.shopify?.topByRevenue ?? []).map((p: any) => [
              p.name, num(p.qty), inr(p.revenue), pct(share(p.revenue, c.shopify?.kpis?.grossSales) ?? 0),
            ])),
          table("top_products_qty", "Top products by quantity", ["shopify"], "Top Products by Quantity",
            ["Product", "Qty", "Revenue"],
            c => (c.shopify?.topByQty ?? []).map((p: any) => [p.name, num(p.qty), inr(p.revenue)])),
          table("top_cities", "Top cities", ["shopify"], "Top Cities", ["City", "Orders", "Revenue"],
            c => (c.shopify?.topCities ?? []).map((x: any) => [x.city, num(x.orders), inr(x.revenue)])),
          table("top_states", "Top states", ["shopify"], "Top States", ["State", "Orders", "Revenue"],
            c => (c.shopify?.topStates ?? []).map((x: any) => [x.state, num(x.orders), inr(x.revenue)])),
          table("daily_revenue", "Daily revenue & orders", ["dashboard"], "Daily Revenue",
            ["Date", "Orders", "Revenue"],
            c => (c.dashboard?.dailyRevenue ?? []).map((d: any) => [d.date ?? d.day, num(d.orders), inr(d.revenue)])),
          table("recent_orders", "Recent orders (latest 20)", ["shopify"], "Recent Orders",
            ["Order", "Date", "City", "Payment", "Status", "Total"],
            c => (c.shopify?.recentOrders ?? []).map((o: any) => [
              o.name, o.date, o.city || "-", o.isCod ? "COD" : "Prepaid", o.status ?? "-", inr(o.total),
            ])),
        ],
      },
    ],
  },
  {
    id: "customers", label: "Customers",
    sections: [
      {
        id: "buyers", label: "Buyers in period",
        items: [
          cust("c_active", "Active buyers", "activeBuyers", num),
          cust("c_new", "New buyers", "newBuyers", num),
          cust("c_returning", "Returning buyers", "returningBuyers", num),
          cust("c_repeat_share", "Repeat buyer share", "repeatShare", pct),
          cust("c_spend_per_buyer", "Spend per buyer", "spendPerBuyer", inr),
          metric("c_orders_per_buyer", "Orders per buyer", ["customers"],
            c => per(c.customers?.kpis?.orders, c.customers?.kpis?.activeBuyers), num),
          cust("c_revenue", "Revenue from buyers", "revenue", inr),
          cust("c_orders", "Orders from buyers", "orders", num),
        ],
      },
      {
        id: "tables", label: "Tables",
        items: [
          table("customer_cities", "Top cities by buyers", ["customers"], "Top Cities by Buyers",
            ["City", "Buyers", "% of buyers"],
            c => (c.customers?.topCities ?? []).map((x: any) => [x.city, num(x.count), pct(x.pct)])),
        ],
      },
    ],
  },
  {
    id: "meta", label: "Meta Ads",
    sections: [
      {
        id: "results", label: "Spend & results",
        items: [
          meta("m_spend", "Spend", "spend", inr),
          meta("m_roas", "ROAS", "roas", times),
          meta("m_purchases", "Purchases", "purchases", num),
          meta("m_purchase_value", "Purchase value", "purchaseValue", inr),
          meta("m_cac", "Cost per purchase (CAC)", "cac", inr),
          meta("m_leads", "Leads (all types)", "leads", num),
          metric("m_cpl", "Cost per lead", ["meta"], c => (c.meta?.kpis?.leads ? c.meta.kpis.costPerLead : null), inr),
          metric("m_leads_form", "Form leads", ["meta"], c => c.meta?.kpis?.leadsByType?.form, num),
          metric("m_leads_msg", "Messaging leads", ["meta"], c => c.meta?.kpis?.leadsByType?.messaging, num),
          metric("m_leads_calls", "Call leads", ["meta"], c => c.meta?.kpis?.leadsByType?.calls, num),
        ],
      },
      {
        id: "delivery", label: "Reach & clicks",
        items: [
          meta("m_impressions", "Impressions", "impressions", num),
          meta("m_reach", "Reach", "reach", num),
          meta("m_frequency", "Frequency", "frequency", times),
          meta("m_cpm", "CPM (cost per 1,000 impressions)", "cpm", inr),
          meta("m_clicks", "Clicks (all)", "clicks", num),
          meta("m_ctr", "CTR (all)", "ctr", pct),
          meta("m_cpc", "CPC (all)", "cpc", inr),
          meta("m_outbound", "Outbound clicks", "outboundClicks", num),
          meta("m_outbound_ctr", "Outbound CTR", "outboundCtr", pct),
        ],
      },
      {
        id: "funnel", label: "Funnel",
        items: [
          meta("m_lpv", "Landing page views", "lpv", num),
          meta("m_lp_rate", "Landing page view rate (of clicks)", "lpRatio", pct),
          meta("m_atc", "Add to cart", "atc", num),
          meta("m_atc_value", "Add to cart value", "atcValue", inr),
          meta("m_atc_rate", "Add to cart rate (of LPV)", "atcRatio", pct),
          meta("m_checkout", "Checkouts started", "checkout", num),
          meta("m_checkout_value", "Checkout value", "checkoutValue", inr),
          meta("m_checkout_rate", "Checkout rate (of ATC)", "checkoutRatio", pct),
          meta("m_purchase_rate", "Purchase rate (of checkouts)", "purchaseRatio", pct),
          meta("m_conv_rate", "Conversion rate (clicks to purchase)", "conversionRatio", pct),
        ],
      },
      {
        id: "video", label: "Video",
        items: [
          meta("m_video_3s", "3-second video views", "videoViews3s", num),
          meta("m_thruplay", "ThruPlays", "thruplay", num),
          meta("m_thumbstop", "Thumb-stop ratio", "thumbStopRatio", pct),
          meta("m_hold", "Hold rate", "holdRatio", pct),
        ],
      },
      {
        id: "tables", label: "Tables & breakdowns",
        items: [
          table("meta_campaigns", "Campaigns", ["meta"], "Meta Campaigns",
            ["Campaign", "Objective", "Spend", "ROAS", "Orders", "Leads", "CTR", "CPC"],
            c => [...(c.meta?.campaigns ?? [])].sort((a: any, b: any) => b.spend - a.spend).slice(0, 20).map((x: any) => [
              x.name, objective(x.objective), inr(x.spend), times(x.roas), num(x.purchases), num(x.leads), pct(x.ctr), inr(x.cpc),
            ])),
          table("meta_daily", "Daily spend & results", ["meta"], "Meta Ads Daily",
            ["Date", "Spend", "Impressions", "Clicks", "Purchases", "Purchase value"],
            c => (c.meta?.daily ?? []).map((d: any) => [d.date, inr(d.spend), num(d.impressions), num(d.clicks), num(d.purchases), inr(d.purchaseValue)])),
          table("meta_placements", "Placements", ["placement"], "Meta Ads by Placement",
            ["Placement", "Spend", "CTR", "CPM", "Orders", "ROAS", "Leads"],
            c => (c.placement?.placements ?? []).slice(0, 20).map((p: any) => [
              p.label, inr(p.spend), pct(p.ctr), inr(p.cpm), num(p.purchases), times(p.roas), num(p.leads),
            ])),
          metaBreakdown("meta_age", "Age breakdown", "age", "Age"),
          metaBreakdown("meta_gender", "Gender breakdown", "gender", "Gender"),
          metaBreakdown("meta_device", "Device breakdown", "device", "Device"),
          metaBreakdown("meta_hourly", "Time-of-day breakdown", "hourly", "Hour"),
        ],
      },
    ],
  },
  {
    id: "gads", label: "Google Ads",
    sections: [
      {
        id: "results", label: "Spend & results",
        items: [
          gads("g_spend", "Spend", "spend", inr),
          gads("g_conversions", "Conversions", "conversions", num),
          gads("g_conv_value", "Conversion value", "conversionValue", inr),
          gads("g_roas", "ROAS", "roas", times),
          gads("g_cost_per_conv", "Cost per conversion", "costPerConversion", inr),
          gads("g_impressions", "Impressions", "impressions", num),
          gads("g_clicks", "Clicks", "clicks", num),
          gads("g_ctr", "CTR", "ctr", pct),
          gads("g_cpc", "Avg CPC", "avgCpc", inr),
        ],
      },
      {
        id: "tables", label: "Tables",
        items: [
          table("gads_campaigns", "Campaigns", ["gads"], "Google Ads Campaigns",
            ["Campaign", "Spend", "Clicks", "CTR", "Conversions", "Conv. value", "ROAS"],
            c => [...(c.gads?.campaigns ?? [])].sort((a: any, b: any) => b.spend - a.spend).slice(0, 20).map((x: any) => [
              x.name, inr(x.spend), num(x.clicks), pct(x.ctr), num(x.conversions), inr(x.conversionValue), times(x.roas),
            ])),
          table("gads_keywords", "Top keywords", ["gads"], "Google Ads Keywords",
            ["Keyword", "Spend", "Clicks", "CTR", "Avg CPC", "Conversions"],
            c => [...(c.gads?.keywords ?? [])].sort((a: any, b: any) => b.spend - a.spend).slice(0, 20).map((k: any) => [
              k.keyword, inr(k.spend), num(k.clicks), pct(k.ctr), inr(k.avgCpc), num(k.conversions),
            ])),
          table("gads_daily", "Daily spend & conversions", ["gads"], "Google Ads Daily",
            ["Date", "Spend", "Impressions", "Clicks", "Conversions", "Conv. value"],
            c => (c.gads?.daily ?? []).map((d: any) => [d.date, inr(d.spend), num(d.impressions), num(d.clicks), num(d.conversions), inr(d.convValue)])),
        ],
      },
    ],
  },
  {
    id: "blended", label: "Blended (store + all ads)",
    sections: [
      {
        id: "blended", label: "Store vs ad spend",
        items: [
          metric("b_total_spend", "Total ad spend (Meta + Google)", ["meta", "gads"], totalAdSpend, inr),
          metric("b_roas", "Blended ROAS (store revenue / ad spend)", ["shopify", "meta", "gads"],
            c => (c.shopify?.kpis ? per(c.shopify.kpis.grossSales, totalAdSpend(c) ?? 0) : null), times),
          metric("b_cost_per_order", "Blended cost per order (ad spend / store orders)", ["shopify", "meta", "gads"],
            c => (totalAdSpend(c) != null ? per(totalAdSpend(c)!, c.shopify?.kpis?.totalOrders) : null), inr),
          metric("b_spend_pct", "Ad spend as % of revenue", ["shopify", "meta", "gads"],
            c => (totalAdSpend(c) != null ? share(totalAdSpend(c)!, c.shopify?.kpis?.grossSales) : null), pct),
        ],
      },
    ],
  },
  {
    id: "ga4", label: "Website Analytics (GA4)",
    sections: [
      {
        id: "traffic", label: "Traffic",
        items: [
          ga4("a_sessions", "Sessions", "sessions", num),
          ga4("a_users", "Users", "users", num),
          ga4("a_new_users", "New users", "newUsers", num),
          metric("a_returning_users", "Returning users", ["ga4"],
            c => c.ga4?.newVsReturning?.find((r: any) => r.type === "returning")?.users, num),
          ga4("a_pageviews", "Pageviews", "pageviews", num),
          metric("a_pages_per_session", "Pages per session", ["ga4"],
            c => per(c.ga4?.kpis?.pageviews, c.ga4?.kpis?.sessions), num),
          ga4("a_bounce", "Bounce rate", "bounceRate", pct),
          ga4("a_avg_session", "Avg session duration", "avgSessionMin"),
        ],
      },
      {
        id: "ecom", label: "Ecommerce",
        items: [
          ecom("a_items_viewed", "Items viewed", "itemsViewed", num),
          ecom("a_atc", "Items added to cart", "itemsAddedToCart", num),
          ecom("a_checkouts", "Items checked out", "itemsCheckedOut", num),
          ecom("a_items_purchased", "Items purchased", "itemsPurchased", num),
          ecom("a_purchases", "Purchases", "purchases", num),
          ecom("a_revenue", "Revenue (GA4)", "revenue", inr),
          ecom("a_atc_rate", "Add to cart rate", "atcRate", pct),
          ecom("a_checkout_rate", "Checkout rate", "checkoutRate", pct),
          ecom("a_purchase_rate", "Purchase rate", "purchaseRate", pct),
          metric("a_conv_rate", "Session conversion rate", ["ga4"],
            c => share(c.ga4?.ecommerce?.purchases, c.ga4?.kpis?.sessions, 2), pct),
          metric("a_rev_per_session", "Revenue per session", ["ga4"],
            c => per(c.ga4?.ecommerce?.revenue, c.ga4?.kpis?.sessions), inr),
        ],
      },
      {
        id: "organic", label: "Organic search traffic",
        items: [
          organic("a_org_sessions", "Organic sessions", "sessions", num),
          metric("a_org_share", "Organic share of sessions", ["ga4"],
            c => share(c.ga4?.organic?.sessions, c.ga4?.kpis?.sessions), pct),
          organic("a_org_users", "Organic users", "users", num),
          organic("a_org_engagement", "Organic engagement rate", "engagementRate", pct),
          organic("a_org_bounce", "Organic bounce rate", "bounceRate", pct),
          organic("a_org_duration", "Organic avg session duration", "avgSessionSec", mmss),
          organic("a_org_purchases", "Organic purchases", "purchases", num),
          organic("a_org_revenue", "Organic revenue", "revenue", inr),
        ],
      },
      {
        id: "tables", label: "Tables",
        items: [
          table("ga4_channels", "Channels", ["ga4"], "Traffic Channels",
            ["Channel", "Sessions", "Users", "Purchases", "Revenue"],
            c => (c.ga4?.channels ?? []).map((x: any) => [x.channel, num(x.sessions), num(x.users), num(x.purchases), inr(x.revenue)])),
          table("ga4_pages", "Top pages", ["ga4"], "Top Pages (GA4)", ["Page", "Views", "Sessions", "Bounce rate"],
            c => (c.ga4?.pages ?? []).slice(0, 20).map((p: any) => [p.page, num(p.views), num(p.sessions), pct(p.bounceRate)])),
          table("ga4_landing", "Landing pages", ["ga4"], "Landing Pages", ["Page", "Sessions", "New users", "Bounce rate"],
            c => (c.ga4?.landingPages ?? []).slice(0, 20).map((p: any) => [p.page, num(p.sessions), num(p.newUsers), pct(p.bounceRate)])),
          table("ga4_organic_landing", "Organic landing pages", ["ga4"], "Organic Landing Pages",
            ["Page", "Sessions", "Bounce rate", "Purchases", "Revenue"],
            c => (c.ga4?.organicLandingPages ?? []).slice(0, 20).map((p: any) => [p.page, num(p.sessions), pct(p.bounceRate), num(p.purchases), inr(p.revenue)])),
          table("ga4_items", "Product performance", ["ga4"], "Product Performance (GA4)",
            ["Product", "Viewed", "Added to cart", "Checked out", "Purchased", "Revenue"],
            c => (c.ga4?.items ?? []).slice(0, 20).map((i: any) => [i.name, num(i.viewed), num(i.addedToCart), num(i.checkedOut), num(i.purchased), inr(i.revenue)])),
          table("ga4_new_returning", "New vs returning visitors", ["ga4"], "New vs Returning Visitors",
            ["Type", "Sessions", "Users", "Purchases", "Revenue"],
            c => (c.ga4?.newVsReturning ?? []).map((r: any) => [r.type, num(r.sessions), num(r.users), num(r.purchases), inr(r.revenue)])),
          table("ga4_devices", "Devices", ["ga4"], "Devices (GA4)", ["Device", "Sessions", "Users"],
            c => (c.ga4?.devices ?? []).map((d: any) => [d.device, num(d.sessions), num(d.users)])),
          table("ga4_countries", "Countries", ["ga4"], "Countries (GA4)", ["Country", "Sessions", "Users"],
            c => (c.ga4?.countries ?? []).slice(0, 15).map((d: any) => [d.country, num(d.sessions), num(d.users)])),
          table("ga4_regions", "States / regions", ["ga4"], "States / Regions (GA4)", ["Region", "Sessions", "Users"],
            c => (c.ga4?.regions ?? []).slice(0, 15).map((d: any) => [d.region, num(d.sessions), num(d.users)])),
          table("ga4_cities", "Cities", ["ga4"], "Cities (GA4)", ["City", "Sessions", "Users"],
            c => (c.ga4?.cities ?? []).slice(0, 15).map((d: any) => [d.city, num(d.sessions), num(d.users)])),
          table("ga4_daily", "Daily sessions & users", ["ga4"], "Daily Traffic (GA4)", ["Date", "Sessions", "Users"],
            c => [...(c.ga4?.daily ?? [])].sort((a: any, b: any) => a.date.localeCompare(b.date)).map((d: any) => [ymd(d.date), num(d.sessions), num(d.users)])),
        ],
      },
    ],
  },
  {
    id: "gsc", label: "Search Console (SEO)",
    sections: [
      {
        id: "search", label: "Search performance",
        items: [
          gsc("q_clicks", "Clicks", "clicks", num),
          gsc("q_impressions", "Impressions", "impressions", num),
          gsc("q_ctr", "CTR", "ctr", pct),
          gsc("q_position", "Avg position", "avgPosition"),
        ],
      },
      {
        id: "rankings", label: "Keyword rankings",
        items: [
          metric("q_top3", "Keywords in top 3", ["gsc"], c => c.gsc?.positionBuckets?.[0]?.keywords, num),
          metric("q_page1", "Keywords on page 1 (top 10)", ["gsc"], c => {
            const b = c.gsc?.positionBuckets; return b ? (b[0]?.keywords ?? 0) + (b[1]?.keywords ?? 0) : null;
          }, num),
          metric("q_page2", "Keywords on page 2 (11-20)", ["gsc"], c => c.gsc?.positionBuckets?.[2]?.keywords, num),
          metric("q_beyond", "Keywords beyond page 2 (21+)", ["gsc"], c => c.gsc?.positionBuckets?.[3]?.keywords, num),
        ],
      },
      {
        id: "branded", label: "Branded vs non-branded",
        items: [
          metric("q_branded_clicks", "Branded clicks", ["gsc"], c => c.gsc?.branded?.brandedClicks, num),
          metric("q_nonbranded_clicks", "Non-branded clicks", ["gsc"], c => c.gsc?.branded?.nonBrandedClicks, num),
          metric("q_nonbranded_share", "Non-branded share of clicks", ["gsc"], c => {
            const b = c.gsc?.branded; return b ? share(b.nonBrandedClicks, b.brandedClicks + b.nonBrandedClicks) : null;
          }, pct),
          metric("q_branded_impr", "Branded impressions", ["gsc"], c => c.gsc?.branded?.brandedImpr, num),
          metric("q_nonbranded_impr", "Non-branded impressions", ["gsc"], c => c.gsc?.branded?.nonBrandedImpr, num),
        ],
      },
      {
        id: "tables", label: "Tables",
        items: [
          table("gsc_queries", "Top search queries", ["gsc"], "Top Search Queries",
            ["Query", "Clicks", "Impressions", "CTR", "Position"],
            c => (c.gsc?.keywords ?? []).slice(0, 25).map((q: any) => [q.query, num(q.clicks), num(q.impressions), pct(q.ctr), q.position ?? 0])),
          table("gsc_pages", "Top pages", ["gsc"], "Top Pages (Search)",
            ["Page", "Clicks", "Impressions", "CTR", "Position"],
            c => (c.gsc?.pages ?? []).slice(0, 20).map((p: any) => [p.page, num(p.clicks), num(p.impressions), pct(p.ctr), p.position ?? 0])),
          table("gsc_positions", "Ranking position buckets", ["gsc"], "Keyword Ranking Buckets",
            ["Position", "Keywords", "Clicks", "Impressions"],
            c => (c.gsc?.positionBuckets ?? []).map((b: any) => [b.label, num(b.keywords), num(b.clicks), num(b.impressions)])),
          table("gsc_devices", "Devices", ["gsc"], "Search by Device", ["Device", "Clicks", "Impressions", "CTR"],
            c => (c.gsc?.devices ?? []).map((d: any) => [d.device, num(d.clicks), num(d.impressions), pct(d.ctr)])),
          table("gsc_countries", "Countries", ["gsc"], "Search by Country", ["Country", "Clicks", "Impressions", "CTR"],
            c => (c.gsc?.countries ?? []).slice(0, 15).map((d: any) => [d.country.toUpperCase(), num(d.clicks), num(d.impressions), pct(d.ctr)])),
          table("gsc_daily", "Daily clicks & impressions", ["gsc"], "Daily Search Performance",
            ["Date", "Clicks", "Impressions"],
            c => (c.gsc?.daily ?? []).map((d: any) => [d.date, num(d.clicks), num(d.impressions)])),
        ],
      },
    ],
  },
  {
    id: "ai", label: "AI Summary",
    sections: [
      {
        id: "ai", label: "AI analysis",
        items: [
          {
            kind: "table", id: "ai_exec", label: "Executive summary & overall score", sources: ["ai"],
            build: ({ ai }) => {
              if (!ai?.executiveSummary) return [];
              const score = ai.overallScore != null ? `  (Overall score: ${ai.overallScore}/100 - ${ai.scoreLabel ?? ""})` : "";
              return [{ title: "AI Executive Summary", headers: [], rows: [], text: `${ai.executiveSummary}${score}` }];
            },
          },
          table("ai_working", "What's working", ["ai"], "What's Working", ["Metric", "Value", "Insight"],
            c => (c.ai?.working ?? []).map((w: any) => [w.metric, w.value, w.insight])),
          table("ai_attention", "Needs attention", ["ai"], "Needs Attention", ["Metric", "Value", "Insight"],
            c => (c.ai?.notWorking ?? []).map((w: any) => [w.metric, w.value, w.insight])),
          table("ai_recs", "Recommendations", ["ai"], "Recommendations", ["Action", "Why", "Priority"],
            c => (c.ai?.recommendations ?? []).map((r: any) => [r.action, r.why, r.priority])),
        ],
      },
    ],
  },
];

// Flat lookup by item id, with its group/section for labels and KPI-table grouping.
export interface ItemRef { item: ReportItem; group: ReportGroup; section: ReportSection }
export const ITEM_BY_ID: Record<string, ItemRef> = Object.fromEntries(
  REPORT_GROUPS.flatMap(group => group.sections.flatMap(section =>
    section.items.map(item => [item.id, { item, group, section }]))),
);

// Templates saved before KPIs were split out used combined "summary" blocks - expand those
// into the individual metrics they used to contain. Table ids are unchanged.
const LEGACY: Record<string, string[]> = {
  sales_summary: ["s_revenue", "s_orders", "s_aov", "s_new_orders", "s_returning_orders", "s_cod_orders", "s_prepaid_orders", "s_avg_items"],
  refunds_discounts: ["s_refunded", "s_discounts"],
  customer_summary: ["c_active", "c_new", "c_returning", "c_repeat_share", "c_spend_per_buyer", "c_revenue"],
  meta_summary: ["m_spend", "m_roas", "m_cac", "m_purchases", "m_purchase_value", "m_leads", "m_cpl", "m_ctr", "m_cpc", "m_cpm", "m_impressions", "m_reach", "m_clicks", "m_frequency"],
  meta_funnel: ["m_lpv", "m_atc", "m_checkout", "m_purchases", "m_atc_rate", "m_checkout_rate", "m_purchase_rate"],
  ga4_summary: ["a_sessions", "a_users", "a_new_users", "a_pageviews", "a_bounce", "a_avg_session"],
  ga4_ecom: ["a_items_viewed", "a_atc", "a_checkouts", "a_items_purchased", "a_purchases", "a_revenue", "a_atc_rate", "a_checkout_rate", "a_purchase_rate"],
  gsc_summary: ["q_clicks", "q_impressions", "q_ctr", "q_position"],
  ai_summary: ["ai_exec", "ai_working", "ai_attention", "ai_recs"],
};
export function normalizeItemIds(ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) for (const x of LEGACY[id] ?? [id]) if (ITEM_BY_ID[x] && !out.includes(x)) out.push(x);
  return out;
}

// Which data sources a set of selected items needs (so we only fetch those).
export function sourcesFor(ids: string[]): ReportSource[] {
  const set = new Set<ReportSource>();
  for (const id of ids) ITEM_BY_ID[id]?.item.sources.forEach(s => set.add(s));
  // The AI analysis summarises the other platforms, so it needs their data too.
  if (set.has("ai")) (["shopify", "meta", "ga4", "gsc"] as ReportSource[]).forEach(s => set.add(s));
  return [...set];
}

// Turn the ordered selection into PDF sections. Metrics from the same section collapse into
// one Metric/Value table at the position of the first one; tables render where they sit.
export function buildReportSections(ids: string[], ctx: ReportCtx): ExportSection[] {
  const out: ExportSection[] = [];
  const kpiTables = new Map<string, ExportSection>();
  for (const id of ids) {
    const ref = ITEM_BY_ID[id];
    if (!ref) continue;
    const { item, group, section } = ref;
    if (item.kind === "table") { out.push(...item.build(ctx)); continue; }
    const value = item.value(ctx);
    if (value == null) continue;
    const key = `${group.id}/${section.id}`;
    let kpiTable = kpiTables.get(key);
    if (!kpiTable) {
      kpiTable = { title: `${group.label} - ${section.label}`, headers: ["Metric", "Value"], rows: [] };
      kpiTables.set(key, kpiTable);
      out.push(kpiTable);
    }
    kpiTable.rows.push([item.label, value]);
  }
  return out;
}
