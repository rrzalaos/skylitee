"use client";
import { useEffect, useState, useMemo } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  AlertCircle, AlertTriangle, CheckCircle2, TrendingUp,
  ShoppingCart, Share2, Search, Plug, MessageSquareText, Layout,
  Zap, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useDateRange, getComparisonRange } from "@/lib/date-range-context";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */
interface ShopData {
  shop: string;
  kpis: { grossSales: number; totalOrders: number; aov: number; newCustomers: number; returningCustomers: number; codOrders: number; prepaidOrders: number };
  dailyRevenue: { day: string; revenue: number }[];
  topCities: { city: string; revenue: number }[];
  period: { days: number };
}
interface AnomalyData {
  critical: { title: string; desc: string }[];
  warnings: { title: string; desc: string }[];
  positive: { title: string; desc: string }[];
  summary: { projectedMonthly: number; grossSales: number; totalOrders: number; codPct: number; repeatRate: number };
}
interface MetaKPIs { spend: number; roas: number; purchases: number; purchaseValue: number; clicks: number; ctr: number; impressions: number; frequency: number }
interface GadsKPIs { spend: number; roas: number; conversions: number; conversionValue: number; clicks: number; ctr: number; impressions: number }
interface GscKPIs { clicks: number; impressions: number; ctr: number; avgPosition: number }
interface Ga4KPIs { sessions: number; users: number; bounceRate: number; avgSessionMin?: string; newUsers?: number }

/* ─── Helpers ────────────────────────────────────────────────── */
function signal(type: "roas" | "ctr" | "freq" | "cod", val: number): { label: string; color: string } {
  if (type === "roas") {
    if (val >= 3) return { label: "Strong", color: "text-[#22C55E] bg-[#F0FDF4]" };
    if (val >= 2) return { label: "Average", color: "text-[#EAB308] bg-[#FFFBEB]" };
    return { label: "Low", color: "text-[#EF4444] bg-[#FEF2F2]" };
  }
  if (type === "ctr") {
    if (val >= 1.5) return { label: "Above avg", color: "text-[#22C55E] bg-[#F0FDF4]" };
    if (val >= 0.9) return { label: "Average", color: "text-[#EAB308] bg-[#FFFBEB]" };
    return { label: "Below avg", color: "text-[#EF4444] bg-[#FEF2F2]" };
  }
  if (type === "cod") {
    if (val > 60) return { label: `${val}% COD — High`, color: "text-[#EF4444] bg-[#FEF2F2]" };
    if (val > 40) return { label: `${val}% COD — Monitor`, color: "text-[#EAB308] bg-[#FFFBEB]" };
    return { label: `${val}% COD — Healthy`, color: "text-[#22C55E] bg-[#F0FDF4]" };
  }
  return { label: "", color: "" };
}

const quickActions = [
  { label: "Sales Report", sub: "Revenue, orders, COD vs prepaid", href: "/dashboard/sales", icon: ShoppingCart, color: "bg-[#FFF7ED] text-[#F97316]" },
  { label: "Meta Campaigns", sub: "Spend, ROAS, funnel analysis", href: "/dashboard/meta", icon: Share2, color: "bg-[#EFF6FF] text-[#1877F2]" },
  { label: "Search Console", sub: "Keywords, clicks, impressions", href: "/dashboard/gsc", icon: Search, color: "bg-[#F0FDF4] text-[#16A34A]" },
  { label: "Ads Placement", sub: "Top performing placements", href: "/dashboard/placement", icon: Layout, color: "bg-[#F5F3FF] text-[#7C3AED]" },
  { label: "AI Assistant", sub: "Ask anything about your store", href: "/dashboard/chat", icon: MessageSquareText, color: "bg-[#FEF2F2] text-[#DC2626]" },
  { label: "Connections", sub: "Manage platform integrations", href: "/dashboard/connections", icon: Plug, color: "bg-[#F5F5F4] text-[#71717A]" },
];

