"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { NotConnected } from "@/components/ui/not-connected";
import { useDateRange } from "@/lib/date-range-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { cn } from "@/lib/utils";

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

interface PlacementData {
  adAccountName: string;
  currency: string;
  period: { from: string; to: string };
  totalSpend: number;
  placements: Placement[];
}

const groupColors: Record<string, string> = {
  Facebook: "#1877F2",
  Instagram: "#E1306C",
  "Audience Network": "#00B2FF",
  Messenger: "#7C3AED",
};

const COLS = ["Placement", "Spend", "Spend%", "ROAS", "Orders", "Revenue", "ATC", "LP Views", "LP%", "Clicks", "CTR", "CPC", "CPM", "Reach"];

export default function PlacementPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<PlacementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Placement>("spend");

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
      </div>

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
                  ROAS: <span className={cn("font-bold", g.roas >= 3 ? "text-[#F97316]" : g.roas >= 1.5 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>
                    {g.roas > 0 ? `${g.roas}x` : "—"}
                  </span>
                </span>
                {g.purchases > 0 && <span className="text-[12px] text-[#A1A1AA]">{g.purchases} orders</span>}
              </div>
            </div>
          ))}
        </div>
      )}

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
                      <Cell key={i} fill={entry.roas >= 3 ? "#F97316" : entry.roas >= 1.5 ? "#94A3B8" : "#EF4444"} />
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
                        <span className={cn("font-bold", p.roas >= 3 ? "text-[#F97316]" : p.roas >= 1.5 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>
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
                        <span className={cn("font-semibold", p.lpRatio >= 65 ? "text-[#F97316]" : p.lpRatio >= 45 ? "text-[#EAB308]" : "text-[#EF4444]")}>
                          {p.lpRatio}%
                        </span>
                      ) : <span className="text-[#A1A1AA]">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-[#71717A] dark:text-[#A1A1AA]">{fmt(p.clicks)}</td>
                    <td className="py-2.5 px-2">
                      <span className={cn(p.ctr >= 1.5 ? "text-[#F97316] font-semibold" : p.ctr >= 0.9 ? "text-[#71717A] dark:text-[#A1A1AA]" : "text-[#EF4444]")}>
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
          Orange ROAS = above 3× · Gray = above 1.5× · Red = below 1.5× · Orange LP% ≥65% · Amber ≥45% · Red &lt;45%
        </div>
      </Card>
    </div>
  );
}
