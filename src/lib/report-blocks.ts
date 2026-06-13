/* eslint-disable @typescript-eslint/no-explicit-any */
// Catalog of report blocks for the custom report builder. Each block knows which data
// source(s) it needs and how to turn that data into PDF/CSV ExportSection(s). The builder
// fetches each needed source once, then runs the selected blocks' `build` in order.

import { ExportSection } from "@/lib/export";

export type ReportSource = "shopify" | "dashboard" | "customers" | "meta" | "ga4" | "gsc" | "ai";

export interface ReportCtx {
  shopify?: any | null;     // /api/shopify/sales
  dashboard?: any | null;   // /api/shopify/dashboard
  customers?: any | null;   // /api/shopify/customers/period
  meta?: any | null;        // /api/meta
  ga4?: any | null;         // /api/ga4
  gsc?: any | null;         // /api/gsc
  ai?: any | null;          // /api/ai/report (parsed JSON)
}

export interface ReportBlock {
  id: string;
  label: string;
  sources: ReportSource[];
  build: (ctx: ReportCtx) => ExportSection[];
}

export interface ReportGroup {
  id: string;
  label: string;
  blocks: ReportBlock[];
}

// ── helpers ──────────────────────────────────────────────────────────────────
const inr = (n: any) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
const num = (n: any) => Number(n ?? 0).toLocaleString("en-IN");
const kpi = (title: string, pairs: [string, string | number][]): ExportSection => ({
  title, headers: ["Metric", "Value"], rows: pairs.map(([k, v]) => [k, v]),
});

