"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { attributionPaths, attributionModels } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

const pathNodeColors: Record<string, string> = {
  "Meta Ad": "bg-[#e0f5ee] text-[#064d38]",
  "PDP": "bg-[#e0f5ee] text-[#064d38]",
  "Purchase": "bg-[#17a773] text-white",
  "Buy": "bg-[#17a773] text-white",
  "Organic": "bg-[#e4eef9] text-[#0a3d7a]",
  "Meta Retarget": "bg-[#e0f5ee] text-[#064d38]",
  "Meta": "bg-[#e0f5ee] text-[#064d38]",
  "Abandon": "bg-[#faecd7] text-[#5c3608]",
  "Email": "bg-[#eceafb] text-[#32297a]",
};

export default function AttributionPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Channel Attribution</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Cross-channel customer journey · last-click model</p>
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

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Top customer journey paths" />
          {attributionPaths.map((ap, i) => (
            <div key={i} className="flex items-center gap-1.5 py-2.5 border-b border-black/[0.06] last:border-0 flex-wrap">
              {ap.path.map((node, j) => (
                <div key={j} className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${pathNodeColors[node] || "bg-[#f7f7f5] text-[#181816]"}`}>
                    {node}
                  </span>
                  {j < ap.path.length - 1 && <span className="text-[#9e9e9a] text-xs">→</span>}
                </div>
              ))}
              <span className="ml-auto text-[11px] font-medium text-[#0d6b4f] whitespace-nowrap">
                {ap.orders} orders · {ap.pct}%
              </span>
            </div>
          ))}
          <InsightCard title="Organic assists 34% of all paid conversions" body="In linear attribution, organic gets 39% more credit. Your SEO has a hidden multiplier — drives discovery, Meta drives conversion. Don't cut SEO budget based on last-click data." />
        </Card>

        <Card>
          <CardHeader title="Model comparison" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Channel", "Last-click", "Linear", "Time decay"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributionModels.map((m, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-1.5 px-2">{m.channel}</td>
                    <td className="py-1.5 px-2">{formatINR(m.lastClick)}</td>
                    <td className="py-1.5 px-2 font-medium text-[#0d6b4f]">{formatINR(m.linear)}</td>
                    <td className="py-1.5 px-2">{formatINR(m.timeDecay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightCard type="info" title="Switch to linear model for budget decisions" body="Linear model gives organic 39% more credit, reflecting its true role in your customer journey. Use last-click only for campaign-level optimisation." />
        </Card>
      </div>
    </div>
  );
}
