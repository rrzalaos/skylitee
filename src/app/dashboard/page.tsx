"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { BarRow } from "@/components/ui/bar-row";
import { formatINR } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useDateRange, getComparisonRange } from "@/lib/date-range-context";

interface DashData {
  shop: string;
  kpis: { grossSales: number; totalOrders: number; aov: number; newCustomers: number; returningCustomers: number; codOrders: number; prepaidOrders: number; };
  dailyRevenue: { day: string; revenue: number }[];
  topCities: { city: string; revenue: number }[];
  period: { days: number };
}

interface AnomalyData {
  critical: { title: string; desc: string }[];
  warnings: { title: string; desc: string }[];
  positive: { title: string; desc: string }[];
  summary: { projectedMonthly: number; grossSales: number; totalOrders: number };
}

export default function CommandCenterPage() {
  const [dash, setDash] = useState<DashData | null>(null);
  const [compDash, setCompDash] = useState<DashData | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { range, compareWith } = useDateRange();

  useEffect(() => {
    setLoading(true);
    setCompDash(null);
    const compRange = getComparisonRange(range, compareWith);
    const reqs = [
      fetch(`/api/shopify/dashboard?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch("/api/shopify/anomalies").then(r => r.json()),
      compRange
        ? fetch(`/api/shopify/dashboard?from=${compRange.from}&to=${compRange.to}`).then(r => r.json())
        : Promise.resolve(null),
    ];
    Promise.all(reqs).then(([d, a, comp]) => {
      if (d && !d.error) setDash(d);
      if (a && !a.error) setAnomalies(a);
      if (comp && !comp.error) setCompDash(comp);
    }).finally(() => setLoading(false));
  }, [range.from, range.to, compareWith]);

  function pctChange(curr: number, prev: number): number | undefined {
    if (!prev || !compDash) return undefined;
    return +((curr - prev) / prev * 100).toFixed(1);
  }

  const shopName = dash?.shop?.replace(".myshopify.com", "") ?? "";
  const days = dash?.period.days ?? new Date().getDate();
  const projected = anomalies?.summary.projectedMonthly ?? 0;
  const allAlerts = [...(anomalies?.critical ?? []), ...(anomalies?.warnings ?? [])];
  const maxCity = Math.max(...(dash?.topCities.map(c => c.revenue) ?? [1]), 1);
  const codPct = dash ? Math.round((dash.kpis.codOrders / Math.max(dash.kpis.totalOrders, 1)) * 100) : 0;

  const compLabel = getComparisonRange(range, compareWith)?.label ?? "prev period";
  const salesChange = dash && compDash ? pctChange(dash.kpis.grossSales, compDash.kpis.grossSales) : undefined;
  const ordersChange = dash && compDash ? pctChange(dash.kpis.totalOrders, compDash.kpis.totalOrders) : undefined;
  const aovChange = dash && compDash ? pctChange(dash.kpis.aov, compDash.kpis.aov) : undefined;
  const customersChange = dash && compDash ? pctChange(dash.kpis.newCustomers, compDash.kpis.newCustomers) : undefined;

  function deltaLabel(val: number | undefined): string | undefined {
    if (val === undefined) return undefined;
    return `${val >= 0 ? "+" : ""}${val}% vs ${compLabel}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#18181B] dark:text-[#F4F4F5]">Command Center</h2>
            {loading ? (
              <span className="text-[13px] text-[#A1A1AA] flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" /> Connecting...
              </span>
            ) : dash ? (
              <span className="flex items-center gap-1 text-[13px] text-[#EA580C] dark:text-[#FB923C] bg-[#FFF7ED] dark:bg-[#2A1A0E] px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" /> Live — {shopName}
              </span>
            ) : (
              <span className="text-[13px] text-[#92400E] bg-[#FFFBEB] px-2 py-0.5 rounded-full font-medium">Not connected</span>
            )}
          </div>
          <p className="text-[13px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
            {range.label} · Shopify live data
          </p>
        </div>
        {projected > 0 && (
          <div className="text-[13px] font-semibold text-[#EA580C] dark:text-[#FB923C] bg-[#FFF7ED] dark:bg-[#2A1A0E] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <TrendingUp size={13} /> ₹{projected.toLocaleString("en-IN")} projected this month
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading live store data...</div>
      ) : !dash ? (
        <div className="text-center py-16">
          <p className="text-[14px] text-[#71717A] dark:text-[#A1A1AA] mb-3">Shopify not connected</p>
          <Link href="/dashboard/connections" className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-[13px] font-semibold hover:bg-[#EA580C] transition-colors">Connect store →</Link>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            <KPICard label="Gross Sales" value={formatINR(dash.kpis.grossSales)} change={salesChange} changeLabel={deltaLabel(salesChange)} />
            <KPICard label="Total Orders" value={dash.kpis.totalOrders.toString()} change={ordersChange} changeLabel={deltaLabel(ordersChange)} />
            <KPICard label="AOV" value={formatINR(dash.kpis.aov)} change={aovChange} changeLabel={deltaLabel(aovChange)} />
            <KPICard label="New Customers" value={dash.kpis.newCustomers.toString()} sub={`${dash.kpis.returningCustomers} returning`} change={customersChange} changeLabel={deltaLabel(customersChange)} />
          </div>

          {/* Row 1: Chart + Forecast */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-2">
              <Card>
                <CardHeader title="Daily revenue" right={`${range.label} · ${days} days`} />
                <ResponsiveContainer width="100%" height={145}>
                  <BarChart data={dash.dailyRevenue} barSize={12}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9e9e9a" }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => [formatINR(Number(v)), "Revenue"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e5e5" }}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {dash.dailyRevenue.map((entry, i) => (
                        <Cell key={i} fill={entry.revenue > 0 ? "#F97316" : "#E5E5E5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card>
              <CardHeader title="Period forecast" />
              <div className="bg-[#FFF7ED] dark:bg-[#2A1A0E] rounded-xl p-3 mb-2.5 border border-[#FED7AA] dark:border-[#7C2D12]">
                <div className="text-[12px] text-[#EA580C] dark:text-[#FB923C] mb-1 font-medium">At current pace ({days} days)</div>
                <div className="text-2xl font-bold text-[#EA580C] dark:text-[#FB923C]">{formatINR(projected)}</div>
                <div className="text-[13px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
                  {formatINR(dash.kpis.grossSales)} earned so far
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Prepaid orders</span>
                  <span className="font-semibold text-[#F97316]">{dash.kpis.prepaidOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">COD orders</span>
                  <span className={`font-semibold ${codPct > 50 ? "text-[#EF4444]" : "text-[#EAB308]"}`}>{dash.kpis.codOrders} ({codPct}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A] dark:text-[#A1A1AA]">Returning customers</span>
                  <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">{dash.kpis.returningCustomers}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Row 2: Top Cities + Alerts */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader title="Top cities by revenue" right="This month" />
              {dash.topCities.length === 0 ? (
                <div className="text-[15px] text-[#686864] py-4 text-center">No shipping address data yet</div>
              ) : (
                dash.topCities.map((c, i) => (
                  <BarRow
                    key={i} label={c.city}
                    pct={Math.round((c.revenue / maxCity) * 100)}
                    value={formatINR(c.revenue)}
                    color={["green", "blue", "amber", "purple", "teal"][i % 5] as "green" | "blue" | "amber" | "purple" | "teal"}
                  />
                ))
              )}
            </Card>

            <Card>
              <CardHeader title="Alerts & signals" right={
                allAlerts.length > 0
                  ? <span className="text-[12px] text-[#EF4444] font-semibold">{allAlerts.length} action needed</span>
                  : <span className="text-[12px] text-[#22C55E] font-semibold">All clear</span>
              } />

              {(anomalies?.critical ?? []).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <AlertCircle size={13} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">{a.title}</div>
                    <div className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}

              {(anomalies?.warnings ?? []).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <AlertTriangle size={13} className="text-[#EAB308] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">{a.title}</div>
                    <div className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}

              {(anomalies?.positive ?? []).slice(0, 2).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0">
                  <CheckCircle2 size={13} className="text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">{a.title}</div>
                    <div className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}

              {allAlerts.length === 0 && (anomalies?.positive ?? []).length === 0 && (
                <div className="text-[13px] text-[#A1A1AA] py-4 text-center">No anomalies detected</div>
              )}

              <Link href="/dashboard/anomaly" className="block mt-2 text-[13px] font-semibold text-[#F97316]">View all alerts →</Link>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
