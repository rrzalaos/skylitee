"use client";
import { useEffect, useState } from "react";
import { useDateRange } from "@/lib/date-range-context";
import { Card, CardHeader } from "@/components/ui/card";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { CheckCircle2, AlertTriangle, XCircle, Search, TrendingUp, MousePointerClick, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GSCData {
  site: string;
  period: { startDate: string; endDate: string };
  kpis: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  keywords: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  devices: { device: string; clicks: number; impressions: number; ctr: number }[];
  countries: { country: string; clicks: number; impressions: number; ctr: number }[];
  daily: { date: string; clicks: number; impressions: number }[];
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\/[^/]+/, "").replace(/^$/, "/") || "/";
}

function SignalCard({ type, metric, value, detail }: { type: "good" | "warn" | "bad"; metric: string; value: string; detail: string }) {
  const styles = {
    good: { bg: "bg-[#F0FDF4] dark:bg-[#052E16]/40", border: "border-[#86EFAC] dark:border-[#166534]", icon: <CheckCircle2 size={15} className="text-[#16A34A]" />, label: "text-[#166534] dark:text-[#4ADE80]" },
    warn: { bg: "bg-[#FFFBEB] dark:bg-[#2D1C00]/40", border: "border-[#FCD34D] dark:border-[#92400E]", icon: <AlertTriangle size={15} className="text-[#D97706]" />, label: "text-[#92400E] dark:text-[#FCD34D]" },
    bad: { bg: "bg-[#FEF2F2] dark:bg-[#2D0A0A]/40", border: "border-[#FCA5A5] dark:border-[#991B1B]", icon: <XCircle size={15} className="text-[#DC2626]" />, label: "text-[#991B1B] dark:text-[#FCA5A5]" },
  }[type];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3", styles.bg, styles.border)}>
      <div className="mt-0.5 shrink-0">{styles.icon}</div>
      <div>
        <div className={cn("text-[12px] font-bold", styles.label)}>{metric}: {value}</div>
        <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{detail}</div>
      </div>
    </div>
  );
}

