"use client";
import { useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { WarnBanner } from "@/components/ui/warn-banner";
import { financials } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function FinancialPage() {
  const [cogs, setCogs] = useState(38);
  const [logistics, setLogistics] = useState(8);
  const margin = (100 - cogs - logistics) / 100;
  const beRoas = margin > 0 ? (1 / margin).toFixed(2) : "∞";
  const isBelowBE = 1.34 < parseFloat(beRoas);

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Financial Dashboard</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">P&L · unit economics · LTV · break-even analysis</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
            <FileSpreadsheet size={12} /> CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
            <FileText size={12} /> PDF
          </button>
        </div>
      </div>

      <WarnBanner type="amber">
        <div>
          <span className="font-semibold">Meta Ads not connected — ad spend figures below are estimated, not live.</span>
          {" "}Revenue and order data is real (Shopify). Connect Meta for an accurate P&amp;L.
        </div>
      </WarnBanner>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Gross Revenue" value={formatINR(financials.grossRevenue)} change={12.4} />
        <KPICard label="Gross Margin" value={`${financials.grossMargin}%`} sub="After COGS est. ₹89,519" />
        <KPICard label="Net Contribution" value={formatINR(financials.netContribution)} changeLabel="Estimated — connect Meta" change={-1} />
        <KPICard label="LTV:CAC Ratio" value={`${financials.ltvCac}×`} changeLabel="Below 3× benchmark" change={-1} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="P&L statement" right="Estimated · Aug 1–19" />
          {[
            { label: "Gross revenue", value: financials.grossRevenue, positive: true },
            { label: "↳ Returns est. (COD 54%)", value: -financials.returnsEst, positive: false, sub: true },
            { label: "Net revenue", value: financials.netRevenue, positive: true, bold: true },
            { label: "↳ COGS est. (38%)", value: -financials.cogs, positive: false, sub: true },
            { label: "Gross profit", value: financials.grossProfit, positive: true, bold: true },
            { label: "↳ Meta ad spend", value: -financials.adSpend, positive: false, sub: true },
            { label: "↳ Logistics / COD fees", value: -financials.logistics, positive: false, sub: true },
            { label: "↳ Platform fees (2%)", value: -financials.platformFees, positive: false, sub: true },
            { label: "Net contribution", value: financials.netContribution, positive: false, bold: true, large: true },
          ].map((row, i) => (
            <div key={i} className={`flex justify-between items-center py-1.5 border-b border-black/[0.06] last:border-0 ${row.large ? "border-t border-black/[0.09] pt-2" : ""}`}>
              <span className={`text-[14px] ${row.sub ? "pl-3 text-[#686864] text-[13px]" : ""} ${row.bold ? "font-semibold" : ""}`}>
                {row.label}
              </span>
              <span className={`text-[14px] font-medium ${row.positive ? "text-[#0d6b4f]" : "text-[#d94040]"} ${row.bold ? "font-semibold" : ""} ${row.large ? "text-[16px]" : ""}`}>
                {row.value < 0 ? "−" : ""}{formatINR(Math.abs(row.value))}
              </span>
            </div>
          ))}
          <WarnBanner type="red">
            Ad spend exceeds gross profit. Need ROAS ≥1.85 to break even. Current: 1.34.
          </WarnBanner>
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="Break-even ROAS calculator" />
            <div className="mb-3">
              <div className="text-[13px] text-[#686864] mb-1">COGS % <span className="font-semibold text-[#181816]">{cogs}%</span></div>
              <input type="range" min={20} max={60} step={1} value={cogs} onChange={e => setCogs(+e.target.value)} className="w-full accent-[#17a773]" />
            </div>
            <div className="mb-3">
              <div className="text-[13px] text-[#686864] mb-1">Logistics % <span className="font-semibold text-[#181816]">{logistics}%</span></div>
              <input type="range" min={3} max={20} step={1} value={logistics} onChange={e => setLogistics(+e.target.value)} className="w-full accent-[#17a773]" />
            </div>
            <div className="bg-[#f7f7f5] rounded-lg px-3 py-2.5">
              <div className="text-[13px] text-[#686864]">Break-even ROAS:</div>
              <div className={`text-2xl font-semibold mt-0.5 ${isBelowBE ? "text-[#d94040]" : "text-[#0d6b4f]"}`}>{beRoas}</div>
              <div className="text-[13px] text-[#9e9e9a] mt-0.5">
                {isBelowBE ? `Current ROAS 1.34 is below break-even` : `Current ROAS 1.34 is above break-even`}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Unit economics" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "CAC (Meta)", value: "₹897" },
                { label: "AOV", value: "₹1,091" },
                { label: "Est. LTV (2×)", value: "₹2,180" },
                { label: "LTV:CAC", value: "2.43×" },
              ].map(s => (
                <div key={s.label} className="text-center p-2.5 bg-[#f7f7f5] rounded-lg">
                  <div className="text-lg font-semibold text-[#181816]">{s.value}</div>
                  <div className="text-[15px] text-[#686864] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <InsightCard type="warning" title="LTV:CAC 2.43× below healthy 3× benchmark" body="Build email nurture + loyalty program to increase repeat purchase from 18% → 28%. Est. LTV increases to ₹2,900+ — LTV:CAC hits 3.2×." />
          </Card>
        </div>
      </div>
    </div>
  );
}
