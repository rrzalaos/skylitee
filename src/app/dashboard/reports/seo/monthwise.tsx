"use client";
// Shared month-wise (KPI × month + MoM) logic and table, used by both the on-screen SEO
// report and the printable PDF layout so the two stay identical.
import type { MonthlyMonth, GA4MonthlyMonth } from "./types";

const num = (n: number) => n.toLocaleString("en-IN");
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const dur = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

export interface MwRow {
  key: string;
  display: string[];                                   // formatted value per month
  mom: { pct: number; better: boolean; up: boolean } | null;
  accent?: string;
}

function mom(vals: (number | null)[], lowerBetter: boolean) {
  const clean = vals.filter((v): v is number => v != null);
  if (clean.length < 2) return null;
  const cur = clean[clean.length - 1], prev = clean[clean.length - 2];
  if (prev === 0) return null;
  const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
  return { pct, better: lowerBetter ? pct < 0 : pct > 0, up: pct >= 0 };
}

export function buildRows<T>(months: T[], defs: { key: string; get: (m: T) => number; fmt: (v: number) => string; lower: boolean; accent?: string }[]): MwRow[] {
  return defs.map(d => {
    const vals = months.map(d.get) as (number | null)[];
    return { key: d.key, display: vals.map(v => (v == null ? "—" : d.fmt(v))), mom: mom(vals, d.lower), accent: d.accent };
  });
}
const build = buildRows;

export function buildGscRows(monthly: MonthlyMonth[]): MwRow[] {
  return build(monthly, [
    { key: "Clicks", get: m => m.clicks, fmt: num, lower: false, accent: "#4285F4" },
    { key: "Impressions", get: m => m.impressions, fmt: num, lower: false },
    { key: "CTR", get: m => m.ctr, fmt: v => `${v}%`, lower: false },
    { key: "Avg Position", get: m => m.position, fmt: v => v.toFixed(1), lower: true },
  ]);
}

export function buildGa4Rows(ga4Monthly: GA4MonthlyMonth[]): MwRow[] {
  return build(ga4Monthly, [
    { key: "Sessions", get: m => m.sessions, fmt: num, lower: false, accent: "#F97316" },
    { key: "Users", get: m => m.users, fmt: num, lower: false },
    { key: "New Visitors", get: m => m.newUsers, fmt: num, lower: false },
    { key: "Returning Visitors", get: m => m.returningUsers, fmt: num, lower: false },
    { key: "Avg. Visit Duration", get: m => m.avgDurationSec, fmt: dur, lower: false },
    { key: "Engagement Rate", get: m => m.engagementRate, fmt: v => `${v}%`, lower: false },
    { key: "Bounce Rate", get: m => m.bounceRate, fmt: v => `${v}%`, lower: true },
    { key: "Pageviews", get: m => m.pageviews, fmt: num, lower: false },
    { key: "Organic Search", get: m => m.organic, fmt: num, lower: false, accent: "#22C55E" },
    { key: "Purchasers", get: m => m.purchases, fmt: num, lower: false },
    { key: "Revenue", get: m => m.revenue, fmt: inr, lower: false, accent: "#16A34A" },
    { key: "Conversion Rate", get: m => m.convRate, fmt: v => `${v}%`, lower: false },
  ]);
}

function MoMCell({ m }: { m: MwRow["mom"] }) {
  if (!m) return <span className="text-[#A1A1AA]">—</span>;
  const color = m.pct === 0 ? "#A1A1AA" : m.better ? "#16A34A" : "#DC2626";
  return <span style={{ color }}>{m.up ? "▲" : "▼"} {Math.abs(m.pct)}%</span>;
}

/** KPI × month table with MoM. `print` switches between the dashboard look and the PDF look. */
export function MonthwiseTable({ headers, rows, accent = "#0EA5E9", zebra = "#F0F9FF", print = false }: {
  headers: string[]; rows: MwRow[]; accent?: string; zebra?: string; print?: boolean;
}) {
  const th = print
    ? "py-2 px-2.5 text-[12px] font-bold text-white uppercase tracking-wide"
    : "py-1.5 px-2 text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide";
  const td = print ? "py-2 px-2.5 text-[14px]" : "py-2 px-2 text-[14px]";
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={print ? "" : "border-b border-black/[0.06] dark:border-white/[0.06]"} style={print ? { background: accent } : undefined}>
            <th className={`${th} text-left`}>KPI</th>
            {headers.map(h => <th key={h} className={th} style={{ textAlign: "right" }}>{h}</th>)}
            <th className={th} style={{ textAlign: "right" }}>MoM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr
              key={r.key}
              className={print ? "" : "border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"}
              style={print ? { background: ri % 2 ? zebra : "#fff" } : undefined}
            >
              <td className={`${td} font-bold text-[#18181B] dark:text-[#F4F4F5]`} style={r.accent ? { color: r.accent } : undefined}>{r.key}</td>
              {r.display.map((v, ci) => (
                <td
                  key={ci}
                  className={`${td} text-right tabular-nums ${ci === r.display.length - 1 ? "font-extrabold text-[#18181B] dark:text-[#F4F4F5]" : "text-[#3F3F46] dark:text-[#D4D4D8]"}`}
                >
                  {v}
                </td>
              ))}
              <td className={`${td} text-right font-extrabold`}><MoMCell m={r.mom} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
