"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Share2, ArrowRight, Brain, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";
import { useDateRange } from "@/lib/date-range-context";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface MetaKPIs {
  spend: number; roas: number; cac: number; purchases: number; purchaseValue: number;
  impressions: number; reach: number; frequency: number; cpm: number;
  clicks: number; ctr: number; cpc: number; outboundClicks: number; outboundCtr: number;
  lpv: number; lpRatio: number;
  atc: number; atcValue: number; atcRatio: number;
  checkout: number; checkoutValue: number; checkoutRatio: number;
  purchaseRatio: number; conversionRatio: number;
  videoViews3s: number; thruplay: number; thumbStopRatio: number; holdRatio: number;
}

interface MetaData {
  adAccountName: string;
  currency: string;
  period: { from: string; to: string };
  kpis: MetaKPIs;
  campaigns: {
    id: string; name: string; status: string; objective: string;
    spend: number; impressions: number; clicks: number; ctr: number;
    cpc: number; cpm: number; purchases: number; purchaseValue: number; roas: number; atc: number;
  }[];
  daily: { date: string; spend: number; impressions: number; clicks: number; purchases: number; purchaseValue: number }[];
}

type Tab = "overview" | "campaigns";

const statusBadge = (s: string) => {
  if (s === "ACTIVE") return "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]";
  if (s === "PAUSED") return "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]";
  return "bg-[#F5F5F4] text-[#71717A] dark:bg-[#262626] dark:text-[#A1A1AA]";
};

function bench(value: number, avg: number, good: number, higherIsBetter = true): { change: number; changeLabel: string } {
  const isGood = higherIsBetter ? value >= good : value <= good;
  const isAvg = higherIsBetter ? value >= avg : value <= avg;
  const avgLabel = `Avg: ${avg}`;
  if (isGood) return { change: 1, changeLabel: `Above avg · ${avgLabel}` };
  if (isAvg) return { change: 1, changeLabel: `At avg · ${avgLabel}` };
  return { change: -1, changeLabel: `Below avg · ${avgLabel}` };
}

