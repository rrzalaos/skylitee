"use client";
import { Gauge, Donut } from "@/components/ui/charts";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CheckCircle2, AlertTriangle, XCircle, Search, MousePointerClick, Eye, Users, IndianRupee, Target, BarChart3, Globe, Activity } from "lucide-react";
import type { GSCData, GA4Data, MonthlyMonth } from "./types";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (n: number) => n.toLocaleString("en-IN");
function shortUrl(url: string) { return url.replace(/^https?:\/\/[^/]+/, "").replace(/^$/, "/") || "/"; }
function normPath(p: string) { let s = (p || "").split("?")[0]; if (s.length > 1) s = s.replace(/\/$/, ""); return s || "/"; }

/* ── building blocks (PDF-tuned: larger fonts, color) ───────────────────── */
function Section({ title, color, icon, right, children, span = 2 }: { title: string; color: string; icon: React.ReactNode; right?: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <div className={`rounded-2xl border border-black/[0.07] bg-white overflow-hidden ${span === 2 ? "col-span-2" : ""}`} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ background: `${color}14` }}>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: color }}>{icon}</span>
          <h2 className="text-[18px] font-extrabold text-[#18181B]">{title}</h2>
        </div>
        {right && <span className="text-[13px] font-semibold text-[#71717A]">{right}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PoleBar({ label, value, pct, color, sub }: { label: string; value: string; pct: number; color: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[15px] font-semibold text-[#27272A]">{label}</span>
        <span className="text-[15px] font-extrabold text-[#18181B] tabular-nums">{value}{sub && <span className="text-[12px] font-medium text-[#A1A1AA] ml-1.5">{sub}</span>}</span>
      </div>
      <div className="h-3.5 rounded-full bg-[#F1F1F0] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
    </div>
  );
}

function Signal({ type, metric, value, detail }: { type: "good" | "warn" | "bad"; metric: string; value: string; detail: string }) {
  const s = {
    good: { bg: "#F0FDF4", bd: "#86EFAC", ic: <CheckCircle2 size={18} className="text-[#16A34A]" />, tx: "#166534" },
    warn: { bg: "#FFFBEB", bd: "#FCD34D", ic: <AlertTriangle size={18} className="text-[#D97706]" />, tx: "#92400E" },
    bad: { bg: "#FEF2F2", bd: "#FCA5A5", ic: <XCircle size={18} className="text-[#DC2626]" />, tx: "#991B1B" },
  }[type];
  return (
    <div className="flex items-start gap-3 rounded-xl border p-3.5" style={{ background: s.bg, borderColor: s.bd }}>
      <div className="mt-0.5 shrink-0">{s.ic}</div>
      <div>
        <div className="text-[15px] font-bold" style={{ color: s.tx }}>{metric}: {value}</div>
        <div className="text-[14px] text-[#52525B] mt-0.5 leading-snug">{detail}</div>
      </div>
    </div>
  );
}

const th = "text-left py-2 px-2.5 text-[12px] font-bold text-white uppercase tracking-wide";
const td = "py-2 px-2.5 text-[14px]";

export function PrintableSEO({ data, ga4, monthly, site, rangeLabel, generatedAt }: {
  data: GSCData; ga4: GA4Data | null; monthly: MonthlyMonth[]; site: string; rangeLabel: string; generatedAt: string;
}) {
  const k = data.kpis;
  const ctrGood = k.ctr >= 2;
  const posGood = k.avgPosition <= 10;
  const posWarn = k.avgPosition <= 20;
  const org = ga4?.organic ?? null;
  const b = data.branded;
  const brandedTotal = b.brandedClicks + b.nonBrandedClicks;
  const impr = k.impressions || 1;

  const topKeyword = data.keywords[0];
  const top10kws = data.keywords.filter(kw => kw.position <= 10).length;
  const highImpLowClick = data.keywords.filter(kw => kw.impressions > 100 && kw.ctr < 1).length;

  const opportunities = data.keywords
    .filter(kw => kw.impressions >= 100 && kw.ctr < 2)
    .map(kw => ({ ...kw, potential: Math.max(0, Math.round(kw.impressions * 0.03) - kw.clicks) }))
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 8);

  const gaMap = new Map((ga4?.organicLandingPages ?? []).map(l => [normPath(l.page), l]));

  const funnel = [
    { label: "Impressions", value: k.impressions, color: "#94A3B8", sub: "" },
    { label: "Clicks", value: k.clicks, color: "#4285F4", sub: `${k.ctr}% CTR` },
    ...(org ? [
      { label: "Organic sessions", value: org.sessions, color: "#F97316", sub: k.clicks > 0 ? `${Math.round((org.sessions / k.clicks) * 100)}% of clicks` : "" },
      { label: "Organic orders", value: org.purchases, color: "#22C55E", sub: org.sessions > 0 ? `${((org.purchases / org.sessions) * 100).toFixed(1)}% CVR` : "" },
    ] : []),
  ];

  const workingSignals: { metric: string; value: string; detail: string }[] = [];
  const attentionSignals: { metric: string; value: string; detail: string; type: "warn" | "bad" }[] = [];
  if (ctrGood) workingSignals.push({ metric: "CTR", value: `${k.ctr}%`, detail: "Above the 2% benchmark — your titles and meta descriptions earn clicks." });
  if (posGood) workingSignals.push({ metric: "Avg Position", value: k.avgPosition.toFixed(1), detail: "Top-10 rankings — on page 1 for most queries." });
  if (top10kws > 0) workingSignals.push({ metric: "Page-1 Keywords", value: `${top10kws} keywords`, detail: `${top10kws} tracked keywords rank on page 1.` });
  if (org && org.revenue > 0) workingSignals.push({ metric: "Organic Revenue", value: inr(org.revenue), detail: `${org.purchases} orders from organic visits, ${inr(org.revenue / Math.max(org.purchases, 1))} avg order.` });
  if (org && org.engagementRate >= 55) workingSignals.push({ metric: "Engagement", value: `${org.engagementRate}%`, detail: "Organic visitors are engaged — pages match search intent." });
  if (topKeyword) workingSignals.push({ metric: "Best Keyword", value: `"${topKeyword.query}"`, detail: `${topKeyword.clicks} clicks at position ${topKeyword.position.toFixed(1)}.` });

  if (!ctrGood) attentionSignals.push({ type: k.ctr < 1 ? "bad" : "warn", metric: "CTR", value: `${k.ctr}%`, detail: "Below the 2% target. Rewrite title tags with intent; add review/product schema." });
  if (!posWarn) attentionSignals.push({ type: "bad", metric: "Avg Position", value: k.avgPosition.toFixed(1), detail: "Beyond page 2. Focus link-building on your top 5 keywords." });
  else if (!posGood) attentionSignals.push({ type: "warn", metric: "Avg Position", value: k.avgPosition.toFixed(1), detail: "Page-2 territory. Push keywords closest to position 10." });
  if (highImpLowClick > 0) attentionSignals.push({ type: "warn", metric: "Impression Leak", value: `${highImpLowClick} keywords`, detail: `${highImpLowClick} keywords get 100+ impressions but under 1% CTR. Rewrite their titles/meta.` });
  if (brandedTotal > 0 && (b.nonBrandedClicks / brandedTotal) < 0.4) attentionSignals.push({ type: "warn", metric: "Brand Dependence", value: `${Math.round((b.brandedClicks / brandedTotal) * 100)}% branded`, detail: "Most clicks are from people already searching your name. Build non-branded content." });
  if (org && org.engagementRate > 0 && org.engagementRate < 45) attentionSignals.push({ type: "warn", metric: "Organic Engagement", value: `${org.engagementRate}%`, detail: "Search visitors leave quickly — align landing pages to query intent." });

  const monthlyChart = monthly.map(m => ({ label: m.label.replace(/ \d{4}$/, ""), Clicks: m.clicks, Impressions: m.impressions }));
  const maxBucket = Math.max(1, ...data.positionBuckets.map(x => x.clicks));
  const maxCountry = Math.max(1, ...data.countries.map(c => c.clicks));
  const ctrGaugeVal = Math.min(100, (k.ctr / 2) * 100);
  const posGaugeVal = Math.max(0, Math.min(100, ((11 - k.avgPosition) / 10) * 100));
  const bucketColors = ["#22C55E", "#84CC16", "#EAB308", "#94A3B8"];

  const kpis = [
    { label: "Total Clicks", value: num(k.clicks), icon: <MousePointerClick size={16} />, color: "#4285F4" },
    { label: "Impressions", value: num(k.impressions), icon: <Eye size={16} />, color: "#64748B" },
    { label: "Organic Sessions", value: org ? num(org.sessions) : "—", icon: <Users size={16} />, color: "#F97316" },
    { label: "Organic Revenue", value: org ? inr(org.revenue) : "—", icon: <IndianRupee size={16} />, color: "#22C55E" },
  ];

  return (
    <div style={{ width: 820, background: "#FFFFFF" }} className="text-[#18181B]">
      <div data-pdf-root className="p-7 space-y-4">
        {/* Hero */}
        <div className="rounded-2xl px-6 py-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#4285F4,#1E5FD0)" }}>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Search size={22} className="text-white" /></span>
            <div>
              <h1 className="text-[25px] font-black text-white leading-tight">SEO Performance Report</h1>
              <p className="text-[14px] text-white/85">{site} · {rangeLabel} · Search Console + Analytics</p>
            </div>
          </div>
          <div className="text-right text-white/85 text-[12px]">Generated<br /><span className="text-[14px] font-semibold text-white">{generatedAt}</span></div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map(it => (
            <div key={it.label} className="rounded-2xl p-4 border border-black/[0.06]" style={{ background: `${it.color}10` }}>
              <div className="flex items-center gap-1.5 mb-2" style={{ color: it.color }}>{it.icon}<span className="text-[12px] font-bold uppercase tracking-wide">{it.label}</span></div>
              <div className="text-[27px] font-black leading-none">{it.value}</div>
            </div>
          ))}
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "Click-through Rate", right: "target 2%", node: <Gauge value={ctrGaugeVal} color={ctrGood ? "#22C55E" : k.ctr >= 1 ? "#EAB308" : "#EF4444"} centerValue={`${k.ctr}%`} centerLabel={ctrGood ? "above target" : "below target"} size={150} /> },
            { title: "Avg Position", right: "page 1 = ≤10", node: <Gauge value={posGaugeVal} color={posGood ? "#22C55E" : posWarn ? "#EAB308" : "#EF4444"} centerValue={k.avgPosition.toFixed(1)} centerLabel={posGood ? "page 1" : posWarn ? "page 2" : "beyond p2"} size={150} /> },
            { title: "Organic Engagement", right: "target 55%", node: org ? <Gauge value={org.engagementRate} color={org.engagementRate >= 55 ? "#22C55E" : org.engagementRate >= 40 ? "#EAB308" : "#EF4444"} centerValue={`${org.engagementRate}%`} centerLabel="engaged" size={150} /> : <div className="text-[13px] text-[#A1A1AA] text-center py-8">Connect GA4</div> },
          ].map(g => (
            <div key={g.title} className="rounded-2xl border border-black/[0.07] bg-white p-4">
              <div className="flex items-center justify-between mb-1"><span className="text-[14px] font-bold text-[#27272A]">{g.title}</span><span className="text-[11px] text-[#A1A1AA]">{g.right}</span></div>
              {g.node}
            </div>
          ))}
        </div>

        {/* Funnel */}
        <Section title="SEO → Revenue Funnel" color="#4285F4" icon={<Search size={16} />} right="Search → Analytics organic">
          <div className="space-y-3.5">
            {funnel.map(f => <PoleBar key={f.label} label={f.label} value={num(f.value)} sub={f.sub} pct={(f.value / impr) * 100} color={f.color} />)}
            {org && (
              <div className="flex items-center justify-between rounded-xl border-2 px-5 py-3.5 mt-1" style={{ borderColor: "#86EFAC", background: "#F0FDF4" }}>
                <span className="text-[16px] font-extrabold text-[#166534]">Organic Revenue</span>
                <span className="text-[21px] font-black text-[#166534]">{inr(org.revenue)} <span className="text-[13px] font-medium text-[#16A34A]">· {inr(org.revenue / Math.max(org.purchases, 1))} AOV</span></span>
              </div>
            )}
          </div>
        </Section>

        {/* Trend + Branded */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="6-Month Trend" color="#8B5CF6" icon={<Activity size={16} />} right="clicks vs impressions" span={1}>
            {monthlyChart.length >= 2 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyChart} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.6} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 13, fill: "#71717A" }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 12, fill: "#A1A1AA" }} tickLine={false} axisLine={false} width={42} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: "#A1A1AA" }} tickLine={false} axisLine={false} width={46} />
                  <Tooltip contentStyle={{ fontSize: 13, borderRadius: 12 }} />
                  <Line yAxisId="l" type="monotone" dataKey="Clicks" stroke="#4285F4" strokeWidth={3} dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="Impressions" stroke="#F97316" strokeWidth={2.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="text-[13px] text-[#A1A1AA] py-14 text-center">Not enough history yet.</div>}
          </Section>
          <Section title="Branded vs Non-branded" color="#EC4899" icon={<Target size={16} />} right={b.brandLabel ? `brand: ${b.brandLabel}` : undefined} span={1}>
            <Donut
              segments={[
                { label: "Non-branded (new demand)", value: b.nonBrandedClicks, color: "#F97316" },
                { label: "Branded (existing demand)", value: b.brandedClicks, color: "#3B82F6" },
              ]}
              centerValue={brandedTotal > 0 ? `${Math.round((b.nonBrandedClicks / brandedTotal) * 100)}%` : "—"}
              centerLabel="non-branded"
              size={150}
            />
            <p className="text-[13px] text-[#71717A] mt-3 leading-snug">Non-branded clicks are <strong>new customers discovering you</strong>; branded clicks are people already searching your name.</p>
          </Section>
        </div>

        {/* Signals */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="What's Working" color="#22C55E" icon={<CheckCircle2 size={16} />} span={1}>
            <div className="space-y-2.5">{workingSignals.map((s, i) => <Signal key={i} type="good" {...s} />)}</div>
          </Section>
          <Section title="Needs Attention" color="#F59E0B" icon={<AlertTriangle size={16} />} span={1}>
            <div className="space-y-2.5">{attentionSignals.length ? attentionSignals.map((s, i) => <Signal key={i} {...s} />) : <p className="text-[14px] text-[#A1A1AA]">No major issues detected.</p>}</div>
          </Section>
        </div>

        {/* Position + Devices */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="Clicks by Ranking Position" color="#14B8A6" icon={<BarChart3 size={16} />} right="where traffic comes from" span={1}>
            <div className="space-y-3.5">
              {data.positionBuckets.map((bk, i) => <PoleBar key={bk.label} label={`Position ${bk.label}`} value={num(bk.clicks)} sub={`${bk.keywords} kw`} pct={(bk.clicks / maxBucket) * 100} color={bucketColors[i] ?? "#94A3B8"} />)}
            </div>
          </Section>
          <Section title="Devices" color="#3B82F6" icon={<Eye size={16} />} span={1}>
            <Donut segments={data.devices.map((d, i) => ({ label: d.device, value: d.clicks, color: ["#3B82F6", "#F97316", "#22C55E", "#8B5CF6"][i] ?? "#94A3B8" }))} centerValue={num(k.clicks)} centerLabel="clicks" size={150} />
          </Section>
        </div>

        {/* CTR Opportunities */}
        {opportunities.length > 0 && (
          <Section title="CTR Opportunities" color="#EAB308" icon={<Target size={16} />} right="high impressions · low CTR">
            <p className="text-[13px] text-[#71717A] mb-3">Keywords where you&apos;re visible but under-clicked. Rewriting titles/meta to a 3% CTR could win the extra clicks shown.</p>
            <table className="w-full">
              <thead><tr style={{ background: "#EAB308" }}>{["Keyword", "Impressions", "CTR", "Position", "Potential +clicks"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {opportunities.map((kw, i) => (
                  <tr key={i} style={{ background: i % 2 ? "#FAFAF9" : "#fff" }}>
                    <td className={`${td} font-semibold`}>{kw.query}</td>
                    <td className={`${td} text-[#71717A]`}>{num(kw.impressions)}</td>
                    <td className={`${td} font-bold text-[#CA8A04]`}>{kw.ctr}%</td>
                    <td className={`${td} text-[#71717A]`}>{kw.position.toFixed(1)}</td>
                    <td className={`${td} font-bold text-[#16A34A]`}>+{kw.potential}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Top Keywords */}
        <Section title="Top Keywords" color="#4285F4" icon={<Search size={16} />} right={`${data.keywords.length} tracked`}>
          <table className="w-full">
            <thead><tr style={{ background: "#4285F4" }}>{["Keyword", "Clicks", "Impressions", "CTR", "Position"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.keywords.slice(0, 18).map((kw, i) => (
                <tr key={i} style={{ background: i % 2 ? "#F8FAFD" : "#fff" }}>
                  <td className={`${td} font-semibold`}>{kw.query}</td>
                  <td className={`${td} font-bold text-[#4285F4]`}>{kw.clicks}</td>
                  <td className={`${td} text-[#71717A]`}>{num(kw.impressions)}</td>
                  <td className={`${td} font-bold`} style={{ color: kw.ctr >= 2 ? "#16A34A" : kw.ctr >= 1 ? "#CA8A04" : "#DC2626" }}>{kw.ctr}%</td>
                  <td className={td}><span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold" style={{ background: kw.position <= 10 ? "#F0FDF4" : kw.position <= 20 ? "#FFFBEB" : "#F5F5F4", color: kw.position <= 10 ? "#166534" : kw.position <= 20 ? "#92400E" : "#71717A" }}>{kw.position.toFixed(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Top Pages + GA4 overlay */}
        <Section title="Top Pages" color="#F97316" icon={<Globe size={16} />} right={ga4?.organicLandingPages?.length ? "Search + Analytics organic" : `${data.pages.length} pages`}>
          <table className="w-full">
            <thead><tr style={{ background: "#F97316" }}>{["Page", "Clicks", "CTR", "Position", "Org. sessions", "Bounce", "Orders"].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.pages.slice(0, 14).map((p, i) => {
                const ga = gaMap.get(normPath(shortUrl(p.page)));
                return (
                  <tr key={i} style={{ background: i % 2 ? "#FFF7ED" : "#fff" }}>
                    <td className={`${td} font-semibold`}><div className="truncate max-w-[300px]">{shortUrl(p.page)}</div></td>
                    <td className={`${td} font-bold text-[#4285F4]`}>{p.clicks}</td>
                    <td className={`${td} font-semibold`}>{p.ctr}%</td>
                    <td className={`${td} text-[#71717A]`}>{p.position.toFixed(1)}</td>
                    <td className={`${td} font-bold text-[#F97316]`}>{ga ? num(ga.sessions) : "—"}</td>
                    <td className={`${td} text-[#71717A]`}>{ga ? `${ga.bounceRate}%` : "—"}</td>
                    <td className={`${td} font-bold text-[#16A34A]`}>{ga && ga.purchases > 0 ? ga.purchases : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

        {/* Countries + Organic snapshot */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="Top Countries" color="#4285F4" icon={<Globe size={16} />} span={1}>
            <div className="space-y-3">
              {data.countries.slice(0, 8).map((c, i) => <PoleBar key={i} label={c.country} value={num(c.clicks)} sub={`${c.ctr}% CTR`} pct={(c.clicks / maxCountry) * 100} color="#4285F4" />)}
            </div>
          </Section>
          <Section title="Organic Snapshot" color="#22C55E" icon={<Activity size={16} />} right="Analytics" span={1}>
            {org ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Organic users", value: num(org.users), color: "#F97316" },
                  { label: "Avg session", value: `${Math.floor(org.avgSessionSec / 60)}m ${org.avgSessionSec % 60}s`, color: "#3B82F6" },
                  { label: "Engagement", value: `${org.engagementRate}%`, color: org.engagementRate >= 55 ? "#16A34A" : "#CA8A04" },
                  { label: "Bounce rate", value: `${org.bounceRate}%`, color: "#8B5CF6" },
                  { label: "Organic orders", value: num(org.purchases), color: "#16A34A" },
                  { label: "Conv. rate", value: org.sessions > 0 ? `${((org.purchases / org.sessions) * 100).toFixed(2)}%` : "—", color: "#EC4899" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-[#FAFAF9] p-3.5">
                    <div className="text-[13px] text-[#A1A1AA] mb-1">{s.label}</div>
                    <div className="text-[21px] font-black" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-[14px] text-[#A1A1AA] text-center py-10">Connect Google Analytics to see what organic visitors do after they click.</div>}
          </Section>
        </div>

        <p className="text-[12px] text-[#A1A1AA] text-center pt-1">Search Console reflects Google Search (≈3-day lag, Pacific Time). Analytics organic = Organic Search channel only. Branded split inferred from the &quot;{b.brandLabel}&quot; domain term.</p>
      </div>
    </div>
  );
}
