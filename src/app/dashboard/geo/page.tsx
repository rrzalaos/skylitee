"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { geoData, stateRevenue } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

const signalConfig: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" | "teal" | "purple" }> = {
  scale: { label: "Scale", variant: "green" },
  best_roas: { label: "Best ROAS", variant: "green" },
  high_cod: { label: "High COD", variant: "amber" },
  optimise: { label: "Optimise", variant: "amber" },
  growing: { label: "Growing", variant: "blue" },
  tier2: { label: "Tier-2 opp", variant: "purple" },
};

const maxRev = Math.max(...stateRevenue.map(s => s.pct));

export default function GeoPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Geo Performance</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">City & state level ROAS, AOV and order intelligence</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
            <FileSpreadsheet size={12} /> CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
            <FileText size={12} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Top city" value="Mumbai" sub="68 orders · AOV ₹1,840" />
        <KPICard label="Highest ROAS city" value="Bengaluru" sub="ROAS 1.82 · 52 orders" />
        <KPICard label="Metro revenue share" value="48%" sub="Mumbai + Bengaluru" />
        <KPICard label="Tier-2 opportunity" value="High" changeLabel="Jaipur, Surat growing 34%" change={1} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="City performance" right="Top 10 by revenue" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["City", "Orders", "Revenue", "AOV", "ROAS", "COD%", "Signal"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {geoData.map((g, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-1.5 px-1.5 font-medium">{g.city}</td>
                    <td className="py-2 px-2">{g.orders}</td>
                    <td className="py-2 px-2">{formatINR(g.revenue)}</td>
                    <td className="py-2 px-2">{formatINR(g.aov)}</td>
                    <td className="py-2 px-2">
                      <Badge variant={g.roas >= 1.5 ? "green" : g.roas >= 1.2 ? "amber" : "red"}>{g.roas}</Badge>
                    </td>
                    <td className="py-2 px-2">{g.codPct}%</td>
                    <td className="py-2 px-2">
                      <Badge variant={signalConfig[g.signal]?.variant}>{signalConfig[g.signal]?.label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="Geo AI insights" />
            <InsightCard title="Mumbai + Bengaluru: 48% revenue, premium AOV" body="Create Metro-specific campaigns with same-day delivery badge. These buyers convert better when fulfilment speed is highlighted. Est. +18% CVR." />
            <InsightCard type="teal" title="Bengaluru has best ROAS (1.82) — scale here" body="Low COD ratio (31%) + high AOV (₹1,702) = most profitable city. Allocate 30% more Meta budget to Bengaluru with pincode-level targeting." />
            <InsightCard type="warning" title="Delhi NCR: 62% COD is a return time bomb" body="Delhi has highest COD ratio. Either use COD verification calls or offer ₹100 prepaid discount specifically for Delhi audience." />
            <InsightCard type="purple" title="Jaipur + Surat: Tier-2 growth opportunity" body="34% MoM growth in Tier-2 cities with lower CPMs. Test ₹500/day campaigns in Jaipur, Surat, Indore, Nagpur. Lower competition = cheaper clicks." />
          </Card>

          <Card>
            <CardHeader title="State-level revenue share" />
            {stateRevenue.map((s, i) => (
              <BarRow
                key={i} label={s.state} pct={s.pct} value={`${s.pct}%`}
                color={["green", "blue", "purple", "teal", "amber", "green"][i] as "green" | "blue" | "purple" | "teal" | "amber"}
              />
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