// ── catalog ──────────────────────────────────────────────────────────────────
export const REPORT_GROUPS: ReportGroup[] = [
  {
    id: "sales", label: "Sales & Orders",
    blocks: [
      {
        id: "sales_summary", label: "Sales summary (revenue, orders, AOV)", sources: ["shopify"],
        build: ({ shopify }) => {
          const k = shopify?.kpis; if (!k) return [];
          return [kpi("Sales Summary", [
            ["Revenue", inr(k.grossSales)], ["Orders", num(k.totalOrders)], ["AOV", inr(k.aov)],
            ["New customers", num(k.newCustomers)], ["Returning customers", num(k.returningCustomers)],
            ["COD orders", num(k.codOrders)], ["Prepaid orders", num(k.prepaidOrders)],
            ["Avg items / order", k.avgItemsPerOrder ?? 0],
          ])];
        },
      },
      {
        id: "top_products", label: "Top products", sources: ["shopify"],
        build: ({ shopify }) => {
          const rows = (shopify?.allBySku ?? shopify?.topByRevenue ?? []).map((p: any) => [p.name, num(p.qty), inr(p.revenue)]);
          return rows.length ? [{ title: "Top Products", headers: ["Product", "Qty", "Revenue"], rows }] : [];
        },
      },
      {
        id: "top_cities", label: "Top cities", sources: ["shopify"],
        build: ({ shopify }) => {
          const rows = (shopify?.topCities ?? []).map((c: any) => [c.city, num(c.orders), inr(c.revenue)]);
          return rows.length ? [{ title: "Top Cities", headers: ["City", "Orders", "Revenue"], rows }] : [];
        },
      },
      {
        id: "top_states", label: "Top states", sources: ["shopify"],
        build: ({ shopify }) => {
          const rows = (shopify?.topStates ?? []).map((s: any) => [s.state, num(s.orders), inr(s.revenue)]);
          return rows.length ? [{ title: "Top States", headers: ["State", "Orders", "Revenue"], rows }] : [];
        },
      },
      {
        id: "daily_revenue", label: "Daily revenue", sources: ["dashboard"],
        build: ({ dashboard }) => {
          const rows = (dashboard?.dailyRevenue ?? []).map((d: any) => [d.day, inr(d.revenue)]);
          return rows.length ? [{ title: "Daily Revenue", headers: ["Day", "Revenue"], rows }] : [];
        },
      },
      {
        id: "refunds_discounts", label: "Refunds & discounts", sources: ["dashboard"],
        build: ({ dashboard }) => {
          const k = dashboard?.kpis; if (!k) return [];
          return [kpi("Refunds & Discounts", [
            ["Refunded revenue", inr(k.refundedRevenue)], ["Total discounts", inr(k.totalDiscounts)],
          ])];
        },
      },
    ],
  },
  {
    id: "customers", label: "Customers",
    blocks: [
      {
        id: "customer_summary", label: "Customer summary (buyers, repeat, spend)", sources: ["customers"],
        build: ({ customers }) => {
          const k = customers?.kpis; if (!k) return [];
          return [kpi("Customer Summary", [
            ["Active buyers", num(k.activeBuyers)], ["New buyers", num(k.newBuyers)],
            ["Returning buyers", num(k.returningBuyers)], ["Repeat share", `${k.repeatShare ?? 0}%`],
            ["Spend per buyer", inr(k.spendPerBuyer)], ["Revenue", inr(k.revenue)],
          ])];
        },
      },
    ],
  },
  {
    id: "meta", label: "Meta Ads",
    blocks: [
      {
        id: "meta_summary", label: "Meta summary (spend, ROAS, leads, CTR)", sources: ["meta"],
        build: ({ meta }) => {
          const k = meta?.kpis; if (!k) return [];
          return [kpi("Meta Ads Summary", [
            ["Spend", inr(k.spend)], ["ROAS", `${k.roas ?? 0}x`], ["CAC", inr(k.cac)],
            ["Orders", num(k.purchases)], ["Revenue", inr(k.purchaseValue)],
            ["Leads", num(k.leads)], ["Cost / Lead", k.leads ? inr(k.costPerLead) : "—"],
            ["CTR", `${k.ctr ?? 0}%`], ["CPC", inr(k.cpc)], ["CPM", inr(k.cpm)],
            ["Impressions", num(k.impressions)], ["Reach", num(k.reach)], ["Clicks", num(k.clicks)],
            ["Frequency", `${k.frequency ?? 0}x`],
          ])];
        },
      },
      {
        id: "meta_campaigns", label: "Top campaigns", sources: ["meta"],
        build: ({ meta }) => {
          const rows = (meta?.campaigns ?? []).slice(0, 15).map((c: any) => [
            c.name, inr(c.spend), `${c.roas ?? 0}x`, num(c.leads), num(c.purchases), `${c.ctr ?? 0}%`,
          ]);
          return rows.length ? [{ title: "Top Campaigns", headers: ["Campaign", "Spend", "ROAS", "Leads", "Orders", "CTR"], rows }] : [];
        },
      },
      {
        id: "meta_funnel", label: "Funnel (LPV → ATC → checkout → purchase)", sources: ["meta"],
        build: ({ meta }) => {
          const k = meta?.kpis; if (!k) return [];
          return [kpi("Meta Funnel", [
            ["Landing page views", num(k.lpv)], ["Add to cart", num(k.atc)],
            ["Checkout started", num(k.checkout)], ["Purchases", num(k.purchases)],
            ["ATC ratio", `${k.atcRatio ?? 0}%`], ["Checkout ratio", `${k.checkoutRatio ?? 0}%`],
            ["Purchase ratio", `${k.purchaseRatio ?? 0}%`],
          ])];
        },
      },
    ],
  },
  {
    id: "ga4", label: "Google Analytics (GA4)",
    blocks: [
      {
        id: "ga4_summary", label: "Traffic summary (sessions, users, bounce)", sources: ["ga4"],
        build: ({ ga4 }) => {
          const k = ga4?.kpis; if (!k) return [];
          return [kpi("GA4 Traffic Summary", [
            ["Sessions", num(k.sessions)], ["Users", num(k.users)], ["New users", num(k.newUsers)],
            ["Pageviews", num(k.pageviews)], ["Bounce rate", `${k.bounceRate ?? 0}%`],
            ["Avg session", k.avgSessionMin ?? "—"],
          ])];
        },
      },
      {
        id: "ga4_channels", label: "Channels", sources: ["ga4"],
        build: ({ ga4 }) => {
          const rows = (ga4?.channels ?? []).map((c: any) => [c.channel, num(c.sessions), num(c.users), num(c.purchases), inr(c.revenue)]);
          return rows.length ? [{ title: "Traffic Channels", headers: ["Channel", "Sessions", "Users", "Purchases", "Revenue"], rows }] : [];
        },
      },
      {
        id: "ga4_ecom", label: "Ecommerce funnel", sources: ["ga4"],
        build: ({ ga4 }) => {
          const e = ga4?.ecommerce; if (!e) return [];
          return [kpi("GA4 Ecommerce", [
            ["Items viewed", num(e.itemsViewed)], ["Added to cart", num(e.itemsAddedToCart)],
            ["Checked out", num(e.itemsCheckedOut)], ["Purchased", num(e.itemsPurchased)],
            ["Purchases", num(e.purchases)], ["Revenue", inr(e.revenue)],
            ["ATC rate", `${e.atcRate ?? 0}%`], ["Checkout rate", `${e.checkoutRate ?? 0}%`], ["Purchase rate", `${e.purchaseRate ?? 0}%`],
          ])];
        },
      },
    ],
  },
  {
    id: "gsc", label: "Search (GSC)",
    blocks: [
      {
        id: "gsc_summary", label: "Search summary (clicks, impressions, CTR, position)", sources: ["gsc"],
        build: ({ gsc }) => {
          const k = gsc?.kpis; if (!k) return [];
          return [kpi("Search Console Summary", [
            ["Clicks", num(k.clicks)], ["Impressions", num(k.impressions)],
            ["CTR", `${k.ctr ?? 0}%`], ["Avg position", k.avgPosition ?? 0],
          ])];
        },
      },
      {
        id: "gsc_queries", label: "Top search queries", sources: ["gsc"],
        build: ({ gsc }) => {
          const rows = (gsc?.keywords ?? []).slice(0, 20).map((q: any) => [q.query, num(q.clicks), num(q.impressions), `${q.ctr ?? 0}%`, q.position ?? 0]);
          return rows.length ? [{ title: "Top Search Queries", headers: ["Query", "Clicks", "Impressions", "CTR", "Position"], rows }] : [];
        },
      },
      {
        id: "gsc_pages", label: "Top pages", sources: ["gsc"],
        build: ({ gsc }) => {
          const rows = (gsc?.pages ?? []).slice(0, 20).map((p: any) => [p.page, num(p.clicks), num(p.impressions), `${p.ctr ?? 0}%`, p.position ?? 0]);
          return rows.length ? [{ title: "Top Pages", headers: ["Page", "Clicks", "Impressions", "CTR", "Position"], rows }] : [];
        },
      },
    ],
  },
  {
    id: "ai", label: "AI Summary",
    blocks: [
      {
        id: "ai_summary", label: "AI executive summary & recommendations", sources: ["ai"],
        build: ({ ai }) => {
          if (!ai) return [];
          const out: ExportSection[] = [];
          const head = ai.executiveSummary
            ? `${ai.executiveSummary}${ai.overallScore != null ? `  (Overall score: ${ai.overallScore}/100 — ${ai.scoreLabel ?? ""})` : ""}`
            : "";
          if (head) out.push({ title: "AI Executive Summary", headers: [], rows: [], text: head });
          const working = (ai.working ?? []).map((w: any) => [w.metric, w.value, w.insight]);
          if (working.length) out.push({ title: "What's Working", headers: ["Metric", "Value", "Insight"], rows: working });
          const notWorking = (ai.notWorking ?? []).map((w: any) => [w.metric, w.value, w.insight]);
          if (notWorking.length) out.push({ title: "Needs Attention", headers: ["Metric", "Value", "Insight"], rows: notWorking });
          const recs = (ai.recommendations ?? []).map((r: any) => [r.action, r.why, r.priority]);
          if (recs.length) out.push({ title: "Recommendations", headers: ["Action", "Why", "Priority"], rows: recs });
          return out;
        },
      },
    ],
  },
];

// Flat lookup by block id.
export const BLOCK_BY_ID: Record<string, ReportBlock> = Object.fromEntries(
  REPORT_GROUPS.flatMap(g => g.blocks.map(b => [b.id, b])),
);

// Which data sources a set of selected blocks needs (so we only fetch those).
export function sourcesFor(blockIds: string[]): ReportSource[] {
  const set = new Set<ReportSource>();
  for (const id of blockIds) BLOCK_BY_ID[id]?.sources.forEach(s => set.add(s));
  // The AI block summarises the other platforms, so it needs their data too.
  if (set.has("ai")) { (["shopify", "meta", "ga4", "gsc"] as ReportSource[]).forEach(s => set.add(s)); }
  return [...set];
}
