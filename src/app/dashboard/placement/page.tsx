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
  Messenger: "#0099FF",
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

  if (loading) return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Ads Placement</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Meta placement intelligence · placement breakdown</p>
      </div>
      <div className="text-[15px] text-[#686864] py-16 text-center">Loading placement data…</div>
    </div>
  );

  if (notConnected) return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Ads Placement</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Meta placement intelligence · placement breakdown</p>
      </div>
      <NotConnected
        platform="meta"
        label="Meta Business Suite"
        description="Connect Meta to see which placements (Reels, Feed, Stories, Audience Network) are driving the best ROAS and conversion rates."
      />
    </div>
  );

  if (!data) return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Ads Placement</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Meta placement intelligence · placement breakdown</p>
      </div>
      <div className="text-[15px] text-[#d94040] py-8 text-center">Could not load placement data.</div>
    </div>
  );

  const cur = data.currency === "INR" ? "₹" : data.currency === "USD" ? "$" : data.currency + " ";
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const fmtC = (n: number) => `${cur}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const sorted = [...data.placements].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  // Group summary
  const groups = ["Facebook", "Instagram", "Audience Network", "Messenger"];
  const groupData = groups.map(g => {
    const ps = data.placements.filter(p => p.group === g);
    const spend = ps.reduce((s, p) => s + p.spend, 0);
    const purchases = ps.reduce((s, p) => s + p.purchases, 0);
    const purchaseValue = ps.reduce((s, p) => s + p.purchaseValue, 0);
    const impressions = ps.reduce((s, p) => s + p.impressions, 0);
    return {
      group: g,
      spend: +spend.toFixed(2),
      purchases,
      purchaseValue: +purchaseValue.toFixed(2),
      impressions,
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
          <h2 className="text-lg font-semibold">Ads Placement</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to} · {data.placements.length} placements
          </p>
        </div>
      </div>

      {/* Platform group summary */}
      {groupData.length > 0 && (
        <div className={cn("grid gap-2 mb-3", groupData.length === 4 ? "grid-cols-4" : groupData.length === 3 ? "grid-cols-3" : groupData.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {groupData.map(g => (
            <div key={g.group} className="bg-white border border-black/[0.09] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: groupColors[g.group] ?? "#686864" }} />
                <div className="text-[15px] font-semibold text-[#181816]">{g.group}</div>
                <div className="ml-auto text-[13px] text-[#9e9e9a]">{g.pct}% of spend</div>
              </div>
              <div className="text-[22px] font-bold text-[#181816]">{fmtC(g.spend)}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[14px] text-[#686864]">
                  ROAS: <span className={cn("font-semibold", g.roas >= 3 ? "text-[#0d6b4f]" : g.roas >= 1.5 ? "text-[#181816]" : "text-[#d94040]")}>{g.roas > 0 ? `${g.roas}x` : "—"}</span>
                </span>
                {g.purchases > 0 && <span className="text-[14px] text-[#686864]">{g.purchases} orders</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Spend by placement chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader title="Spend by Placement" right="Top 10" />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${cur}${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 13, border: "1px solid #e8e6e1", borderRadius: 8 }}
                    formatter={(v) => [`${cur}${(v as number).toLocaleString("en-IN")}`, "Spend"]} />
                  <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={groupColors[entry.group] ?? "#9e9e9a"} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}x`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={{ fontSize: 13, border: "1px solid #e8e6e1", borderRadius: 8 }}
                    formatter={(v) => [`${v}x`, "ROAS"]} />
                  <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                    {chartData.filter(c => c.roas > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.roas >= 3 ? "#17a773" : entry.roas >= 1.5 ? "#1877F2" : "#e89820"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Full placement table */}
      <Card>
        <CardHeader title={`All Placements (${data.placements.length})`} right={
          <select value={sortBy} onChange={e => setSortBy(e.target.value as keyof Placement)}
            className="text-[13px] border border-black/[0.09] rounded px-1.5 py-px bg-white">
            <option value="spend">Sort: Spend</option>
            <option value="roas">Sort: ROAS</option>
            <option value="purchases">Sort: Orders</option>
            <option value="impressions">Sort: Impressions</option>
            <option value="clicks">Sort: Clicks</option>
          </select>
        } />
        {data.placements.length === 0 ? (
          <div className="text-[15px] text-[#686864] py-6 text-center">No placement data for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {COLS.map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[13px] font-semibold text-[#686864] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2 font-medium whitespace-nowrap">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                        style={{ background: groupColors[p.group] ?? "#9e9e9a" }} />
                      {p.label}
                    </td>
                    <td className="py-2 px-2 font-semibold whitespace-nowrap">{fmtC(p.spend)}</td>
                    <td className="py-2 px-2 text-[#686864]">
                      {data.totalSpend > 0 ? `${(p.spend / data.totalSpend * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2 px-2">
                      {p.roas > 0 ? (
                        <span className={cn("font-semibold", p.roas >= 3 ? "text-[#0d6b4f]" : p.roas >= 1.5 ? "text-[#181816]" : "text-[#d94040]")}>
                          {p.roas}x
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 px-2">{p.purchases > 0 ? p.purchases : "—"}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{p.purchaseValue > 0 ? fmtC(p.purchaseValue) : "—"}</td>
                    <td className="py-2 px-2">{p.atc > 0 ? p.atc : "—"}</td>
                    <td className="py-2 px-2">{p.lpv > 0 ? fmt(p.lpv) : "—"}</td>
                    <td className="py-2 px-2">
                      {p.lpRatio > 0 ? (
                        <span className={p.lpRatio >= 65 ? "text-[#0d6b4f]" : p.lpRatio >= 45 ? "text-[#e89820]" : "text-[#d94040]"}>
                          {p.lpRatio}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 px-2">{fmt(p.clicks)}</td>
                    <td className="py-2 px-2">
                      <span className={p.ctr >= 1.5 ? "text-[#0d6b4f] font-medium" : p.ctr >= 0.9 ? "" : "text-[#d94040]"}>
                        {p.ctr}%
                      </span>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">{fmtC(p.cpc)}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{fmtC(p.cpm)}</td>
                    <td className="py-2 px-2">{p.reach >= 1000 ? `${(p.reach / 1000).toFixed(1)}K` : fmt(p.reach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 text-[13px] text-[#9e9e9a] bg-[#f7f7f5] rounded-lg p-2.5">
          Green ROAS = above 3x · Blue = above 1.5x · Red = below 1.5x · LP% color: green ≥65%, amber ≥45%, red &lt;45%
        </div>
      </Card>
    </div>
  );
}