/* ─── Component ─────────────────────────────────────────────── */
export default function CommandCenterPage() {
  const { range, compareWith } = useDateRange();

  const [shop, setShop] = useState<ShopData | null>(null);
  const [compShop, setCompShop] = useState<ShopData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
  const [meta, setMeta] = useState<MetaKPIs | null>(null);
  const [metaDaily, setMetaDaily] = useState<{ date: string; spend: number; purchaseValue: number }[]>([]);
  const [gads, setGads] = useState<GadsKPIs | null>(null);
  const [gadsDaily, setGadsDaily] = useState<{ date: string; spend: number }[]>([]);
  const [gsc, setGsc] = useState<GscKPIs | null>(null);
  const [ga4, setGa4] = useState<Ga4KPIs | null>(null);
  const [connections, setConnections] = useState({ shopify: false, meta: false, gads: false, gsc: false, ga4: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const compRange = getComparisonRange(range, compareWith);

    Promise.allSettled([
      fetch(`/api/shopify/dashboard?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch("/api/shopify/anomalies").then(r => r.json()),
      compRange ? fetch(`/api/shopify/dashboard?from=${compRange.from}&to=${compRange.to}`).then(r => r.json()) : Promise.resolve(null),
      fetch(`/api/meta?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch(`/api/gsc?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch(`/api/ga4?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch(`/api/google/ads?from=${range.from}&to=${range.to}`).then(r => r.json()),
    ]).then(results => {
      const [shopRes, anomRes, compRes, metaRes, gscRes, ga4Res, gadsRes] = results;

      if (shopRes.status === "fulfilled" && !shopRes.value?.error) {
        setShop(shopRes.value);
        setConnections(c => ({ ...c, shopify: true }));
      }
      if (anomRes.status === "fulfilled" && !anomRes.value?.error) setAnomalies(anomRes.value);
      if (compRes.status === "fulfilled" && compRes.value && !compRes.value?.error) setCompShop(compRes.value);
      if (metaRes.status === "fulfilled" && !metaRes.value?.error) {
        setMeta(metaRes.value.kpis ?? null);
        setMetaDaily(metaRes.value.daily ?? []);
        setConnections(c => ({ ...c, meta: true }));
      }
      if (gscRes.status === "fulfilled" && !gscRes.value?.error) {
        setGsc(gscRes.value.kpis ?? null);
        setConnections(c => ({ ...c, gsc: true }));
      }
      if (ga4Res.status === "fulfilled" && !ga4Res.value?.error) {
        setGa4(ga4Res.value.kpis ?? null);
        setConnections(c => ({ ...c, ga4: true }));
      }
      if (gadsRes.status === "fulfilled" && !gadsRes.value?.error) {
        setGads(gadsRes.value.kpis ?? null);
        setGadsDaily(gadsRes.value.daily ?? []);
        setConnections(c => ({ ...c, gads: true }));
      }
    }).finally(() => setLoading(false));
  }, [range.from, range.to, compareWith]);

  /* ── Derived values ── */
  const shopName = shop?.shop?.replace(".myshopify.com", "") ?? "";
  const days = shop?.period.days ?? 1;
  const projected = anomalies?.summary.projectedMonthly ?? 0;
  const codPct = shop ? Math.round((shop.kpis.codOrders / Math.max(shop.kpis.totalOrders, 1)) * 100) : 0;
  const compLabel = getComparisonRange(range, compareWith)?.label ?? "prev period";

  function pct(curr: number, prev: number | undefined): number | undefined {
    if (!prev || !compShop) return undefined;
    return +((curr - prev) / prev * 100).toFixed(1);
  }
  function deltaLabel(v: number | undefined) {
    if (v === undefined) return undefined;
    return `${v >= 0 ? "+" : ""}${v}% vs ${compLabel}`;
  }

  const salesChange = pct(shop?.kpis.grossSales ?? 0, compShop?.kpis.grossSales);
  const ordersChange = pct(shop?.kpis.totalOrders ?? 0, compShop?.kpis.totalOrders);
  const aovChange = pct(shop?.kpis.aov ?? 0, compShop?.kpis.aov);

  /* ── Blended ad metrics (MER): total store sales vs total ad spend across channels ── */
  const totalSpend = (meta?.spend ?? 0) + (gads?.spend ?? 0);
  const totalSales = shop?.kpis.grossSales ?? 0;
  const blendedRoas = totalSpend > 0 ? +(totalSales / totalSpend).toFixed(2) : 0;
  const hasSpend = !!(meta || gads);

  /* ── Combined chart data ── */
  const chartData = useMemo(() => {
    if (!shop) return [];
    return shop.dailyRevenue.map(d => {
      const md = metaDaily.find(m => m.date.slice(5).replace("-", "/") === d.day || m.date === d.day);
      const gd = gadsDaily.find(g => g.date.slice(5).replace("-", "/") === d.day || g.date === d.day);
      return { day: d.day, revenue: d.revenue, spend: (md?.spend ?? 0) + (gd?.spend ?? 0) };
    });
  }, [shop, metaDaily, gadsDaily]);

  /* ── Key Insights (computed, no API) ── */
  const insights = useMemo(() => {
    const list: { type: "positive" | "warning" | "danger"; title: string; body: string }[] = [];
    // Meta ROAS — vs 2x break-even / 3x good
    if (meta) {
      if (meta.roas >= 3.0) list.push({ type: "positive", title: `ROAS ${meta.roas}x — campaigns profitable`, body: "Above the 3x D2C benchmark. Ads are working — scale budget 20–30% on your best campaigns to grow without hurting ROAS." });
      else if (meta.roas >= 2.0) list.push({ type: "warning", title: `ROAS ${meta.roas}x — okay, below the 3x target`, body: "Past break-even but not strong profit yet. Why: one funnel stage is leaking. Fix the weakest stage on the Meta page and shift budget to top campaigns to reach 3x." });
      else list.push({ type: "danger", title: `ROAS ${meta.roas}x — below the 2x minimum`, body: "You're not recovering ad spend. Pause the lowest-ROAS campaigns and fix your biggest funnel drop-off before raising budgets." });
    }
    // Search CTR — vs 2–3% average
    if (gsc) {
      if (gsc.ctr >= 2.0) list.push({ type: "positive", title: `Search CTR ${gsc.ctr.toFixed(1)}% — healthy`, body: "At/above the 2–3% search average. Your titles and descriptions are pulling clicks. Keep optimising top pages to hold rankings." });
      else list.push({ type: "warning", title: `Search CTR ${gsc.ctr.toFixed(1)}% — below the 2% average`, body: "People see you in search but don't click. Why: weak title tags / meta descriptions. Rewrite them with the benefit + a reason to click on your highest-impression pages." });
    }
    // COD mix — vs return-risk threshold
    if (shop && shop.kpis.totalOrders > 0) {
      if (codPct > 55) list.push({ type: "warning", title: `COD at ${codPct}% — return risk`, body: "High COD raises RTO/returns and ties up cash. Why: prepaid isn't incentivised. Offer a ₹75–100 prepaid discount or free shipping on prepaid to shift behaviour." });
      else if (codPct <= 40) list.push({ type: "positive", title: `COD at ${codPct}% — healthy prepaid mix`, body: "Most orders are prepaid, lowering return risk and improving cash flow. Keep prepaid incentives running." });
    }
    // Anomaly feed highlights
    if (anomalies?.critical?.length) list.push({ type: "danger", title: anomalies.critical[0].title, body: anomalies.critical[0].desc });
    if (anomalies?.positive?.length) list.push({ type: "positive", title: anomalies.positive[0].title, body: anomalies.positive[0].desc });

    // Show what needs attention first, then what's working
    const order = { danger: 0, warning: 1, positive: 2 } as const;
    list.sort((a, b) => order[a.type] - order[b.type]);
    return list.slice(0, 5);
  }, [meta, shop, codPct, anomalies, gsc]);

  const allAlerts = [...(anomalies?.critical ?? []), ...(anomalies?.warnings ?? [])];
  const liveCount = [connections.shopify, connections.meta, connections.gsc, connections.ga4].filter(Boolean).length;

  /* ─── Platform status strip ── */
  const platforms = [
    { label: "Shopify", connected: connections.shopify },
    { label: "Meta Ads", connected: connections.meta },
    { label: "GSC", connected: connections.gsc },
    { label: "GA4", connected: connections.ga4 },
    { label: "Google Ads", connected: connections.gads },
  ];

  return (
    <div className="space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Command Center</h2>
            {loading ? (
              <span className="text-[12px] text-[#A1A1AA] flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Loading…
              </span>
            ) : connections.shopify ? (
              <span className="flex items-center gap-1 text-[12px] text-[#EA580C] dark:text-[#FB923C] bg-[#FFF7ED] dark:bg-[#2A1A0E] px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" /> Live · {shopName}
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-[#A1A1AA] mt-0.5">{range.label} · {liveCount} of 5 platforms active</p>
        </div>

        {/* Platform status pills — hide on mobile */}
        <div className="hidden sm:flex items-center gap-1.5">
          {platforms.map(p => (
            <div key={p.label} className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border",
              p.connected
                ? "bg-[#F5F5F4] dark:bg-[#1C1C1C] border-black/[0.06] dark:border-white/[0.06] text-[#52525B] dark:text-[#A1A1AA]"
                : "bg-white dark:bg-[#171717] border-black/[0.04] dark:border-white/[0.04] text-[#A1A1AA]"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", p.connected ? "bg-[#22C55E]" : "bg-[#D4D4D4] dark:bg-[#525252]")} />
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Row: 6 cross-channel cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <KPICard
          label="Monthly Sales"
          value={shop ? formatINR(shop.kpis.grossSales) : "—"}
          change={salesChange}
          changeLabel={deltaLabel(salesChange)}
        />
        <KPICard
          label="Blended ROAS"
          value={hasSpend ? `${blendedRoas}x` : "—"}
          change={hasSpend ? (blendedRoas >= 2 ? 1 : -1) : undefined}
          changeLabel={hasSpend ? signal("roas", blendedRoas).label : undefined}
        />
        <KPICard
          label="Orders"
          value={shop ? shop.kpis.totalOrders.toString() : "—"}
          change={ordersChange}
          changeLabel={deltaLabel(ordersChange)}
        />
        <KPICard
          label="AOV"
          value={shop ? formatINR(shop.kpis.aov) : "—"}
          change={aovChange}
          changeLabel={deltaLabel(aovChange)}
        />
        <KPICard
          label="Total Ad Spend"
          value={hasSpend ? formatINR(totalSpend) : "—"}
          change={hasSpend ? (blendedRoas >= 2 ? 1 : -1) : undefined}
          changeLabel={hasSpend ? `${connections.gads ? "Meta + Google" : "Meta"} · ${blendedRoas}x` : undefined}
        />
        <KPICard
          label={gsc ? "GSC Clicks" : ga4 ? "Sessions" : "New Customers"}
          value={gsc ? gsc.clicks.toLocaleString("en-IN") : ga4 ? ga4.sessions.toLocaleString("en-IN") : (shop?.kpis.newCustomers.toString() ?? "—")}
          change={gsc ? (gsc.ctr >= 1.5 ? 1 : -1) : undefined}
          changeLabel={gsc ? `${gsc.ctr.toFixed(1)}% CTR` : undefined}
        />
      </div>

      {/* ── Main: Revenue chart + Channel panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Combined revenue + spend chart */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Revenue vs Ad Spend"
              right={<span className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-[#F97316] inline-block" /> Revenue</span>
                {(connections.meta || connections.gads) && <span className="flex items-center gap-1"><span className="w-3 h-px rounded bg-[#94A3B8] inline-block border-b border-dashed border-[#94A3B8]" /> Ad Spend</span>}
              </span>}
            />
            {loading ? (
              <div className="h-44 flex items-center justify-center text-[13px] text-[#A1A1AA]">Loading chart…</div>
            ) : chartData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-[13px] text-[#A1A1AA]">No revenue data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 6)} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    formatter={(v, name) => [formatINR(Number(v)), name === "revenue" ? "Revenue" : "Ad Spend"]}
                  />
                  <Bar dataKey="revenue" fill="#F97316" radius={[3, 3, 0, 0]} barSize={10} opacity={0.9} />
                  {(connections.meta || connections.gads) && (
                    <Line type="monotone" dataKey="spend" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* Forecast strip */}
            {projected > 0 && (
              <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] text-[#A1A1AA]">
                  <TrendingUp size={12} className="text-[#F97316]" />
                  At current pace ({days} days into period)
                </div>
                <div className="text-[13px] font-bold text-[#EA580C] dark:text-[#FB923C]">
                  {formatINR(projected)} projected
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Channel performance panel */}
        <Card>
          <CardHeader title="Channel Performance" />
          <div className="space-y-0">
            {/* Shopify */}
            <div className={cn("py-3 border-b border-black/[0.06] dark:border-white/[0.06]", !connections.shopify && "opacity-50")}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", connections.shopify ? "bg-[#22C55E]" : "bg-[#D4D4D4]")} />
                  <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">Shopify</span>
                </div>
                <span className="text-[10px] text-[#22C55E] bg-[#F0FDF4] dark:bg-[#052E16] px-1.5 py-0.5 rounded-full font-bold">Live</span>
              </div>
              {shop ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-black text-[#18181B] dark:text-[#F4F4F5]">{formatINR(shop.kpis.grossSales)}</div>
                    <div className="text-[11px] text-[#A1A1AA]">{shop.kpis.totalOrders} orders · AOV {formatINR(shop.kpis.aov)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-[#EAB308]">{codPct}% COD</div>
                    <div className="text-[11px] text-[#A1A1AA]">{shop.kpis.newCustomers} new</div>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-[#A1A1AA]">Not connected</div>
              )}
            </div>

            {/* Meta */}
            <div className={cn("py-3 border-b border-black/[0.06] dark:border-white/[0.06]", !connections.meta && "opacity-50")}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", connections.meta ? "bg-[#22C55E]" : "bg-[#D4D4D4]")} />
                  <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">Meta Ads</span>
                </div>
                {connections.meta && meta && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", signal("roas", meta.roas).color)}>
                    ROAS {meta.roas}x
                  </span>
                )}
              </div>
              {connections.meta && meta ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-black text-[#18181B] dark:text-[#F4F4F5]">{formatINR(meta.spend)}</div>
                    <div className="text-[11px] text-[#A1A1AA]">spend · {meta.purchases} purchases</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold">{formatINR(meta.purchaseValue)}</div>
                    <div className="text-[11px] text-[#A1A1AA]">{meta.ctr}% CTR</div>
                  </div>
                </div>
              ) : (
                <Link href="/dashboard/connections" className="text-[12px] text-[#F97316] font-semibold">Connect Meta →</Link>
              )}
            </div>

            {/* GSC */}
            <div className={cn("py-3 border-b border-black/[0.06] dark:border-white/[0.06]", !connections.gsc && "opacity-50")}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", connections.gsc ? "bg-[#22C55E]" : "bg-[#D4D4D4]")} />
                  <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">Search Console</span>
                </div>
              </div>
              {connections.gsc && gsc ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-black text-[#18181B] dark:text-[#F4F4F5]">{gsc.clicks.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-[#A1A1AA]">clicks · {gsc.impressions.toLocaleString("en-IN")} impressions</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-[12px] font-semibold", gsc.ctr >= 1.5 ? "text-[#F97316]" : "text-[#EAB308]")}>{gsc.ctr.toFixed(1)}% CTR</div>
                    <div className="text-[11px] text-[#A1A1AA]">pos {gsc.avgPosition.toFixed(1)}</div>
                  </div>
                </div>
              ) : (
                <Link href="/dashboard/connections" className="text-[12px] text-[#F97316] font-semibold">Connect GSC →</Link>
              )}
            </div>

            {/* GA4 */}
            <div className={cn("py-3", !connections.ga4 && "opacity-50")}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", connections.ga4 ? "bg-[#22C55E]" : "bg-[#D4D4D4]")} />
                  <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">Analytics GA4</span>
                </div>
              </div>
              {connections.ga4 && ga4 ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[18px] font-black text-[#18181B] dark:text-[#F4F4F5]">{ga4.sessions.toLocaleString("en-IN")}</div>
                    <div className="text-[11px] text-[#A1A1AA]">sessions · {ga4.users.toLocaleString("en-IN")} users</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-[#A1A1AA]">{ga4.bounceRate.toFixed(0)}% bounce</div>
                    <div className="text-[11px] text-[#A1A1AA]">{ga4.avgSessionMin ?? "—"} avg</div>
                  </div>
                </div>
              ) : (
                <Link href="/dashboard/connections" className="text-[12px] text-[#F97316] font-semibold">Connect GA4 →</Link>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Bottom row: Alerts + Insights + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Alerts & Signals */}
        <Card>
          <CardHeader title="Alerts & Signals" right={
            allAlerts.length > 0
              ? <span className="text-[11px] text-[#EF4444] font-bold bg-[#FEF2F2] dark:bg-[#2D0A0A] px-2 py-0.5 rounded-full">{allAlerts.length} action needed</span>
              : <span className="text-[11px] text-[#22C55E] font-bold bg-[#F0FDF4] dark:bg-[#052E16] px-2 py-0.5 rounded-full">All clear</span>
          } />

          {(anomalies?.critical ?? []).map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-[#FEF2F2] dark:bg-[#2D0A0A] flex items-center justify-center shrink-0 border border-[#FCA5A5] dark:border-[#991B1B]">
                <AlertCircle size={12} className="text-[#EF4444]" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{a.title}</div>
                <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{a.desc}</div>
              </div>
            </div>
          ))}

          {(anomalies?.warnings ?? []).map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] dark:bg-[#2D1C00] flex items-center justify-center shrink-0 border border-[#FCD34D] dark:border-[#92400E]">
                <AlertTriangle size={12} className="text-[#EAB308]" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{a.title}</div>
                <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{a.desc}</div>
              </div>
            </div>
          ))}

          {(anomalies?.positive ?? []).slice(0, 2).map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] dark:bg-[#2A1A0E] flex items-center justify-center shrink-0 border border-[#FED7AA] dark:border-[#7C2D12]">
                <CheckCircle2 size={12} className="text-[#F97316]" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[#EA580C] dark:text-[#FB923C]">{a.title}</div>
                <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{a.desc}</div>
              </div>
            </div>
          ))}

          {allAlerts.length === 0 && (anomalies?.positive ?? []).length === 0 && !loading && (
            <div className="text-[12px] text-[#A1A1AA] py-4 text-center">No anomalies detected</div>
          )}
          {loading && <div className="text-[12px] text-[#A1A1AA] py-4 text-center">Checking alerts…</div>}

          <Link href="/dashboard/anomaly" className="block mt-3 text-[12px] font-bold text-[#F97316]">View all alerts →</Link>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader title="Key Insights" right={<span className="flex items-center gap-1 text-[#A1A1AA]"><Zap size={11} /> Computed live</span>} />

          {loading ? (
            <div className="text-[12px] text-[#A1A1AA] py-4 text-center">Computing insights…</div>
          ) : insights.length === 0 ? (
            <div className="text-[12px] text-[#A1A1AA] py-4 text-center">Connect more platforms for insights</div>
          ) : (
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <div key={i} className={cn(
                  "rounded-xl p-3 border-l-[3px]",
                  ins.type === "positive" ? "bg-[#F0FDF4] dark:bg-[#052E16] border-l-[#22C55E]" :
                  ins.type === "warning" ? "bg-[#FFFBEB] dark:bg-[#2D1C00] border-l-[#EAB308]" :
                  "bg-[#FEF2F2] dark:bg-[#2D0A0A] border-l-[#EF4444]"
                )}>
                  <div className="flex items-center gap-1.5">
                    {ins.type === "positive"
                      ? <CheckCircle2 size={13} className="text-[#22C55E] shrink-0" />
                      : <AlertTriangle size={13} className={cn("shrink-0", ins.type === "warning" ? "text-[#EAB308]" : "text-[#EF4444]")} />}
                    <div className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{ins.title}</div>
                  </div>
                  <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{ins.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* COD + prepaid mini stats */}
          {shop && (
            <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] grid grid-cols-2 gap-2">
              <div className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5 text-center">
                <div className="text-[16px] font-black text-[#F97316]">{shop.kpis.prepaidOrders}</div>
                <div className="text-[10px] text-[#A1A1AA] mt-0.5">Prepaid orders</div>
              </div>
              <div className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5 text-center">
                <div className={cn("text-[16px] font-black", codPct > 50 ? "text-[#EF4444]" : "text-[#EAB308]")}>{shop.kpis.codOrders}</div>
                <div className="text-[10px] text-[#A1A1AA] mt-0.5">COD orders ({codPct}%)</div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Quick Actions" right="Jump to any section" />
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(a => (
              <Link key={a.href} href={a.href}
                className="group flex items-start gap-2 p-2.5 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-[#FAFAF9] dark:bg-[#1C1C1C] hover:border-[#F97316] hover:bg-[#FFF7ED] dark:hover:bg-[#2A1A0E] transition-all">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", a.color)}>
                  <a.icon size={13} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5] group-hover:text-[#EA580C] dark:group-hover:text-[#FB923C] transition-colors leading-tight">{a.label}</div>
                  <div className="text-[10px] text-[#A1A1AA] mt-0.5 leading-tight">{a.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
