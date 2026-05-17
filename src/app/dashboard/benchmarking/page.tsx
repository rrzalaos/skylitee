"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { benchmarks } from "@/lib/mock-data";
import { FileText } from "lucide-react";

const rankConfig: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" }> = {
  top20: { label: "Top 20%", variant: "green" },
  top30: { label: "Top 30%", variant: "green" },
  aboveavg: { label: "Above avg", variant: "blue" },
  mid40: { label: "Mid 40%", variant: "amber" },
  belowavg: { label: "Below avg", variant: "red" },
  bottom30: { label: "Bottom 30%", variant: "red" },
  bottom40: { label: "Bottom 40%", variant: "red" },
};

const roadmap = [
  { action: "Fix mobile checkout UX (sticky ATC, speed)", effort: "Med", impact: "ROAS +0.2, CAC −15%", priority: "P1", pV: "red" as const },
  { action: "Connect Google Ads", effort: "Med", impact: "+₹40–60K/month", priority: "P1", pV: "red" as const },
  { action: "Launch prepaid incentive ₹75", effort: "Low", impact: "Returns −₹5K/mo", priority: "P1", pV: "red" as const },
  { action: "3-email cart abandon sequence", effort: "Med", impact: "+32 orders recovered", priority: "P2", pV: "amber" as const },
  { action: "Champions VIP program", effort: "Low", impact: "+₹18–25K/month", priority: "P2", pV: "amber" as const },
  { action: "8 SEO blog posts (ethnic wear)", effort: "High", impact: "Organic +30% in 90d", priority: "P3", pV: "blue" as const },
];

export default function BenchmarkingPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Competitor Benchmarking</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Your store vs Indian ethnic D2C category averages</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
          <FileText size={12} /> PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Key metric comparison" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Metric", "Your store", "Category avg", "Top 10%", "Your rank"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2">{b.metric}</td>
                    <td className="py-1.5 px-1.5 font-medium">{b.yours}</td>
                    <td className="py-1.5 px-1.5 text-[#686864]">{b.avg}</td>
                    <td className="py-1.5 px-1.5 text-[#686864]">{b.top10}</td>
                    <td className="py-2 px-2">
                      <Badge variant={rankConfig[b.rank]?.variant}>{rankConfig[b.rank]?.label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="90-day improvement roadmap" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Action", "Effort", "Expected impact", "P"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roadmap.map((r, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-1.5 px-1.5 text-[10px]">{r.action}</td>
                    <td className="py-2 px-2">
                      <Badge variant={r.effort === "Low" ? "green" : r.effort === "Med" ? "amber" : "red"}>{r.effort}</Badge>
                    </td>
                    <td className="py-1.5 px-1.5 text-[10px]">{r.impact}</td>
                    <td className="py-2 px-2"><Badge variant={r.pV}>{r.priority}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
