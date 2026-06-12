"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { NotConnected } from "@/components/ui/not-connected";
import { useDateRange } from "@/lib/date-range-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToPDF } from "@/lib/export";

interface Placement {
  platform: string;
  position: string;
  label: string;
  group: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  purchases: number;
  purchaseValue: number;
  atc: number;
  lpv: number;
  roas: number;
  cac: number;
  lpRatio: number;
}

interface BBucket {
  key: string; label: string; sort: number;
  spend: number; impressions: number; reach: number; clicks: number;
  ctr: number; cpc: number; cpm: number;
  purchases: number; purchaseValue: number; atc: number; lpv: number;
  roas: number; cac: number; lpRatio: number; costPerLpv: number; convRate: number; spendPct: number;
}

interface PlacementData {
  adAccountName: string;
  currency: string;
  period: { from: string; to: string };
  totalSpend: number;
  placements: Placement[];
  breakdowns?: { age: BBucket[]; gender: BBucket[]; device: BBucket[]; hourly: BBucket[] };
}

type PTab = "placement" | "age" | "gender" | "time" | "device";

const groupColors: Record<string, string> = {
  Facebook: "#1877F2",
  Instagram: "#E1306C",
  "Audience Network": "#00B2FF",
  Messenger: "#7C3AED",
};

const COLS = ["Placement", "Spend", "Spend%", "ROAS", "Orders", "Revenue", "ATC", "LP Views", "LP%", "Clicks", "CTR", "CPC", "CPM", "Reach"];

interface PInsight { good: boolean; title: string; body: string; }

// Compare each placement to D2C benchmarks and surface what's working vs what's leaking,
// each with the reason + the action to take.
function buildPlacementInsights(placements: Placement[], totalSpend: number): PInsight[] {
  const out: PInsight[] = [];
  const spending = placements.filter(p => p.spend > 0);
  if (spending.length === 0 || totalSpend <= 0) return out;

  const share = (p: Placement) => (p.spend / totalSpend) * 100;
  const withRoas = spending.filter(p => p.roas > 0);

  // Best placement — highest ROAS, preferring ones with meaningful spend share
  const best = [...withRoas].filter(p => share(p) >= 5).sort((a, b) => b.roas - a.roas)[0]
    ?? [...withRoas].sort((a, b) => b.roas - a.roas)[0];
  if (best && best.roas >= 2) {
    out.push({ good: true, title: `${best.label} is your best placement — ROAS ${best.roas}x`, body: `Best return on spend (${best.roas}× on ${share(best).toFixed(0)}% of budget). This is working — shift more budget here and build more creatives sized for this surface to scale efficiently.` });
  }

  // Budget drain — big spend share but ROAS below the 1.5x line
  const drain = spending.filter(p => share(p) >= 15 && p.roas > 0 && p.roas < 1.5).sort((a, b) => b.spend - a.spend)[0];
  if (drain) {
    out.push({ good: false, title: `${drain.label} is draining budget — ROAS ${drain.roas}x on ${share(drain).toFixed(0)}% of spend`, body: `Below the 1.5x line while eating a big share of budget. Why: weak audience/creative fit for this surface. Cut its budget and move it to ${best ? best.label : "your best placement"}.` });
  }

  // Landing-page leak on a specific surface
  const lpLeak = spending.filter(p => p.lpv > 0 && p.lpRatio > 0 && p.lpRatio < 45).sort((a, b) => b.spend - a.spend)[0];
  if (lpLeak) {
    out.push({ good: false, title: `${lpLeak.label} — landing page rate ${lpLeak.lpRatio}%`, body: `Below the 65% avg: clicks from this surface aren't reaching your site, usually mobile load speed. Test your page speed (<3s) and the link for this placement.` });
  }

  // Strong engagement surface (different from best ROAS one)
  const ctrStar = spending.filter(p => p.ctr >= 1.5 && p.clicks > 0).sort((a, b) => b.ctr - a.ctr)[0];
  if (ctrStar && (!best || ctrStar.label !== best.label)) {
    out.push({ good: true, title: `${ctrStar.label} has strong engagement — CTR ${ctrStar.ctr}%`, body: `Above the 1.5% good mark. Your creative resonates on this surface — keep it running and reuse this creative style on other placements.` });
  }

  return out.slice(0, 5);
}

