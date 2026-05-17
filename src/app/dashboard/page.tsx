"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { BarRow } from "@/components/ui/bar-row";
import { Badge } from "@/components/ui/badge";
import { kpis, dailyRevenue as mockDailyRevenue, funnel, anomalies } from "@/lib/mock-data";
import { formatINR, formatNumber } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ShopifyDashboardData {
  shop: string;
  kpis: {
    grossSales: number; totalOrders: number; aov: number;
    newCustomers: number; returningCustomers: number;
    codOrders: number; prepaidOrders: number;
  };
  dailyRevenue: { day: string; revenue: number }[];
  period: { days: number };
}

export default function CommandCenterPage() {
  const [shopData, setShopData] = useState<ShopifyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (!d.error) setShopData(d); })
      .finally(() => setLoading(false));
  }, []);

  // Use real data when available, fall back to mock
  const grossSales = shopData?.kpis.grossSales ?? kpis.grossSales;
  const totalOrders = shopData?.kpis.totalOrders ?? kpis.totalOrders;
  const aov = shopData?.kpis.aov ?? kpis.aov;
  const newCustomers = shopData?.kpis.newCustomers ?? kpis.newCustomers;
  const chartData = shopData?.dailyRevenue ?? mockDailyRevenue;
  const days = shopData?.period.days ?? 19;
  const shopName = shopData?.shop?.replace(".myshopify.com", "") ?? "fabonique";
  const targetPct = Math.round((grossSales / kpis.revenueTarget) * 100);
  const topAlerts = [...anomalies.critical].slice(0, 3);
  const isLive = !!shopData;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#181816]">Command Center</h2>
            {isLive ? (
              <span className="flex items-center gap-1 text-[11px] text-[#0d6b4f] bg-[#e0f5ee] px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17a773]" /> Live — {shopName}
              </span>
            ) : loading ? (
              <span className="text-[11px] text-[#9e9e9a] flex items-center gap-1">
                <RefreshCw size={11} className="animate-spin" /> Connecting...
              </span>
            ) : (
              <span className="text-[11px] text-[#e89820] bg-[#faecd7] px-2 py-0.5 rounded-full">Demo data</span>
            )}
          </div>
          <p className="text-[12px] text-[#686864] mt-0.5">
            {new Date().toLocaleString("default", { month: "short" })} 1–{days}, {new Date().getFullYear()} · 4 platforms
          </p>
        </div>
        <div className="text-[12px] font-semibold text-[#0d6b4f] bg-[#e0f5ee] px-3 py-1.5 rounded-lg">
          {targetPct}% of monthly target
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-5 gap-2.5 mb-4">
        <KPICard label="Gross Sales" value={formatINR(grossSales)} change={kpis.grossSalesChange} />
        <KPICard label="Blended ROAS" value={kpis.blendedROAS.toString()} changeLabel="↓ Below target" change={-1} />
        <KPICard label="Total Orders" value={formatNumber(totalOrders)} change={kpis.ordersChange} />
        <KPICard label="Ad Spend" value={formatINR(kpis.adSpend)} changeLabel="On track" change={0} />
        <KPICard label="New Customers" value={formatNumber(newCustomers)} change={kpis.newCustomersChange} />
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card>
          <CardHeader title="Revenue by channel" right="This month" />
          <BarRow label="Meta Ads" pct={79} value={formatINR(kpis.metaRevenue)} color="green" />
          <BarRow label="Organic SEO" pct={21} value={formatINR(kpis.organicRevenue)} color="blue" />
          <BarRow label="Direct" pct={4} value={formatINR(kpis.directRevenue)} color="purple" />
          <div className="mt-3 flex items-center justify-between bg-[#fff7ed] border border-[#fed7aa] rounded-lg px-3 py-2">
            <span className="text-[12px] text-[#92400e] font-medium">Google Ads not connected — est. ₹50K/mo missed</span>
            <Link href="/dashboard/connections" className="text-[12px] font-bold text-[#c05621] underline">Fix →</Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Daily revenue" right={`${new Date().toLocaleString("default", { month: "short" })} ${days} days`} />
          <ResponsiveContainer width="100%" height={145}>
            <BarChart data={chartData} barSize={12}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9e9e9a" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [formatINR(Number(v)), "Revenue"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e5e5" }}
              />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.revenue > 18000 ? "#17a773" : "#9FE1CB"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader title="Conversion funnel" />
          {funnel.slice(0, 4).map((f, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-lg mb-1.5 ${i === 3 ? "bg-[#e0f5ee]" : "bg-[#f7f7f5]"}`}>
              <div className={`text-[12px] font-medium ${i === 3 ? "text-[#0d6b4f]" : "text-[#686864]"}`}>{f.stage}</div>
              <div className={`text-[15px] font-bold ${i === 3 ? "text-[#0d6b4f]" : "text-[#181816]"}`}>{formatNumber(f.value)}</div>
            </div>
          ))}
        </Card>

        <Card>
          <CardHeader title="Critical alerts" right={<Badge variant="red">Action needed</Badge>} />
          {topAlerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-black/[0.06] last:border-0">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${a.type === "critical" ? "bg-[#d94040]" : "bg-[#e89820]"}`} />
              <div>
                <div className="text-[13px] text-[#181816] font-medium leading-snug">{a.title}</div>
                <div className="text-[11px] text-[#9e9e9a] mt-0.5">{a.meta}</div>
              </div>
            </div>
          ))}
          <Link href="/dashboard/anomaly" className="block mt-2 text-[12px] font-semibold text-[#0a3d7a]">View all alerts →</Link>
        </Card>

        <Card>
          <CardHeader title="Month-end forecast" />
          <div className="bg-[#f7f7f5] rounded-xl p-3 mb-2.5">
            <div className="text-[11px] text-[#686864] mb-1">At current pace</div>
            <div className="text-2xl font-bold text-[#0d6b4f]">₹4,02,000</div>
            <div className="text-[12px] text-[#d94040] font-medium mt-0.5">₹48K below target</div>
          </div>
          <div className="bg-[#e0f5ee] rounded-xl p-3">
            <div className="text-[11px] text-[#0d6b4f] mb-1 flex items-center gap-1"><TrendingUp size={11} /> With Google Ads</div>
            <div className="text-2xl font-bold text-[#0d6b4f]">₹4,44,000</div>
            <Link href="/dashboard/connections" className="block text-[12px] font-bold text-[#0d6b4f] mt-1 underline">Connect now →</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
