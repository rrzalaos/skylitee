"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { BarRow } from "@/components/ui/bar-row";
import { cohortData } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

function retentionColor(val: number | null): string {
  if (val === null) return "bg-[#f7f7f5] text-[#9e9e9a]";
  if (val === 100) return "bg-[#e0f5ee] font-semibold text-[#181816]";
  if (val >= 28) return "bg-[#9FE1CB] text-[#181816]";
  if (val >= 18) return "bg-[#C8EEE2] text-[#181816]";
  if (val >= 12) return "bg-[#D8F2EC] text-[#181816]";
  if (val >= 9) return "bg-[#E0F5EE] text-[#181816]";
  return "bg-[#EBF8F3] text-[#181816]";
}

const cohortRevenue = [
  { month: "Jun 2025", revenue: 83420, pct: 100 },
  { month: "Jul 2025", revenue: 73400, pct: 88 },
  { month: "Apr 2025", revenue: 60100, pct: 72 },
  { month: "May 2025", revenue: 54200, pct: 65 },
  { month: "Mar 2025", revenue: 41700, pct: 50 },
];

export default function CohortPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Cohort Analysis</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Customer retention curves by acquisition month</p>
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

      <Card className="mb-2">
        <CardHeader title="Retention cohort matrix" right="% retained by month after first purchase" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-black/[0.09]">
                {["Cohort", "Customers", "Month 0", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5"].map(h => (
                  <th key={h} className="text-left py-1.5 px-2 text-[11px] font-semibold text-[#686864]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.map((row, i) => (
                <tr key={i} className="border-b border-black/[0.06] last:border-0">
                  <td className="py-1.5 px-2 font-medium">{row.month}</td>
                  <td className="py-1.5 px-2">{row.customers}</td>
                  {row.retention.map((val, j) => (
                    <td key={j} className="py-1 px-1">
                      <div className={`text-center px-2 py-1 rounded text-[10px] ${retentionColor(val)}`}>
                        {val !== null ? `${val}%` : "—"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Retention insights" />
          <InsightCard title="Jun cohort has best Month 1 retention (33%)" body="Customers acquired in June retained best. Check what was different: was there a post-purchase email, a special product mix, or a seasonal offer? Replicate this acquisition strategy." />
          <InsightCard type="warning" title="Month 2 drop (avg 18%) is your biggest churn point" body="After 60 days, 82% of customers don't return. A '60-day re-engagement' email with a personalised product recommendation at Day 55 could lift Month 2 retention to 24%." />
          <InsightCard type="purple" title="Improving retention 5pts = ₹3.2L more revenue/year" body="Each 5% retention improvement at your scale (6,820 customers) = ~341 more repeat orders × ₹1,091 AOV = ₹3,72,000/year with zero additional ad spend." />
        </Card>

        <Card>
          <CardHeader title="Revenue by cohort" right="Cumulative" />
          {cohortRevenue.map((c, i) => (
            <BarRow
              key={i} label={c.month} pct={c.pct} value={formatINR(c.revenue)}
              color={["green", "blue", "purple", "teal", "amber"][i] as "green" | "blue" | "purple" | "teal" | "amber"}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}