function barColor(roas: number) { return roas >= 3 ? "#16A34A" : roas >= 1.5 ? "#94A3B8" : roas > 0 ? "#EF4444" : "#FB923C"; }

// Generic breakdown view (Age / Gender / Time / Device) — Spend chart + full metric table.
function BreakdownView({ title, dimLabel, buckets, cur }: { title: string; dimLabel: string; buckets: BBucket[]; cur: string }) {
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const fmtC = (n: number) => `${cur}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  if (!buckets || buckets.length === 0) return (
    <Card><CardHeader title={title} /><div className="text-[13px] text-[#A1A1AA] py-10 text-center">No {dimLabel.toLowerCase()} data from Meta for this period.</div></Card>
  );
  const vertical = buckets.length > 10; // hourly (24 buckets) reads better as columns
  const chartData = buckets.map(b => ({ label: b.label, spend: b.spend, roas: b.roas }));
  const cols = ["Spend", "Spend%", "ROAS", "Orders", "Cost/Order", "Revenue", "Impr", "Reach", "CPM", "CTR", "Clicks", "CPC", "LP Views", "Cost/LPV", "Conv%"];
  return (
    <>
      <Card className="mb-4">
        <CardHeader title={`Spend by ${dimLabel}`} right="Bar colour = ROAS · green ≥3× · red <1.5×" />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {vertical ? (
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#A1A1AA" }} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false} tickFormatter={v => `${cur}${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} formatter={(v) => [`${cur}${(v as number).toLocaleString("en-IN")}`, "Spend"]} />
                <Bar dataKey="spend" radius={[6, 6, 0, 0]}>{chartData.map((e, i) => <Cell key={i} fill={barColor(e.roas)} />)}</Bar>
              </BarChart>
            ) : (
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false} tickFormatter={v => `${cur}${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#71717A" }} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} formatter={(v) => [`${cur}${(v as number).toLocaleString("en-IN")}`, "Spend"]} />
                <Bar dataKey="spend" radius={[0, 6, 6, 0]}>{chartData.map((e, i) => <Cell key={i} fill={barColor(e.roas)} />)}</Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <CardHeader title={title} right={`${buckets.length} ${dimLabel.toLowerCase()} segments`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                <th className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">{dimLabel}</th>
                {cols.map(h => <th key={h} className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
                  <td className="py-2.5 px-2 font-semibold text-[#18181B] dark:text-[#F4F4F5] whitespace-nowrap">{b.label}</td>
                  <td className="py-2.5 px-2 font-semibold whitespace-nowrap">{fmtC(b.spend)}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{b.spendPct}%</td>
                  <td className="py-2.5 px-2">{b.roas > 0 ? <span className={cn("font-bold", b.roas >= 3 ? "text-[#16A34A]" : b.roas >= 1.5 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>{b.roas}x</span> : <span className="text-[#A1A1AA]">—</span>}</td>
                  <td className="py-2.5 px-2 text-[#18181B] dark:text-[#F4F4F5]">{b.purchases > 0 ? b.purchases : <span className="text-[#A1A1AA]">—</span>}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">{b.cac > 0 ? fmtC(b.cac) : <span className="text-[#A1A1AA]">—</span>}</td>
                  <td className="py-2.5 px-2 whitespace-nowrap">{b.purchaseValue > 0 ? fmtC(b.purchaseValue) : <span className="text-[#A1A1AA]">—</span>}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{b.impressions >= 1000 ? `${(b.impressions / 1000).toFixed(1)}K` : b.impressions}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{b.reach >= 1000 ? `${(b.reach / 1000).toFixed(1)}K` : b.reach}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{fmtC(b.cpm)}</td>
                  <td className="py-2.5 px-2"><span className={cn(b.ctr >= 1.5 ? "text-[#16A34A] font-semibold" : b.ctr >= 0.9 ? "text-[#71717A] dark:text-[#A1A1AA]" : "text-[#EF4444]")}>{b.ctr}%</span></td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{fmt(b.clicks)}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{fmtC(b.cpc)}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{b.lpv > 0 ? fmt(b.lpv) : "—"}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{b.costPerLpv > 0 ? fmtC(b.costPerLpv) : "—"}</td>
                  <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{b.convRate > 0 ? `${b.convRate}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export default function PlacementPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<PlacementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Placement>("spend");
  const [tab, setTab] = useState<PTab>("placement");

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/meta/placement?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected" || d.error === "token_expired") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  const header = (
    <div className="mb-3">
      <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Ads Placement</h2>
      <p className="text-[13px] text-[#A1A1AA] mt-0.5">Meta placement intelligence · breakdown by surface</p>
    </div>
  );

  if (loading) return <div>{header}<div className="text-[14px] text-[#A1A1AA] py-16 text-center">Loading placement data…</div></div>;
  if (notConnected) return <div>{header}<NotConnected platform="meta" label="Meta Business Suite" description="Connect Meta to see which placements are driving the best ROAS and conversion rates." /></div>;
  if (!data) return <div>{header}<div className="text-[14px] text-[#EF4444] py-8 text-center">Could not load placement data.</div></div>;

  const cur = data.currency === "INR" ? "₹" : data.currency === "USD" ? "$" : data.currency + " ";
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const fmtC = (n: number) => `${cur}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  function bucketSection(title: string, dimLabel: string, buckets: BBucket[] | undefined) {
    return {
      title,
      headers: [dimLabel, "Spend", "Spend %", "ROAS", "Orders", "Cost/Order", "Revenue", "Impressions", "Reach", "CPM", "CTR", "Clicks", "CPC", "LP Views", "Cost/LPV", "Conv %"],
      rows: (buckets ?? []).map(b => [
        b.label, fmtC(b.spend), `${b.spendPct}%`, b.roas > 0 ? `${b.roas}x` : "—",
        b.purchases, b.cac > 0 ? fmtC(b.cac) : "—", fmtC(b.purchaseValue), fmt(b.impressions), fmt(b.reach),
        fmtC(b.cpm), `${b.ctr}%`, fmt(b.clicks), fmtC(b.cpc), fmt(b.lpv), b.costPerLpv > 0 ? fmtC(b.costPerLpv) : "—", `${b.convRate}%`,
      ]),
    };
  }

  function buildSections() {
    if (!data) return [];
    return [
      {
        title: "Placement Performance",
        headers: ["Placement", "Platform", "Spend", "Spend %", "ROAS", "Orders", "Revenue", "ATC", "LP Views", "LP%", "Clicks", "CTR", "CPC", "CPM", "Reach"],
        rows: data.placements.map(p => [
          p.label, p.group, fmtC(p.spend),
          `${(data.totalSpend > 0 ? p.spend / data.totalSpend * 100 : 0).toFixed(1)}%`,
          p.roas > 0 ? `${p.roas}x` : "—",
          p.purchases, fmtC(p.purchaseValue), p.atc, fmt(p.lpv),
          `${p.lpRatio}%`, fmt(p.clicks), `${p.ctr}%`, fmtC(p.cpc), fmtC(p.cpm), fmt(p.reach),
        ]),
      },
      bucketSection("By Age", "Age", data.breakdowns?.age),
      bucketSection("By Gender", "Gender", data.breakdowns?.gender),
      bucketSection("By Time of Day", "Hour", data.breakdowns?.hourly),
      bucketSection("By Device", "Device", data.breakdowns?.device),
    ];
  }

  function handleExportCSV() { if (data) exportToCSV(`skylitee-placement-${data.period.from}`, buildSections()); }
  async function handleExportPDF() {
    if (!data) return;
    await exportToPDF(
      `skylitee-placement-${data.period.from}`,
      "Ads Placement Report",
      `${data.adAccountName} · ${data.period.from} → ${data.period.to}`,
      buildSections()
    );
  }

  const sorted = [...data.placements].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  const groups = ["Facebook", "Instagram", "Audience Network", "Messenger"];
  const groupData = groups.map(g => {
    const ps = data.placements.filter(p => p.group === g);
    const spend = ps.reduce((s, p) => s + p.spend, 0);
    const purchases = ps.reduce((s, p) => s + p.purchases, 0);
    const purchaseValue = ps.reduce((s, p) => s + p.purchaseValue, 0);
    return {
      group: g,
      spend: +spend.toFixed(2),
      purchases,
      purchaseValue: +purchaseValue.toFixed(2),
      roas: spend > 0 ? +(purchaseValue / spend).toFixed(2) : 0,
      pct: data.totalSpend > 0 ? +(spend / data.totalSpend * 100).toFixed(1) : 0,
    };
  }).filter(g => g.spend > 0);

  const chartData = sorted.slice(0, 10).map(p => ({
    label: p.label.replace("Facebook ", "FB ").replace("Instagram ", "IG "),
    spend: p.spend,
    roas: p.roas,
    group: p.group,
  }));

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Ads Placement</h2>
          <p className="text-[13px] text-[#A1A1AA] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to} · {data.placements.length} placements
          </p>
        </div>
        <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
      </div>

      {/* Breakdown tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-black/[0.06] dark:border-white/[0.06] mb-4">
        {([
          { key: "placement", label: "Placement" },
          { key: "age", label: "Age" },
          { key: "gender", label: "Gender" },
          { key: "time", label: "Time of Day" },
          { key: "device", label: "Device" },
        ] as { key: PTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === t.key ? "border-[#F97316] text-[#F97316]" : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "age" && <BreakdownView title="Performance by Age" dimLabel="Age" buckets={data.breakdowns?.age ?? []} cur={cur} />}
      {tab === "gender" && <BreakdownView title="Performance by Gender" dimLabel="Gender" buckets={data.breakdowns?.gender ?? []} cur={cur} />}
      {tab === "time" && <BreakdownView title="Performance by Time of Day" dimLabel="Hour" buckets={data.breakdowns?.hourly ?? []} cur={cur} />}
      {tab === "device" && <BreakdownView title="Performance by Device" dimLabel="Device" buckets={data.breakdowns?.device ?? []} cur={cur} />}

      {tab === "placement" && (<>
      {/* Platform group summary */}
      {groupData.length > 0 && (
        <div className={cn("grid gap-2.5 mb-4", groupData.length === 4 ? "grid-cols-4" : groupData.length === 3 ? "grid-cols-3" : groupData.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {groupData.map(g => (
            <div key={g.group} className="relative bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 shadow-sm overflow-hidden">
              {/* Platform color accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: groupColors[g.group] ?? "#A1A1AA" }} />
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: groupColors[g.group] ?? "#A1A1AA" }} />
                <div className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{g.group}</div>
                <div className="ml-auto text-[11px] text-[#A1A1AA] font-medium">{g.pct}% of spend</div>
              </div>
              <div className="text-[22px] font-black text-[#18181B] dark:text-[#F4F4F5]">{fmtC(g.spend)}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[12px] text-[#71717A]">
                  ROAS: <span className={cn("font-bold", g.roas >= 3 ? "text-[#16A34A]" : g.roas >= 1.5 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>
                    {g.roas > 0 ? `${g.roas}x` : "—"}
                  </span>
                </span>
                {g.purchases > 0 && <span className="text-[12px] text-[#A1A1AA]">{g.purchases} orders</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* What's working & what's not — across placements */}
      {(() => {
        const ins = buildPlacementInsights(data.placements, data.totalSpend);
        if (ins.length === 0) return null;
        const attention = ins.filter(i => !i.good);
        const working = ins.filter(i => i.good);
        return (
          <Card className="mb-4">
            <CardHeader title="What's Working & What's Not" right="across placements" />
            <div className="space-y-2">
              {attention.map((i, idx) => (
                <div key={`a${idx}`} className="border-l-[3px] border-l-[#EF4444] bg-[#FEF2F2] dark:bg-[#2D0A0A] rounded-r-xl p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <AlertTriangle size={13} className="text-[#EF4444] shrink-0" />
                    <span className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{i.title}</span>
                  </div>
                  <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">{i.body}</div>
                </div>
              ))}
              {working.map((i, idx) => (
                <div key={`w${idx}`} className="border-l-[3px] border-l-[#22C55E] bg-[#F0FDF4] dark:bg-[#052E16] rounded-r-xl p-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 size={13} className="text-[#22C55E] shrink-0" />
                    <span className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{i.title}</span>
                  </div>
                  <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">{i.body}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Spend by placement */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader title="Spend by Placement" right="Top 10" />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.4} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${cur}${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#71717A" }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    formatter={(v) => [`${cur}${(v as number).toLocaleString("en-IN")}`, "Spend"]} />
                  <Bar dataKey="spend" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={groupColors[entry.group] ?? "#A1A1AA"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* ROAS by placement */}
        {chartData.filter(c => c.roas > 0).length > 0 && (
          <Card>
            <CardHeader title="ROAS by Placement" right="Higher = more efficient" />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.filter(c => c.roas > 0)} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.4} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}x`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#71717A" }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    formatter={(v) => [`${v}x`, "ROAS"]} />
                  <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                    {chartData.filter(c => c.roas > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.roas >= 3 ? "#16A34A" : entry.roas >= 1.5 ? "#94A3B8" : "#EF4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Placement table */}
      <Card>
        <CardHeader title={`All Placements (${data.placements.length})`} right={
          <select value={sortBy} onChange={e => setSortBy(e.target.value as keyof Placement)}
            className="text-[12px] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-2 py-1 bg-white dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#F97316]">
            <option value="spend">Sort: Spend</option>
            <option value="roas">Sort: ROAS</option>
            <option value="purchases">Sort: Orders</option>
            <option value="impressions">Sort: Impressions</option>
            <option value="clicks">Sort: Clicks</option>
          </select>
        } />
        {data.placements.length === 0 ? (
          <div className="text-[13px] text-[#A1A1AA] py-6 text-center">No placement data for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                  {COLS.map(h => (
                    <th key={h} className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
                    <td className="py-2.5 px-2 font-semibold text-[#18181B] dark:text-[#F4F4F5] whitespace-nowrap">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                        style={{ background: groupColors[p.group] ?? "#A1A1AA" }} />
                      {p.label}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-[#18181B] dark:text-[#F4F4F5] whitespace-nowrap">{fmtC(p.spend)}</td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">
                      {data.totalSpend > 0 ? `${(p.spend / data.totalSpend * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2.5 px-2">
                      {p.roas > 0 ? (
                        <span className={cn("font-bold", p.roas >= 3 ? "text-[#16A34A]" : p.roas >= 1.5 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>
                          {p.roas}x
                        </span>
                      ) : <span className="text-[#A1A1AA]">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-[#18181B] dark:text-[#F4F4F5]">{p.purchases > 0 ? p.purchases : <span className="text-[#A1A1AA]">—</span>}</td>
                    <td className="py-2.5 px-2 text-[#18181B] dark:text-[#F4F4F5] whitespace-nowrap">{p.purchaseValue > 0 ? fmtC(p.purchaseValue) : <span className="text-[#A1A1AA]">—</span>}</td>
                    <td className="py-2.5 px-2 text-[#18181B] dark:text-[#F4F4F5]">{p.atc > 0 ? p.atc : <span className="text-[#A1A1AA]">—</span>}</td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{p.lpv > 0 ? fmt(p.lpv) : "—"}</td>
                    <td className="py-2.5 px-2">
                      {p.lpRatio > 0 ? (
                        <span className={cn("font-semibold", p.lpRatio >= 65 ? "text-[#16A34A]" : p.lpRatio >= 45 ? "text-[#EAB308]" : "text-[#EF4444]")}>
                          {p.lpRatio}%
                        </span>
                      ) : <span className="text-[#A1A1AA]">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{fmt(p.clicks)}</td>
                    <td className="py-2.5 px-2">
                      <span className={cn(p.ctr >= 1.5 ? "text-[#16A34A] font-semibold" : p.ctr >= 0.9 ? "text-[#71717A] dark:text-[#A1A1AA]" : "text-[#EF4444]")}>
                        {p.ctr}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{fmtC(p.cpc)}</td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{fmtC(p.cpm)}</td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{p.reach >= 1000 ? `${(p.reach / 1000).toFixed(1)}K` : fmt(p.reach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 text-[11px] text-[#A1A1AA] bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5">
          Green ROAS = above 3× · Gray = above 1.5× · Red = below 1.5× · Green LP% ≥65% · Amber ≥45% · Red &lt;45%
        </div>
      </Card>
      </>)}
    </div>
  );
}
