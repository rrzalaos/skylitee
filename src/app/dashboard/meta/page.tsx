"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Share2 } from "lucide-react";
import Link from "next/link";
import { useDateRange } from "@/lib/date-range-context";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface MetaData {
  adAccountName: string;
  currency: string;
  period: { from: string; to: string };
  kpis: {
    spend: number; impressions: number; clicks: number; ctr: number;
    cpc: number; cpm: number; reach: number; frequency: number; purchases: number;
  };
  campaigns: {
    id: string; name: string; status: string; objective: string;
    spend: number; impressions: number; clicks: number; ctr: number; cpc: number; cpm: number;
  }[];
  daily: { date: string; spend: number; impressions: number; clicks: number }[];
}

type Tab = "overview" | "campaigns";

const statusBadge = (s: string) => {
  if (s === "ACTIVE") return "bg-[#e0f5ee] text-[#064d38]";
  if (s === "PAUSED") return "bg-[#faecd7] text-[#5c3608]";
  return "bg-[#f7f7f5] text-[#686864]";
};

export default function MetaPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/meta?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected" || d.error === "token_expired") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  if (loading) return <div className="text-[15px] text-[#686864] py-16 text-center">Loading Meta Ads data…</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <Share2 size={32} className="text-[#9e9e9a] mx-auto mb-3" />
      <h2 className="text-[18px] font-semibold mb-1">Meta Ads not connected</h2>
      <p className="text-[15px] text-[#686864] mb-4">Connect to see campaign spend, impressions, clicks and ROAS.</p>
      <Link href="/dashboard/connections" className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-[15px] font-medium hover:bg-[#1565c0] transition-colors">
        Go to Connections →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[15px] text-[#d94040] py-8 text-center">Could not load Meta Ads data.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "campaigns", label: `Campaigns (${data.campaigns.length})` },
  ];

  const cur = data.currency === "INR" ? "₹" : data.currency === "USD" ? "$" : data.currency + " ";
  const dailyFormatted = data.daily.map(d => ({ ...d, label: d.date.slice(5) }));

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Meta Ads</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
        <KPICard label="Total Spend" value={`${cur}${data.kpis.spend.toLocaleString("en-IN")}`} />
        <KPICard label="Impressions" value={data.kpis.impressions >= 1000 ? `${(data.kpis.impressions / 1000).toFixed(1)}K` : data.kpis.impressions.toString()} />
        <KPICard label="Clicks" value={data.kpis.clicks.toLocaleString("en-IN")} />
        <KPICard label="CTR" value={`${data.kpis.ctr}%`} change={data.kpis.ctr >= 1 ? 1 : -1} changeLabel={data.kpis.ctr >= 1 ? "Above avg" : "Below 1% avg"} />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="CPC" value={`${cur}${data.kpis.cpc}`} />
        <KPICard label="CPM" value={`${cur}${data.kpis.cpm}`} />
        <KPICard label="Reach" value={data.kpis.reach >= 1000 ? `${(data.kpis.reach / 1000).toFixed(1)}K` : data.kpis.reach.toString()} />
        <KPICard label="Frequency" value={`${data.kpis.frequency}x`} change={data.kpis.frequency <= 3 ? 1 : -1} changeLabel={data.kpis.frequency <= 3 ? "Healthy" : "Ad fatigue risk"} />
      </div>

      <div className="flex gap-0 border-b border-black/[0.09] mb-3">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1.5 text-[14px] font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-[#1877F2] text-[#1877F2]"
                : "border-transparent text-[#686864] hover:text-[#181816]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          {dailyFormatted.length > 0 && (
            <Card>
              <CardHeader title="Daily spend" right={`${data.period.from} → ${data.period.to}`} />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyFormatted} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1877F2" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 13, border: "1px solid #e8e6e1", borderRadius: 8 }}
                      formatter={(v: number) => [`${cur}${v}`, "Spend"]} />
                    <Area type="monotone" dataKey="spend" stroke="#1877F2" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Top campaigns" right="By spend · see Campaigns tab for full list" />
            {data.campaigns.length === 0 ? (
              <div className="text-[15px] text-[#686864] py-6 text-center">No campaign data for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.09]">
                      {["Campaign", "Status", "Spend", "Impressions", "Clicks", "CTR", "CPC"].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.slice(0, 5).map((c, i) => (
                      <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                        <td className="py-2 px-2 max-w-[200px] truncate font-medium">{c.name}</td>
                        <td className="py-2 px-2">
                          <span className={cn("text-[13px] px-2 py-0.5 rounded-full font-medium", statusBadge(c.status))}>{c.status}</span>
                        </td>
                        <td className="py-2 px-2 font-semibold">{cur}{c.spend.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-2">{c.impressions.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-2">{c.clicks.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-2">{c.ctr}%</td>
                        <td className="py-2 px-2">{cur}{c.cpc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "campaigns" && (
        <Card>
          <CardHeader title={`All campaigns (${data.campaigns.length})`} right="From Meta Ads Manager" />
          {data.campaigns.length === 0 ? (
            <div className="text-[15px] text-[#686864] py-6 text-center">No campaign data for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Campaign", "Status", "Objective", "Spend", "Impressions", "Clicks", "CTR", "CPC", "CPM"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 max-w-[180px] truncate font-medium">{c.name}</td>
                      <td className="py-2 px-2">
                        <span className={cn("text-[13px] px-2 py-0.5 rounded-full font-medium", statusBadge(c.status))}>{c.status}</span>
                      </td>
                      <td className="py-2 px-2 text-[14px] text-[#686864] capitalize">{c.objective.toLowerCase().replace(/_/g, " ")}</td>
                      <td className="py-2 px-2 font-semibold">{cur}{c.spend.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2">{c.impressions.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2">{c.clicks.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2">{c.ctr}%</td>
                      <td className="py-2 px-2">{cur}{c.cpc}</td>
                      <td className="py-2 px-2">{cur}{c.cpm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-[13px] text-[#9e9e9a] bg-[#f7f7f5] rounded-lg p-2.5">
            Data from Meta Ads Manager · {data.adAccountName}
          </div>
        </Card>
      )}
    </div>
  );
}
