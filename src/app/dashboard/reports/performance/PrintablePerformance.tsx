"use client";
import { Donut, Gauge } from "@/components/ui/charts";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, ShoppingCart, Share2, Megaphone, Target, Trophy, Layers, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { MonthwiseTable } from "../seo/monthwise";
import { perfMonthRows, type PerfModel } from "./model";

const inr = formatINR;

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

function PoleBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[15px] font-semibold text-[#27272A]">{label}</span>
        <span className="text-[15px] font-extrabold text-[#18181B] tabular-nums">{value}</span>
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

const th = "py-2 px-2.5 text-[12px] font-bold text-white uppercase tracking-wide";
const td = "py-2 px-2.5 text-[14px]";

export function PrintablePerformance({ model, site, rangeLabel, generatedAt }: { model: PerfModel; site: string; rangeLabel: string; generatedAt: string }) {
  const M = model;
  return (
    <div style={{ width: 820, background: "#FFFFFF" }} className="text-[#18181B]">
      <div data-pdf-root className="p-7 space-y-4">
        {/* Hero */}
        <div className="rounded-2xl px-6 py-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#F97316,#EA580C)" }}>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp size={22} className="text-white" /></span>
            <div>
              <h1 className="text-[25px] font-black text-white leading-tight">Performance Marketing Report</h1>
              <p className="text-[14px] text-white/85">{site} · {rangeLabel} · Shopify + Meta{M.googleSpend > 0 ? " + Google" : ""}</p>
            </div>
          </div>
          <div className="text-right text-white/85 text-[13px]">Generated<br /><span className="text-[14px] font-semibold text-white">{generatedAt}</span></div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-3">
          {M.hero.map(it => (
            <div key={it.label} className="rounded-2xl p-4 border border-black/[0.06]" style={{ background: `${it.accent}10` }}>
              <div className="text-[13px] font-bold uppercase tracking-wide mb-1" style={{ color: it.accent }}>{it.label}</div>
              <div className="text-[26px] font-black leading-none">{it.value}</div>
              {it.sub && <div className="text-[12px] text-[#A1A1AA] mt-1">{it.sub}</div>}
            </div>
          ))}
        </div>

        {/* Objective KPIs */}
        {M.objectives.length > 0 && (
          <Section title="KPIs by Ad Objective" color="#8B5CF6" icon={<Target size={16} />} right="what each objective is buying">
            <div className="grid grid-cols-2 gap-3">
              {M.objectives.map(o => (
                <div key={o.key} className="rounded-xl border border-black/[0.06] p-3.5" style={{ background: `${o.color}0D` }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-2 text-[15px] font-extrabold" style={{ color: o.color }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: o.color }} />{o.label}</span>
                    <span className="text-[12px] text-[#71717A]">{inr(o.spend)} · {o.spendPct}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {o.cards.map(c => (
                      <div key={c.label} className="rounded-lg bg-white/70 px-3 py-2">
                        <div className="text-[12px] text-[#A1A1AA]">{c.label}</div>
                        <div className="text-[18px] font-black text-[#18181B]">{c.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Revenue mix + Payment split */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="Revenue Mix" color="#3B82F6" icon={<Share2 size={16} />} right="store sales by source" span={1}>
            <Donut segments={M.revenueMix} centerValue={inr(M.revenueMix.reduce((s, x) => s + x.value, 0))} centerLabel="total" size={150} />
          </Section>
          <Section title="Payment Split" color="#F97316" icon={<ShoppingCart size={16} />} span={1}>
            <Donut
              segments={[{ label: "Prepaid", value: M.payment.prepaid, color: "#F97316" }, { label: "COD", value: M.payment.cod, color: "#EAB308" }]}
              centerValue={`${100 - M.payment.codPct}%`} centerLabel="prepaid" size={150}
            />
            {M.payment.codPct > 50 && <p className="text-[13px] text-[#92400E] mt-2">High COD ({M.payment.codPct}%) — offer a prepaid discount to cut RTO risk.</p>}
          </Section>
        </div>

        {/* Blended ROAS gauge + Meta funnel */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="Blended ROAS" color="#22C55E" icon={<TrendingUp size={16} />} right="store ÷ total ad spend" span={1}>
            <Gauge value={Math.min(100, (M.blendedRoas / 3) * 100)} color={M.blendedRoas >= 2 ? "#22C55E" : M.blendedRoas >= 1 ? "#EAB308" : "#EF4444"} centerValue={M.blendedRoas ? `${M.blendedRoas}x` : "—"} centerLabel={M.blendedRoas >= 2 ? "profitable" : "below target"} size={150} />
            <p className="text-[13px] text-[#71717A] text-center mt-1">Total spend {inr(M.totalSpend)}{M.googlePending ? " · Google pending" : ""}</p>
          </Section>
          {M.funnel ? (
            <Section title="Meta Funnel" color="#6366F1" icon={<Megaphone size={16} />} right="clicks → purchase" span={1}>
              <div className="space-y-2.5">
                {M.funnel.map(f => <PoleBar key={f.label} label={f.label} value={f.value.toLocaleString("en-IN")} pct={f.pct} color={f.color} />)}
              </div>
            </Section>
          ) : <div />}
        </div>

        {/* Channel attribution */}
        <Section title="Channel Attribution" color="#0EA5E9" icon={<Layers size={16} />} right="orders & revenue by source">
          <table className="w-full">
            <thead><tr style={{ background: "#0EA5E9" }}>{["Channel", "Orders", "Revenue", "Ad Spend", "ROAS", "CTR"].map((h, i) => <th key={h} className={th} style={i ? { textAlign: "right" } : undefined}>{h}</th>)}</tr></thead>
            <tbody>
              {M.channels.map((c, i) => (
                <tr key={c.channel} style={{ background: i % 2 ? "#F0F9FF" : "#fff" }}>
                  <td className={`${td} font-bold`}><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />{c.channel}</span></td>
                  <td className={`${td} text-right`}>{c.orders.toLocaleString("en-IN")}</td>
                  <td className={`${td} text-right font-semibold`}>{inr(c.revenue)}</td>
                  <td className={`${td} text-right text-[#71717A]`}>{c.spend == null ? "—" : inr(c.spend)}</td>
                  <td className={`${td} text-right font-bold`} style={{ color: c.roas == null ? "#A1A1AA" : c.roas >= 2 ? "#16A34A" : "#DC2626" }}>{c.roas == null ? "—" : `${c.roas}x`}</td>
                  <td className={`${td} text-right text-[#71717A]`}>{c.ctr == null ? "—" : `${c.ctr}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Placement winners */}
        {M.winners.length > 0 && (
          <Section title="What's Winning in Ads" color="#16A34A" icon={<Trophy size={16} />} right="best-performing segments">
            <div className="grid grid-cols-3 gap-3">
              {M.winners.map(w => (
                <div key={w.title} className="rounded-xl border border-[#86EFAC] bg-[#F0FDF4] p-3.5">
                  <div className="text-[13px] font-bold text-[#16A34A] uppercase tracking-wide mb-1">{w.icon} {w.title}</div>
                  <div className="text-[17px] font-black text-[#166534]">{w.value}</div>
                  <div className="text-[13px] text-[#15803D] mt-0.5">{w.detail}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Campaign performance */}
        {M.campaigns.length > 0 && (
          <Section title="Campaign Performance" color="#EA580C" icon={<Megaphone size={16} />} right={`${M.campaigns.length} campaigns`}>
            <table className="w-full">
              <thead><tr style={{ background: "#EA580C" }}>{["Campaign", "Objective", "Status", "Spend", "ROAS", "Orders"].map((h, i) => <th key={h} className={th} style={i >= 3 ? { textAlign: "right" } : undefined}>{h}</th>)}</tr></thead>
              <tbody>
                {M.campaigns.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 ? "#FFF7ED" : "#fff" }}>
                    <td className={`${td} font-semibold`}><div className="truncate max-w-[260px]">{c.name}</div></td>
                    <td className={`${td} text-[#71717A]`}>{c.objective}</td>
                    <td className={td}><span className="px-2 py-0.5 rounded-full text-[12px] font-bold" style={{ background: c.status === "ACTIVE" ? "#FFF7ED" : "#F5F5F4", color: c.status === "ACTIVE" ? "#EA580C" : "#71717A" }}>{c.status}</span></td>
                    <td className={`${td} text-right font-semibold`}>{inr(c.spend)}</td>
                    <td className={`${td} text-right font-black`} style={{ color: c.roas >= 2 ? "#16A34A" : c.roas >= 1 ? "#CA8A04" : "#DC2626" }}>{c.roas}x</td>
                    <td className={`${td} text-right`}>{c.purchases || c.leads || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* 3-month comparison */}
        {M.months.length >= 2 && (
          <Section title="Last 3 Months — Progress" color="#0EA5E9" icon={<TrendingUp size={16} />} right="vs previous month">
            <MonthwiseTable headers={M.months.map(m => m.label)} rows={perfMonthRows(M.months)} accent="#0EA5E9" zebra="#F0F9FF" print />
          </Section>
        )}

        {/* Working / Attention */}
        <div className="grid grid-cols-2 gap-3">
          <Section title="What's Working" color="#22C55E" icon={<CheckCircle2 size={16} />} span={1}>
            <div className="space-y-2.5">{M.working.length ? M.working.map((s, i) => <Signal key={i} {...s} />) : <p className="text-[14px] text-[#A1A1AA]">Connect Meta Ads for signals.</p>}</div>
          </Section>
          <Section title="Needs Improvement" color="#F59E0B" icon={<AlertTriangle size={16} />} span={1}>
            <div className="space-y-2.5">{M.attention.length ? M.attention.map((s, i) => <Signal key={i} {...s} />) : <p className="text-[14px] text-[#A1A1AA]">No major issues detected.</p>}</div>
          </Section>
        </div>

        {/* Conclusion */}
        <Section title="Conclusion" color="#7C3AED" icon={<Sparkles size={16} />} right="the bottom line">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[15px] font-extrabold text-[#16A34A] mb-2">✅ Working &amp; positive</div>
              <ul className="space-y-1.5">{M.conclusion.positives.map((p, i) => <li key={i} className="text-[14px] text-[#3F3F46] leading-snug">• {p}</li>)}</ul>
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-[#DC2626] mb-2">⚠ To improve</div>
              <ul className="space-y-1.5">{M.conclusion.improvements.length ? M.conclusion.improvements.map((p, i) => <li key={i} className="text-[14px] text-[#3F3F46] leading-snug">• {p}</li>) : <li className="text-[14px] text-[#A1A1AA]">Nothing critical — keep scaling what works.</li>}</ul>
            </div>
          </div>
        </Section>

        <p className="text-[12px] text-[#A1A1AA] text-center pt-1">Blended ROAS = store revenue ÷ total ad spend. Organic = orders without ad attribution. Generated by Skylitee.</p>
      </div>
    </div>
  );
}
