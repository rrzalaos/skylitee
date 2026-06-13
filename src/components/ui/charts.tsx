"use client";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

/* Skylitee palette */
export const PALETTE = ["#F97316", "#3B82F6", "#22C55E", "#8B5CF6", "#EC4899", "#EAB308", "#14B8A6"];

/** Tiny trend line for KPI cards. No axes, solid fill (Recharts v3 — avoid <defs>). */
export function Sparkline({ data, color = "#F97316", height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return <div style={{ height }} />;
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={d} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.12} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface DonutSegment { label: string; value: number; color: string }

/** Donut with a center value + a legend. For channel mix, payment split, etc. */
export function Donut({ segments, centerValue, centerLabel, size = 150 }: { segments: DonutSegment[]; centerValue?: string; centerLabel?: string; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const data = total > 0 ? segments.filter(s => s.value > 0) : [{ label: "No data", value: 1, color: "#E5E7EB" }];
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="66%" outerRadius="100%" paddingAngle={total > 0 ? 2 : 0} stroke="none" isAnimationActive={false}>
              {data.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && <div className="text-[18px] font-black text-[#18181B] dark:text-[#F4F4F5] leading-none">{centerValue}</div>}
          {centerLabel && <div className="text-[10px] text-[#A1A1AA] mt-0.5">{centerLabel}</div>}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[#52525B] dark:text-[#A1A1AA] truncate flex-1">{s.label}</span>
            <span className="font-bold text-[#18181B] dark:text-[#F4F4F5] tabular-nums">{total > 0 ? `${Math.round((s.value / total) * 100)}%` : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Half-donut gauge (0–100). For goal pace, scores, progress. */
export function Gauge({ value, color = "#F97316", centerValue, centerLabel, size = 132 }: { value: number; color?: string; centerValue?: string; centerLabel?: string; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const data = [{ name: "v", value: v }, { name: "rest", value: 100 - v }];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size / 2 + 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" startAngle={180} endAngle={0} cx="50%" cy="100%" innerRadius="72%" outerRadius="100%" stroke="none" isAnimationActive={false}>
            <Cell fill={color} />
            <Cell fill="#E5E7EB" className="dark:opacity-20" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <div className="text-[20px] font-black text-[#18181B] dark:text-[#F4F4F5] leading-none">{centerValue ?? `${Math.round(v)}%`}</div>
        {centerLabel && <div className="text-[10px] text-[#A1A1AA] mt-0.5">{centerLabel}</div>}
      </div>
    </div>
  );
}