export default function SEOReportPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const generatedAt = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gsc?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  function buildSections() {
    if (!data) return [];
    return [
      { title: "SEO KPIs", headers: ["Metric", "Value", "Benchmark"], rows: [
        ["Total Clicks", data.kpis.clicks, "—"],
        ["Total Impressions", data.kpis.impressions, "—"],
        ["CTR", `${data.kpis.ctr}%`, "Target: > 2%"],
        ["Avg Position", data.kpis.avgPosition.toFixed(1), "Target: < 10"],
        ["Site", data.site, "—"],
        ["Period", `${data.period.startDate} → ${data.period.endDate}`, "—"],
      ]},
      { title: "Top Keywords", headers: ["Keyword", "Clicks", "Impressions", "CTR", "Position"], rows: data.keywords.map(k => [k.query, k.clicks, k.impressions, `${k.ctr}%`, k.position.toFixed(1)]) },
      { title: "Top Pages", headers: ["Page", "Clicks", "Impressions", "CTR", "Position"], rows: data.pages.map(p => [shortUrl(p.page), p.clicks, p.impressions, `${p.ctr}%`, p.position.toFixed(1)]) },
      { title: "Devices", headers: ["Device", "Clicks", "Impressions", "CTR"], rows: data.devices.map(d => [d.device, d.clicks, d.impressions, `${d.ctr}%`]) },
      { title: "Countries", headers: ["Country", "Clicks", "Impressions", "CTR"], rows: data.countries.map(c => [c.country, c.clicks, c.impressions, `${c.ctr}%`]) },
      { title: "Daily Trend", headers: ["Date", "Clicks", "Impressions"], rows: (data.daily ?? []).map(d => [d.date, d.clicks, d.impressions]) },
    ];
  }

  if (loading) return <div className="text-[14px] text-[#A1A1AA] py-20 text-center">Loading SEO data…</div>;
  if (notConnected) return (
    <div className="text-center py-20">
      <Search size={32} className="text-[#A1A1AA] mx-auto mb-3" />
      <h2 className="text-[16px] font-bold mb-2 dark:text-[#F4F4F5]">Google Search Console not connected</h2>
      <Link href="/api/auth/google?service=gsc" className="px-5 py-2.5 bg-[#4285F4] text-white rounded-xl text-[13px] font-semibold">Connect Search Console →</Link>
    </div>
  );
  if (!data) return <div className="text-[14px] text-[#EF4444] py-8 text-center">Could not load SEO data.</div>;

  const k = data.kpis;
  const ctrGood = k.ctr >= 2;
  const posGood = k.avgPosition <= 10;
  const posWarn = k.avgPosition <= 20;
  const topKeyword = data.keywords[0];
  const top10kws = data.keywords.filter(kw => kw.position <= 10).length;
  const highImpLowClick = data.keywords.filter(kw => kw.impressions > 100 && kw.ctr < 1).length;

  const workingSignals: { metric: string; value: string; detail: string }[] = [];
  const attentionSignals: { metric: string; value: string; detail: string; type: "warn" | "bad" }[] = [];

  if (ctrGood) workingSignals.push({ metric: "CTR", value: `${k.ctr}%`, detail: "Above the 2% benchmark — your titles and meta descriptions are compelling enough to earn clicks from search results." });
  if (posGood) workingSignals.push({ metric: "Avg Position", value: k.avgPosition.toFixed(1), detail: "Top 10 rankings — your content is visible on the first page for most queries." });
  if (top10kws > 0) workingSignals.push({ metric: "Top-10 Keywords", value: `${top10kws} keywords`, detail: `${top10kws} of your tracked keywords rank on page 1 — strong presence for these terms.` });
  if (topKeyword) workingSignals.push({ metric: "Best Keyword", value: `"${topKeyword.query}"`, detail: `${topKeyword.clicks} clicks, position ${topKeyword.position.toFixed(1)} — this query is driving the most organic traffic.` });

  if (!ctrGood) attentionSignals.push({ type: k.ctr < 1 ? "bad" : "warn", metric: "CTR", value: `${k.ctr}%`, detail: "Below the 2% target. Rewrite title tags to include action words and the primary search intent. Add structured data (review stars, product schema) to stand out in results." });
  if (!posWarn) attentionSignals.push({ type: "bad", metric: "Avg Position", value: k.avgPosition.toFixed(1), detail: "Beyond page 2. Focus link-building and on-page optimisation for your top 5 keywords to push them into page 1." });
  else if (!posGood) attentionSignals.push({ type: "warn", metric: "Avg Position", value: k.avgPosition.toFixed(1), detail: "Page 2 territory. Target the keywords closest to position 10 — small improvements can double your clicks." });
  if (highImpLowClick > 0) attentionSignals.push({ type: "warn", metric: "Impression Leakage", value: `${highImpLowClick} keywords`, detail: `${highImpLowClick} keywords get 100+ impressions but under 1% CTR — you're visible but not compelling. Rewrite titles and meta for these terms.` });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-[#4285F4] rounded-lg flex items-center justify-center"><Search size={14} className="text-white" /></div>
            <h1 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">SEO Report</h1>
          </div>
          <p className="text-[12px] text-[#A1A1AA] ml-9">{data.site} · {range.label} · Generated {generatedAt}</p>
        </div>
        <ExportButton
          onExportCSV={() => exportToCSV(`skylitee-seo-report-${range.from}`, buildSections())}
          onExportPDF={() => exportToPDF(`skylitee-seo-report-${range.from}`, "SEO Report", `${data.site} · ${range.label}`, buildSections())}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Clicks", value: k.clicks.toLocaleString("en-IN"), icon: <MousePointerClick size={14} className="text-[#4285F4]" />, good: k.clicks > 0 },
          { label: "Impressions", value: k.impressions.toLocaleString("en-IN"), icon: <Eye size={14} className="text-[#A1A1AA]" />, good: true },
          { label: "CTR", value: `${k.ctr}%`, icon: <TrendingUp size={14} className={ctrGood ? "text-[#22C55E]" : "text-[#EF4444]"} />, good: ctrGood },
          { label: "Avg Position", value: k.avgPosition.toFixed(1), icon: <Search size={14} className={posGood ? "text-[#22C55E]" : "text-[#EAB308]"} />, good: posGood },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">{item.icon}<span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wide">{item.label}</span></div>
            <div className="text-[22px] font-black text-[#18181B] dark:text-[#F4F4F5]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="✅ What's Working" />
          <div className="space-y-2">
            {workingSignals.length === 0 ? <p className="text-[13px] text-[#A1A1AA]">Connect GSC and build traffic first.</p>
              : workingSignals.map((s, i) => <SignalCard key={i} type="good" metric={s.metric} value={s.value} detail={s.detail} />)}
          </div>
        </Card>
        <Card>
          <CardHeader title="⚠️ Needs Attention" />
          <div className="space-y-2">
            {attentionSignals.length === 0 ? <p className="text-[13px] text-[#A1A1AA]">No major issues detected.</p>
              : attentionSignals.map((s, i) => <SignalCard key={i} type={s.type} metric={s.metric} value={s.value} detail={s.detail} />)}
          </div>
        </Card>
      </div>

      {/* Top Keywords */}
      <Card>
        <CardHeader title="Top Keywords" right={`${data.keywords.length} total`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
              {["Keyword", "Clicks", "Impressions", "CTR", "Position"].map(h => <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.keywords.slice(0, 20).map((kw, i) => (
                <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C]">
                  <td className="py-2 px-2 font-medium text-[#18181B] dark:text-[#F4F4F5]">{kw.query}</td>
                  <td className="py-2 px-2 font-bold text-[#4285F4]">{kw.clicks}</td>
                  <td className="py-2 px-2 text-[#A1A1AA]">{kw.impressions.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-2"><span className={cn("font-bold", kw.ctr >= 2 ? "text-[#22C55E]" : kw.ctr >= 1 ? "text-[#EAB308]" : "text-[#EF4444]")}>{kw.ctr}%</span></td>
                  <td className="py-2 px-2"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", kw.position <= 10 ? "bg-[#F0FDF4] text-[#166534] dark:bg-[#052E16] dark:text-[#4ADE80]" : kw.position <= 20 ? "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]" : "bg-[#F5F5F4] text-[#71717A] dark:bg-[#262626]")}>{kw.position.toFixed(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader title="Top Pages" right={`${data.pages.length} pages`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
              {["Page URL", "Clicks", "Impressions", "CTR", "Position"].map(h => <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.pages.slice(0, 15).map((p, i) => (
                <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C]">
                  <td className="py-2 px-2 font-medium text-[#18181B] dark:text-[#F4F4F5] max-w-[260px]"><div className="truncate">{shortUrl(p.page)}</div></td>
                  <td className="py-2 px-2 font-bold text-[#4285F4]">{p.clicks}</td>
                  <td className="py-2 px-2 text-[#A1A1AA]">{p.impressions.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-2 font-semibold">{p.ctr}%</td>
                  <td className="py-2 px-2 text-[#A1A1AA]">{p.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Devices + Countries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="Devices" />
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-black/[0.06] dark:border-white/[0.06]">{["Device", "Clicks", "Impressions", "CTR"].map(h => <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase">{h}</th>)}</tr></thead>
            <tbody>{data.devices.map((d, i) => <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"><td className="py-2 px-2 font-medium capitalize dark:text-[#F4F4F5]">{d.device}</td><td className="py-2 px-2 font-bold text-[#4285F4]">{d.clicks}</td><td className="py-2 px-2 text-[#A1A1AA]">{d.impressions.toLocaleString("en-IN")}</td><td className="py-2 px-2">{d.ctr}%</td></tr>)}</tbody>
          </table>
        </Card>
        <Card>
          <CardHeader title="Top Countries" />
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-black/[0.06] dark:border-white/[0.06]">{["Country", "Clicks", "Impressions", "CTR"].map(h => <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase">{h}</th>)}</tr></thead>
            <tbody>{data.countries.slice(0, 8).map((c, i) => <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"><td className="py-2 px-2 font-medium dark:text-[#F4F4F5]">{c.country}</td><td className="py-2 px-2 font-bold text-[#4285F4]">{c.clicks}</td><td className="py-2 px-2 text-[#A1A1AA]">{c.impressions.toLocaleString("en-IN")}</td><td className="py-2 px-2">{c.ctr}%</td></tr>)}</tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
