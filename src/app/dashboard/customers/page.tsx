"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { customerKpis, rfmSegments } from "@/lib/mock-data";
import { formatINR, formatNumber } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

const segmentColors: Record<string, string> = {
  green: "text-[#0d6b4f]", blue: "text-[#0a3d7a]", teal: "text-[#0a4a50]",
  amber: "text-[#5c3608]", red: "text-[#6e1c1c]", purple: "text-[#32297a]",
};
const segmentBorderColors: Record<string, string> = {
  green: "border-[#e0f5ee]", blue: "border-[#e4eef9]", teal: "border-[#e0f3f5]",
  amber: "border-[#faecd7]", red: "border-[#fce8e8]", purple: "border-[#eceafb]",
};
const badgeVariants: Record<string, "green" | "blue" | "teal" | "amber" | "red" | "purple"> = {
  green: "green", blue: "blue", teal: "teal", amber: "amber", red: "red", purple: "purple",
};

export default function CustomersPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Customer Intelligence</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">RFM segmentation · LTV prediction · behaviour analysis</p>
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
        <KPICard label="Total Customers" value={formatNumber(customerKpis.total)} change={customerKpis.totalChange} />
        <KPICard label="Avg LTV" value={formatINR(customerKpis.avgLtv)} sub="Based on 2× repeat purchase" />
        <KPICard label="Repeat Rate" value={`${customerKpis.repeatRate}%`} changeLabel="Below 25% benchmark" change={-1} />
        <KPICard label="Champions LTV" value={formatINR(customerKpis.championsLtv)} sub="Top 20% · 4.1× avg" />
      </div>

      {/* RFM Segments */}
      <Card className="mb-2">
        <CardHeader title="RFM Customer Segmentation" right="AI-powered · 6,820 customers" />
        <div className="grid grid-cols-6 gap-2 mt-1">
          {rfmSegments.map((seg) => (
            <div key={seg.name} className={`border rounded-xl p-3 text-center cursor-default hover:shadow-sm transition-all ${segmentBorderColors[seg.color]}`}>
              <div className="text-2xl mb-1.5">{seg.icon}</div>
              <div className="text-[11px] font-semibold text-[#181816]">{seg.name}</div>
              <div className={`text-lg font-semibold mt-0.5 ${segmentColors[seg.color]}`}>{formatNumber(seg.count)}</div>
              <div className="text-[10px] text-[#686864] mt-1 leading-snug">
                {seg.name === "Champions" && "Bought recently, often, and spent the most"}
                {seg.name === "Loyal" && "Regular buyers with high frequency"}
                {seg.name === "Potential" && "Recent buyers who could become loyal"}
                {seg.name === "At Risk" && "Used to buy often but haven't lately"}
                {seg.name === "Dormant" && "Haven't purchased in 90+ days"}
                {seg.name === "New" && "First purchase in last 30 days"}
              </div>
              {seg.ltv && (
                <div className="mt-1.5">
                  <Badge variant={badgeVariants[seg.color]}>LTV {formatINR(seg.ltv)}</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="AI actions by segment" />
          <InsightCard title="🏆 Champions (412): Give VIP early access" body="Send WhatsApp message: 'You're one of our top customers — here's a 72-hour early preview of our new drop.' Cost: ₹0. Expected revenue: ₹18–25K." />
          <InsightCard type="info" title="⚠️ At Risk (680): Win-back campaign now" body="Email with personalised subject: 'We miss you, [Name]' + 15% discount valid 7 days. At 12% reactivation rate = 82 orders × ₹1,091 = ₹89,462 recovery." />
          <InsightCard type="warning" title="😴 Dormant (920): Last chance offer" body="SMS campaign: 'Your exclusive offer expires in 24 hours.' 6% reactivation expected = 55 orders. After this, remove from ad audiences to reduce wasted spend." />
          <InsightCard type="purple" title="🆕 New (2,734): 2nd purchase trigger" body="Email Day 7 post-purchase: 'What to pair with your [product]' with complementary product suggestion. 2nd purchase rate increases from 18% → 31% with this nudge." />
        </Card>

        <Card>
          <CardHeader title="LTV predictor by segment" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Segment", "Customers", "Avg LTV", "12-mo potential", "Priority"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rfmSegments.filter(s => s.ltv).map((seg, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2">{seg.name}</td>
                    <td className="py-2 px-2">{formatNumber(seg.count)}</td>
                    <td className="py-2 px-2">{formatINR(seg.ltv!)}</td>
                    <td className="py-2 px-2">{seg.potential ? formatINR(seg.potential) : "—"}</td>
                    <td className="py-2 px-2">
                      <Badge variant={badgeVariants[seg.color]}>{seg.action}</Badge>
                    </td>
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