function FunnelStep({ label, count, value, ratio, ratioLabel, cur }: {
  label: string; count: number; value?: number; ratio?: number; ratioLabel?: string; cur: string;
}) {
  return (
    <div className="flex flex-col items-center text-center min-w-0 flex-1">
      <div className="text-[11px] text-[#A1A1AA] font-semibold mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-[20px] font-black text-[#18181B] dark:text-[#F4F4F5]">{count.toLocaleString("en-IN")}</div>
      {value !== undefined && value > 0 && (
        <div className="text-[12px] text-[#EA580C] dark:text-[#FB923C] font-semibold">{cur}{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
      )}
      {ratio !== undefined && (
        <div className={cn("text-[11px] mt-0.5 px-1.5 py-0.5 rounded-full font-bold",
          ratio >= 60 ? "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]"
            : ratio >= 40 ? "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]"
            : "bg-[#FEF2F2] text-[#991B1B] dark:bg-[#2D0A0A] dark:text-[#FCA5A5]"
        )}>{ratio}% {ratioLabel}</div>
      )}
    </div>
  );
}

function AiInsightCard({ text }: { text: string }) {
  const type = text.startsWith("STRENGTH") ? "strength" : text.startsWith("ISSUE") ? "issue" : text.startsWith("OPPORTUNITY") ? "opp" : "risk";
  const styles = {
    strength: { border: "border-l-[#F97316]", bg: "bg-[#FFF7ED] dark:bg-[#2A1A0E]", label: "text-[#EA580C] dark:text-[#FB923C]" },
    issue: { border: "border-l-[#EF4444]", bg: "bg-[#FEF2F2] dark:bg-[#2D0A0A]", label: "text-[#DC2626] dark:text-[#FCA5A5]" },
    opp: { border: "border-l-[#3B82F6]", bg: "bg-[#EFF6FF] dark:bg-[#0D1E3D]", label: "text-[#1E40AF] dark:text-[#93C5FD]" },
    risk: { border: "border-l-[#EAB308]", bg: "bg-[#FFFBEB] dark:bg-[#2D1C00]", label: "text-[#92400E] dark:text-[#FCD34D]" },
  };
  const labels = { strength: "Strength", issue: "Issue", opp: "Opportunity", risk: "Risk" };
  const s = styles[type];
  const body = text.replace(/^(STRENGTH|ISSUE|OPPORTUNITY|RISK):\s*/i, "");
  return (
    <div className={cn("border-l-[3px] rounded-r-xl p-3", s.border, s.bg)}>
      <div className={cn("text-[11px] font-bold uppercase tracking-wider mb-1", s.label)}>{labels[type]}</div>
      <div className="text-[13px] text-[#18181B] dark:text-[#F4F4F5] leading-relaxed">{body}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-[0.12em]">{children}</div>
      <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
    </div>
  );
}

export default function MetaPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setAiInsights([]);
    fetch(`/api/meta?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected" || d.error === "token_expired") { setNotConnected(true); return; }
        if (!d.error) {
          setData(d);
          loadAiInsights(d);
        }
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  function loadAiInsights(d: MetaData) {
    setAiLoading(true);
    fetch("/api/meta/ai-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kpis: d.kpis, currency: d.currency, period: d.period }),
    })
      .then(r => r.json())
      .then(r => {
        if (r.insights) {
          const lines = (r.insights as string)
            .split("\n")
            .map((l: string) => l.trim())
            .filter((l: string) => l.match(/^(STRENGTH|ISSUE|OPPORTUNITY|RISK):/i));
          setAiInsights(lines);
        }
      })
      .finally(() => setAiLoading(false));
  }

  if (loading) return <div className="text-[14px] text-[#A1A1AA] py-16 text-center">Loading Meta Ads data…</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-[#0D1E3D] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE] dark:border-[#1E40AF]">
        <Share2 size={28} className="text-[#1877F2]" />
      </div>
      <h2 className="text-[16px] font-bold mb-1 text-[#18181B] dark:text-[#F4F4F5]">Meta Ads not connected</h2>
      <p className="text-[13px] text-[#71717A] mb-5">Connect to see campaign spend, impressions, clicks and ROAS.</p>
      <Link href="/dashboard/connections" className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[13px] font-semibold hover:bg-[#EA580C] transition-colors">
        Connect Meta Ads →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[14px] text-[#EF4444] py-8 text-center">Could not load Meta Ads data.</div>;

  const k = data.kpis;
  const cur = data.currency === "INR" ? "₹" : data.currency === "USD" ? "$" : data.currency + " ";
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const fmtC = (n: number) => `${cur}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const dailyFmt = data.daily.map(d => ({ ...d, label: d.date.slice(5) }));

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "campaigns", label: `Campaigns (${data.campaigns.length})` },
  ];

  const hasVideo = k.videoViews3s > 0 || k.thruplay > 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Meta Ads</h2>
          <p className="text-[13px] text-[#A1A1AA] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span className="text-[12px] text-[#EA580C] dark:text-[#FB923C] font-semibold bg-[#FFF7ED] dark:bg-[#2A1A0E] px-2.5 py-1 rounded-full">Live</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-black/[0.06] dark:border-white/[0.06] mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-[#F97316] text-[#F97316]"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {/* Core KPIs */}
          <div className="grid grid-cols-5 gap-2.5">
            <KPICard label="Total Spend" value={fmtC(k.spend)} />
            <KPICard label="ROAS" value={`${k.roas}x`} {...bench(k.roas, 2.0, 3.0)} />
            <KPICard label="CAC" value={fmtC(k.cac)} sub="Cost per order" />
            <KPICard label="Total Orders" value={fmt(k.purchases)} />
            <KPICard label="Total Order Value" value={fmtC(k.purchaseValue)} />
          </div>

          {/* Reach & Delivery */}
          <div>
            <SectionLabel>Reach &amp; Delivery</SectionLabel>
            <div className="grid grid-cols-4 gap-2.5">
              <KPICard label="Impressions" value={k.impressions >= 1000 ? `${(k.impressions / 1000).toFixed(1)}K` : fmt(k.impressions)} />
              <KPICard label="Reach" value={k.reach >= 1000 ? `${(k.reach / 1000).toFixed(1)}K` : fmt(k.reach)} />
              <KPICard label="Frequency" value={`${k.frequency}x`}
                {...bench(k.frequency, 3, 1, false)}
                changeLabel={k.frequency <= 3 ? "Healthy range" : k.frequency <= 5 ? "Approaching fatigue" : "Ad fatigue risk"} />
              <KPICard label="CPM" value={fmtC(k.cpm)} sub="Cost per 1,000 views" />
            </div>
          </div>

          {/* Click Performance */}
          <div>
            <SectionLabel>Click Performance</SectionLabel>
            <div className="grid grid-cols-4 gap-2.5">
              <KPICard label="Clicks" value={fmt(k.clicks)} />
              <KPICard label="CTR" value={`${k.ctr}%`} {...bench(k.ctr, 0.9, 1.5)} />
              <KPICard label="CPC" value={fmtC(k.cpc)} />
              <KPICard label="Outbound Clicks" value={fmt(k.outboundClicks)}
                sub={k.outboundCtr > 0 ? `Outbound CTR: ${k.outboundCtr}%` : undefined} />
            </div>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader title="Conversion Funnel" right={<span className="text-[#F97316] font-semibold">CVR: {k.conversionRatio}%</span>} />
            {/* Funnel steps */}
            <div className="flex items-start gap-1 mb-4">
              <FunnelStep label="Outbound Clicks" count={k.outboundClicks} cur={cur} />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.lpRatio >= 65 ? "text-[#EA580C]" : k.lpRatio >= 45 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.lpRatio}%</div>
              </div>
              <FunnelStep label="Landing Page Views" count={k.lpv} cur={cur} ratio={k.lpRatio} ratioLabel="LP Rate" />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.atcRatio >= 12 ? "text-[#EA580C]" : k.atcRatio >= 5 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.atcRatio}%</div>
              </div>
              <FunnelStep label="Add to Cart" count={k.atc} value={k.atcValue} cur={cur} ratio={k.atcRatio} ratioLabel="ATC Rate" />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.checkoutRatio >= 60 ? "text-[#EA580C]" : k.checkoutRatio >= 40 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.checkoutRatio}%</div>
              </div>
              <FunnelStep label="Checkout" count={k.checkout} value={k.checkoutValue} cur={cur} ratio={k.checkoutRatio} ratioLabel="Chk Rate" />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.purchaseRatio >= 50 ? "text-[#EA580C]" : k.purchaseRatio >= 30 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.purchaseRatio}%</div>
              </div>
              <FunnelStep label="Purchase" count={k.purchases} value={k.purchaseValue} cur={cur} ratio={k.purchaseRatio} ratioLabel="Pur Rate" />
            </div>

            {/* Ratio summary bar */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
              {[
                { label: "LP Ratio", value: `${k.lpRatio}%`, avg: "Avg: 65%", good: k.lpRatio >= 65 },
                { label: "ATC Ratio", value: `${k.atcRatio}%`, avg: "Avg: 7%", good: k.atcRatio >= 7 },
                { label: "Checkout Ratio", value: `${k.checkoutRatio}%`, avg: "Avg: 50%", good: k.checkoutRatio >= 50 },
                { label: "Purchase Ratio", value: `${k.purchaseRatio}%`, avg: "Avg: 40%", good: k.purchaseRatio >= 40 },
              ].map(r => (
                <div key={r.label} className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5 text-center">
                  <div className="text-[11px] text-[#A1A1AA] font-medium mb-1">{r.label}</div>
                  <div className={cn("text-[16px] font-black", r.good ? "text-[#F97316]" : "text-[#EF4444]")}>{r.value}</div>
                  <div className="text-[11px] text-[#A1A1AA]">{r.avg}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Video metrics */}
          {hasVideo && (
            <div>
              <SectionLabel>Video Performance</SectionLabel>
              <div className="grid grid-cols-4 gap-2.5">
                <KPICard label="Thumb Stop Ratio" value={`${k.thumbStopRatio}%`}
                  {...bench(k.thumbStopRatio, 25, 30)}
                  changeLabel={k.thumbStopRatio >= 30 ? "Strong hook" : k.thumbStopRatio >= 20 ? "Near avg · Avg: 25%" : "Weak hook · Avg: 25%"} />
                <KPICard label="Hold Ratio" value={`${k.holdRatio}%`}
                  {...bench(k.holdRatio, 15, 20)}
                  changeLabel={k.holdRatio >= 20 ? "Strong retention" : k.holdRatio >= 12 ? "Near avg · Avg: 15%" : "Drop-off risk"} />
                <KPICard label="3-Sec Video Views" value={fmt(k.videoViews3s)} sub="Stopped scrolling" />
                <KPICard label="ThruPlay" value={fmt(k.thruplay)} sub="Watched to end / 15s" />
              </div>
            </div>
          )}

          {/* Daily Performance chart */}
          {dailyFmt.length > 0 && (
            <Card>
              <CardHeader title="Daily Performance" right={`${data.period.from} → ${data.period.to}`} />
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyFmt} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                      formatter={(v, name) => [`${cur}${(v as number) ?? 0}`, name === "spend" ? "Spend" : "Revenue"]} />
                    <Legend formatter={(v) => v === "spend" ? "Spend" : "Revenue"} wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="spend" stroke="#94A3B8" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
                    <Area type="monotone" dataKey="purchaseValue" stroke="#F97316" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* AI Insights */}
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-1.5"><Brain size={14} className="text-[#F97316]" /> AI Analysis vs Benchmarks</span>}
              right={aiLoading ? <Loader2 size={13} className="animate-spin text-[#A1A1AA]" /> : "Claude · D2C benchmarks"}
            />
            {aiLoading ? (
              <div className="text-[13px] text-[#A1A1AA] py-4 text-center">Generating insights…</div>
            ) : aiInsights.length > 0 ? (
              <div className="space-y-2">
                {aiInsights.map((ins, i) => <AiInsightCard key={i} text={ins} />)}
              </div>
            ) : (
              <div className="text-[13px] text-[#A1A1AA] text-center py-4">Could not load AI analysis.</div>
            )}
          </Card>
        </div>
      )}

      {tab === "campaigns" && (
        <Card>
          <CardHeader title={`All Campaigns (${data.campaigns.length})`} right="From Meta Ads Manager" />
          {data.campaigns.length === 0 ? (
            <div className="text-[13px] text-[#A1A1AA] py-6 text-center">No campaign data for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["Campaign", "Status", "Spend", "ROAS", "Orders", "Revenue", "ATC", "Impressions", "Clicks", "CTR", "CPC", "CPM"].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
                      <td className="py-2.5 px-2 max-w-[160px] truncate font-semibold text-[#18181B] dark:text-[#F4F4F5]">{c.name}</td>
                      <td className="py-2.5 px-2">
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-bold", statusBadge(c.status))}>{c.status}</span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold whitespace-nowrap text-[#18181B] dark:text-[#F4F4F5]">{cur}{c.spend.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className={cn("font-bold", c.roas >= 3 ? "text-[#F97316]" : c.roas >= 1 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>
                          {c.roas > 0 ? `${c.roas}x` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-[#18181B] dark:text-[#F4F4F5]">{c.purchases > 0 ? c.purchases : "—"}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap text-[#18181B] dark:text-[#F4F4F5]">{c.purchaseValue > 0 ? `${cur}${c.purchaseValue.toLocaleString("en-IN")}` : "—"}</td>
                      <td className="py-2.5 px-2 text-[#18181B] dark:text-[#F4F4F5]">{c.atc > 0 ? c.atc : "—"}</td>
                      <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{c.impressions.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{c.clicks.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{c.ctr}%</td>
                      <td className="py-2.5 px-2 whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{cur}{c.cpc}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{cur}{c.cpm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-[12px] text-[#A1A1AA] bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5">
            {data.adAccountName} · Live from Meta Ads Manager
          </div>
        </Card>
      )}
    </div>
  );
}
