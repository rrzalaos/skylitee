"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Share2, ArrowRight, Brain, Loader2 } from "lucide-react";
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
  if (s === "ACTIVE") return "bg-[#e0f5ee] text-[#064d38]";
  if (s === "PAUSED") return "bg-[#faecd7] text-[#5c3608]";
  return "bg-[#f7f7f5] text-[#686864]";
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
      <div className="text-[13px] text-[#9e9e9a] font-medium mb-1">{label}</div>
      <div className="text-[22px] font-bold text-[#181816]">{count.toLocaleString("en-IN")}</div>
      {value !== undefined && value > 0 && (
        <div className="text-[13px] text-[#0d6b4f] font-medium">{cur}{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
      )}
      {ratio !== undefined && (
        <div className={cn("text-[12px] mt-0.5 px-1.5 py-px rounded-full font-semibold",
          ratio >= 60 ? "bg-[#e0f5ee] text-[#064d38]" : ratio >= 40 ? "bg-[#faecd7] text-[#5c3608]" : "bg-[#fde8e8] text-[#6b1a1a]"
        )}>{ratio}% {ratioLabel}</div>
      )}
    </div>
  );
}

function InsightCard({ text }: { text: string }) {
  const type = text.startsWith("STRENGTH") ? "strength" : text.startsWith("ISSUE") ? "issue" : text.startsWith("OPPORTUNITY") ? "opp" : "risk";
  const colors = {
    strength: "border-l-[#17a773] bg-[#f0faf5]",
    issue: "border-l-[#d94040] bg-[#fef2f2]",
    opp: "border-l-[#1877F2] bg-[#f0f5ff]",
    risk: "border-l-[#e89820] bg-[#fffbf0]",
  };
  const labels = { strength: "Strength", issue: "Issue", opp: "Opportunity", risk: "Risk" };
  const labelColors = { strength: "text-[#0d6b4f]", issue: "text-[#d94040]", opp: "text-[#1877F2]", risk: "text-[#e89820]" };
  const body = text.replace(/^(STRENGTH|ISSUE|OPPORTUNITY|RISK):\s*/i, "");
  return (
    <div className={cn("border-l-2 rounded-r-lg p-3", colors[type])}>
      <div className={cn("text-[12px] font-bold uppercase tracking-wider mb-1", labelColors[type])}>{labels[type]}</div>
      <div className="text-[14px] text-[#181816] leading-relaxed">{body}</div>
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
          <h2 className="text-lg font-semibold">Meta Ads</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-black/[0.09] mb-3">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-3 py-1.5 text-[14px] font-medium border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-[#1877F2] text-[#1877F2]" : "border-transparent text-[#686864] hover:text-[#181816]"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          {/* Row 1: Core */}
          <div className="grid grid-cols-5 gap-2">
            <KPICard label="Total Spend" value={fmtC(k.spend)} />
            <KPICard label="ROAS" value={`${k.roas}x`}
              {...bench(k.roas, 2.0, 3.0)} />
            <KPICard label="CAC" value={fmtC(k.cac)} sub="Cost per order" />
            <KPICard label="Total Orders" value={fmt(k.purchases)} />
            <KPICard label="Total Order Value" value={fmtC(k.purchaseValue)} />
          </div>

          {/* Row 2: Reach & Delivery */}
          <div>
            <div className="text-[13px] font-semibold text-[#9e9e9a] uppercase tracking-widest mb-1.5">Reach & Delivery</div>
            <div className="grid grid-cols-4 gap-2">
              <KPICard label="Impressions" value={k.impressions >= 1000 ? `${(k.impressions / 1000).toFixed(1)}K` : fmt(k.impressions)} />
              <KPICard label="Reach" value={k.reach >= 1000 ? `${(k.reach / 1000).toFixed(1)}K` : fmt(k.reach)} />
              <KPICard label="Frequency" value={`${k.frequency}x`}
                {...bench(k.frequency, 3, 1, false)}
                changeLabel={k.frequency <= 3 ? "Healthy range" : k.frequency <= 5 ? "Approaching fatigue" : "Ad fatigue risk"} />
              <KPICard label="CPM" value={fmtC(k.cpm)} sub={`Cost per 1,000 views`} />
            </div>
          </div>

          {/* Row 3: Engagement */}
          <div>
            <div className="text-[13px] font-semibold text-[#9e9e9a] uppercase tracking-widest mb-1.5">Click Performance</div>
            <div className="grid grid-cols-4 gap-2">
              <KPICard label="Clicks" value={fmt(k.clicks)} />
              <KPICard label="CTR" value={`${k.ctr}%`}
                {...bench(k.ctr, 0.9, 1.5)} />
              <KPICard label="CPC" value={fmtC(k.cpc)} />
              <KPICard label="Outbound Clicks" value={fmt(k.outboundClicks)}
                sub={k.outboundCtr > 0 ? `Outbound CTR: ${k.outboundCtr}%` : undefined} />
            </div>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader title="Conversion Funnel" right={`CVR: ${k.conversionRatio}% (purchases/clicks)`} />
            <div className="flex items-start gap-1">
              <FunnelStep label="Outbound Clicks" count={k.outboundClicks} cur={cur} />
              <div className="flex flex-col items-center justify-center mt-6 shrink-0">
                <ArrowRight size={14} className="text-[#9e9e9a]" />
                <div className={cn("text-[11px] font-semibold mt-0.5",
                  k.lpRatio >= 65 ? "text-[#0d6b4f]" : k.lpRatio >= 45 ? "text-[#e89820]" : "text-[#d94040]"
                )}>{k.lpRatio}%</div>
              </div>
              <FunnelStep label="Landing Page Views" count={k.lpv} cur={cur} ratio={k.lpRatio} ratioLabel="LP Rate" />
              <div className="flex flex-col items-center justify-center mt-6 shrink-0">
                <ArrowRight size={14} className="text-[#9e9e9a]" />
                <div className={cn("text-[11px] font-semibold mt-0.5",
                  k.atcRatio >= 12 ? "text-[#0d6b4f]" : k.atcRatio >= 5 ? "text-[#e89820]" : "text-[#d94040]"
                )}>{k.atcRatio}%</div>
              </div>
              <FunnelStep label="Add to Cart" count={k.atc} value={k.atcValue} cur={cur} ratio={k.atcRatio} ratioLabel="ATC Rate" />
              <div className="flex flex-col items-center justify-center mt-6 shrink-0">
                <ArrowRight size={14} className="text-[#9e9e9a]" />
                <div className={cn("text-[11px] font-semibold mt-0.5",
                  k.checkoutRatio >= 60 ? "text-[#0d6b4f]" : k.checkoutRatio >= 40 ? "text-[#e89820]" : "text-[#d94040]"
                )}>{k.checkoutRatio}%</div>
              </div>
              <FunnelStep label="Checkout" count={k.checkout} value={k.checkoutValue} cur={cur} ratio={k.checkoutRatio} ratioLabel="Chk Rate" />
              <div className="flex flex-col items-center justify-center mt-6 shrink-0">
                <ArrowRight size={14} className="text-[#9e9e9a]" />
                <div className={cn("text-[11px] font-semibold mt-0.5",
                  k.purchaseRatio >= 50 ? "text-[#0d6b4f]" : k.purchaseRatio >= 30 ? "text-[#e89820]" : "text-[#d94040]"
                )}>{k.purchaseRatio}%</div>
              </div>
              <FunnelStep label="Purchase" count={k.purchases} value={k.purchaseValue} cur={cur} ratio={k.purchaseRatio} ratioLabel="Pur Rate" />
            </div>
            <div className="mt-3 pt-2 border-t border-black/[0.06] grid grid-cols-4 gap-2 text-center">
              {[
                { label: "LP Ratio", value: `${k.lpRatio}%`, avg: "Avg: 65%", good: k.lpRatio >= 65 },
                { label: "ATC Ratio", value: `${k.atcRatio}%`, avg: "Avg: 7%", good: k.atcRatio >= 7 },
                { label: "Checkout Ratio", value: `${k.checkoutRatio}%`, avg: "Avg: 50%", good: k.checkoutRatio >= 50 },
                { label: "Purchase Ratio", value: `${k.purchaseRatio}%`, avg: "Avg: 40%", good: k.purchaseRatio >= 40 },
              ].map(r => (
                <div key={r.label} className="bg-[#f7f7f5] rounded-lg p-2">
                  <div className="text-[13px] text-[#9e9e9a]">{r.label}</div>
                  <div className={cn("text-[16px] font-bold", r.good ? "text-[#0d6b4f]" : "text-[#d94040]")}>{r.value}</div>
                  <div className="text-[12px] text-[#9e9e9a]">{r.avg}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Video metrics */}
          {hasVideo && (
            <div>
              <div className="text-[13px] font-semibold text-[#9e9e9a] uppercase tracking-widest mb-1.5">Video Performance</div>
              <div className="grid grid-cols-4 gap-2">
                <KPICard label="Thumb Stop Ratio" value={`${k.thumbStopRatio}%`}
                  {...bench(k.thumbStopRatio, 25, 30)}
                  changeLabel={k.thumbStopRatio >= 30 ? "Strong creative hook" : k.thumbStopRatio >= 20 ? "Near avg · Avg: 25%" : "Weak hook · Avg: 25%"} />
                <KPICard label="Hold Ratio" value={`${k.holdRatio}%`}
                  {...bench(k.holdRatio, 15, 20)}
                  changeLabel={k.holdRatio >= 20 ? "Strong retention" : k.holdRatio >= 12 ? "Near avg · Avg: 15%" : "Drop-off risk · Avg: 15%"} />
                <KPICard label="3-Sec Video Views" value={fmt(k.videoViews3s)} sub="People who stopped scrolling" />
                <KPICard label="ThruPlay" value={fmt(k.thruplay)} sub="Watched 15s or to end" />
              </div>
            </div>
          )}

          {/* Daily chart */}
          {dailyFmt.length > 0 && (
            <Card>
              <CardHeader title="Daily Performance" right={`${data.period.from} → ${data.period.to}`} />
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyFmt} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#17a773" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#17a773" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 13, border: "1px solid #e8e6e1", borderRadius: 8 }}
                      formatter={(v, name) => [
                        `${cur}${(v as number) ?? 0}`,
                        name === "spend" ? "Spend" : "Revenue"
                      ]} />
                    <Legend formatter={(v) => v === "spend" ? "Spend" : "Revenue"} wrapperStyle={{ fontSize: 13 }} />
                    <Area type="monotone" dataKey="spend" stroke="#1877F2" strokeWidth={2} fill="url(#spendG)" dot={false} />
                    <Area type="monotone" dataKey="purchaseValue" stroke="#17a773" strokeWidth={2} fill="url(#revG)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* AI Insights */}
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-1.5"><Brain size={14} className="text-[#1877F2]" /> AI Analysis vs Industry Benchmarks</span>}
              right={aiLoading ? <Loader2 size={13} className="animate-spin text-[#9e9e9a]" /> : "Claude · D2C benchmarks"}
            />
            {aiLoading ? (
              <div className="text-[14px] text-[#9e9e9a] py-4 text-center">Generating insights…</div>
            ) : aiInsights.length > 0 ? (
              <div className="space-y-2">
                {aiInsights.map((ins, i) => <InsightCard key={i} text={ins} />)}
              </div>
            ) : (
              <div className="text-[14px] text-[#9e9e9a] text-center py-4">Could not load AI analysis.</div>
            )}
          </Card>
        </div>
      )}

      {tab === "campaigns" && (
        <Card>
          <CardHeader title={`All Campaigns (${data.campaigns.length})`} right="From Meta Ads Manager" />
          {data.campaigns.length === 0 ? (
            <div className="text-[15px] text-[#686864] py-6 text-center">No campaign data for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Campaign", "Status", "Spend", "ROAS", "Orders", "Revenue", "ATC", "Impressions", "Clicks", "CTR", "CPC", "CPM"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 max-w-[160px] truncate font-medium">{c.name}</td>
                      <td className="py-2 px-2">
                        <span className={cn("text-[13px] px-2 py-0.5 rounded-full font-medium", statusBadge(c.status))}>{c.status}</span>
                      </td>
                      <td className="py-2 px-2 font-semibold whitespace-nowrap">{cur}{c.spend.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className={cn("font-semibold", c.roas >= 3 ? "text-[#0d6b4f]" : c.roas >= 1 ? "text-[#181816]" : "text-[#d94040]")}>
                          {c.roas > 0 ? `${c.roas}x` : "—"}
                        </span>
                      </td>
                      <td className="py-2 px-2">{c.purchases > 0 ? c.purchases : "—"}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{c.purchaseValue > 0 ? `${cur}${c.purchaseValue.toLocaleString("en-IN")}` : "—"}</td>
                      <td className="py-2 px-2">{c.atc > 0 ? c.atc : "—"}</td>
                      <td className="py-2 px-2">{c.impressions.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2">{c.clicks.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2">{c.ctr}%</td>
                      <td className="py-2 px-2 whitespace-nowrap">{cur}{c.cpc}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{cur}{c.cpm}</td>
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
