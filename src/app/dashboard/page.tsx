"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { BarRow } from "@/components/ui/bar-row";
import { formatINR } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

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
  const [anomalies, setAnomalies] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/shopify/dashboard").then(r => r.json()),
      fetch("/api/shopify/anomalies").then(r => r.json()),
    ]).then(([d, a]) => {
      if (!d.error) setDash(d);
      if (!a.error) setAnomalies(a);
    }).finally(() => setLoading(false));
  }, []);

  const shopName = dash?.shop?.replace(".myshopify.com", "") ?? "";
  const days = dash?.period.days ?? new Date().getDate();
  const projected = anomalies?.summary.projectedMonthly ?? 0;
  const allAlerts = [...(anomalies?.critical ?? []), ...(anomalies?.warnings ?? [])];
  const maxCity = Math.max(...(dash?.topCities.map(c => c.revenue) ?? [1]), 1);
  const codPct = dash ? Math.round((dash.kpis.codOrders / Math.max(dash.kpis.totalOrders, 1)) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#181816]">Command Center</h2>
            {loading ? (
              <span className="text-[11px] text-[#9e9e9a] flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" /> Connecting...
              </span>
            ) : dash ? (
              <span className="flex items-center gap-1 text-[11px] text-[#0d6b4f] bg-[#e0f5ee] px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17a773]" /> Live — {shopName}
              </span>
            ) : (
              <span className="text-[11px] text-[#e89820] bg-[#faecd7] px-2 py-0.5 rounded-full">Not connected</span>
            )}
          </div>
          <p className="text-[12px] text-[#686864] mt-0.5">
            {new Date().toLocaleString("default", { month: "long" })} 1–{days}, {new Date().getFullYear()} · Shopify live data
          </p>
        </div>
        {projected > 0 && (
          <div className="text-[12px] font-semibold text-[#0d6b4f] bg-[#e0f5ee] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <TrendingUp size={13} /> ₹{projected.toLocaleString("en-IN")} projected this month
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-[12px] text-[#686864] py-16 text-center">Loading live store data...</div>
      ) : !dash ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-[#686864] mb-3">Shopify not connected</p>
          <Link href="/dashboard/connections" className="px-4 py-2 bg-[#17a773] text-white rounded-lg text-[12px] font-medium">Connect store →</Link>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            <KPICard label="Gross Sales" value={formatINR(dash.kpis.grossSales)} />
            <KPICard label="Total Orders" value={dash.kpis.totalOrders.toString()} />
            <KPICard label="AOV" value={formatINR(dash.kpis.aov)} />
            <KPICard label="New Customers" value={dash.kpis.newCustomers.toString()} sub={`${dash.kpis.returningCustomers} returning`} />
          </div>

          {/* Row 1: Chart + Forecast */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-2">
              <Card>
                <CardHeader title="Daily revenue" right={`${new Date().toLocaleString("default", { month: "short" })} ${days} days`} />
                <ResponsiveContainer width="100%" height={145}>
                  <BarChart data={dash.dailyRevenue} barSize={12}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9e9e9a" }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => [formatINR(Number(v)), "Revenue"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e5e5" }}
                    />
                    <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                      {dash.dailyRevenue.map((entry, i) => (
                        <Cell key={i} fill={entry.revenue > 0 ? "#17a773" : "#e5e5e5"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card>
              <CardHeader title="Month-end forecast" />
              <div className="bg-[#f7f7f5] rounded-xl p-3 mb-2.5">
                <div className="text-[11px] text-[#686864] mb-1">At current pace ({days} days)</div>
                <div className="text-2xl font-bold text-[#0d6b4f]">{formatINR(projected)}</div>
                <div className="text-[12px] text-[#686864] mt-1">
                  {formatINR(dash.kpis.grossSales)} earned so far
                </div>
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#686864]">Prepaid orders</span>
                  <span className="font-semibold text-[#0d6b4f]">{dash.kpis.prepaidOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#686864]">COD orders</span>
                  <span className={`font-semibold ${codPct > 50 ? "text-[#d94040]" : "text-[#e89820]"}`}>{dash.kpis.codOrders} ({codPct}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#686864]">Returning customers</span>
                  <span className="font-semibold">{dash.kpis.returningCustomers}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Row 2: Top Cities + Alerts */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader title="Top cities by revenue" right="This month" />
              {dash.topCities.length === 0 ? (
                <div className="text-[12px] text-[#686864] py-4 text-center">No shipping address data yet</div>
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
                  ? <span className="text-[11px] text-[#d94040] font-semibold">{allAlerts.length} action needed</span>
                  : <span className="text-[11px] text-[#0d6b4f] font-semibold">All clear</span>
              } />

              {(anomalies?.critical ?? []).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06]">
                  <AlertCircle size={14} className="text-[#d94040] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#181816]">{a.title}</div>
                    <div className="text-[11px] text-[#686864] mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}

              {(anomalies?.warnings ?? []).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06]">
                  <AlertTriangle size={14} className="text-[#e89820] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#181816]">{a.title}</div>
                    <div className="text-[11px] text-[#686864] mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}

              {(anomalies?.positive ?? []).slice(0, 2).map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] last:border-0">
                  <CheckCircle2 size={14} className="text-[#17a773] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[12px] font-semibold text-[#064d38]">{a.title}</div>
                    <div className="text-[11px] text-[#686864] mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}

              {allAlerts.length === 0 && (anomalies?.positive ?? []).length === 0 && (
                <div className="text-[12px] text-[#686864] py-4 text-center">No anomalies detected</div>
              )}

              <Link href="/dashboard/anomaly" className="block mt-2 text-[12px] font-semibold text-[#0a3d7a]">View all alerts →</Link>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
