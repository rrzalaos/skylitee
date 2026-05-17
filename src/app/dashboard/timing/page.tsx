"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { heatmapData, heatmapHours, heatmapDays } from "@/lib/mock-data";
import { FileSpreadsheet, FileText } from "lucide-react";

const windows = [
  { window: "Sat–Sun 7–10pm", orders: 4.2, cvr: "3.8%", aov: "₹1,240", rec: "Max budget", rv: "green" as const },
  { window: "Weekdays 8–10pm", orders: 3.6, cvr: "3.2%", aov: "₹1,180", rec: "Scale", rv: "green" as const },
  { window: "Sat–Sun 11am–1pm", orders: 2.8, cvr: "2.9%", aov: "₹1,050", rec: "Maintain", rv: "blue" as const },
  { window: "Weekdays 1–3pm", orders: 1.4, cvr: "1.6%", aov: "₹920", rec: "Reduce", rv: "amber" as const },
  { window: "Daily 12am–6am", orders: 0.2, cvr: "0.4%", aov: "₹810", rec: "Pause ads", rv: "red" as const },
];

function heatmapCellStyle(val: number): React.CSSProperties {
  const opacity = Math.min(val / 4.5, 1);
  return { background: `rgba(23, 167, 115, ${0.08 + opacity * 0.92})`, color: opacity > 0.5 ? "#fff" : "#686864" };
}

export default function TimingPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Time Intelligence</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Best hours & days to run ads · based on your conversion data</p>
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
          <CardHeader title="Hourly order heatmap" right="Orders per hour · darker = more" />
          {/* Day headers */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
            <div />
            {heatmapDays.map(d => (
              <div key={d} className="text-center text-[9px] text-[#9e9e9a] font-medium">{d}</div>
            ))}
          </div>
          {/* Heatmap grid */}
          {heatmapData.map((row, hi) => (
            <div key={hi} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
              <div className="text-[9px] text-[#9e9e9a] flex items-center justify-end pr-1">{heatmapHours[hi]}</div>
              {row.map((val, di) => (
                <div
                  key={di}
                  className="h-7 rounded text-[9px] flex items-center justify-center font-medium"
                  style={heatmapCellStyle(val)}
                >
                  {val.toFixed(1)}
                </div>
              ))}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-[#686864]">
            <div className="flex gap-1">
              {[0.08, 0.3, 0.6, 0.9].map((o, i) => (
                <div key={i} className="w-3 h-2.5 rounded-sm" style={{ background: `rgba(23,167,115,${o})` }} />
              ))}
            </div>
            <span>Low → Peak</span>
          </div>
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="Best performing windows" />
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Time window", "Avg orders/hr", "CVR", "AOV", "Rec."].map(h => (
                      <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2">{w.window}</td>
                      <td className="py-1.5 px-1.5 font-medium">{w.orders}</td>
                      <td className="py-2 px-2">{w.cvr}</td>
                      <td className="py-2 px-2">{w.aov}</td>
                      <td className="py-2 px-2"><Badge variant={w.rv}>{w.rec}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Timing AI insights" />
            <InsightCard title="Weekend evenings are your golden hours" body="Saturday and Sunday 7–10pm drives 4.2× more orders than weekday afternoons. Increase Meta budget by 50% during this window using dayparting in ad schedule settings." />
            <InsightCard type="warning" title="Pause ads 12am–6am — you're burning ₹4,200/month" body="Only 0.4% CVR during midnight–6am vs 3.8% peak. Pausing this window saves ~₹140/day = ₹4,200/month with zero revenue loss." />
            <InsightCard type="info" title="Post new content Thursday 6pm for weekend peak" body="New product drops posted Thursday evening get maximum organic engagement by Saturday peak browsing time. This works for Instagram feed and Reels." />
          </Card>
        </div>
      </div>
    </div>
  );
}
