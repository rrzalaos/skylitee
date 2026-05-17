"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { products } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

const signalConfig: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" }> = {
  bestseller: { label: "Best seller", variant: "green" },
  good: { label: "Good", variant: "green" },
  reorder: { label: "Reorder now", variant: "red" },
  bundle: { label: "Bundle opp.", variant: "amber" },
};

const actionConfig: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" }> = {
  bestseller: { label: "Safe", variant: "green" },
  good: { label: "Monitor", variant: "amber" },
  reorder: { label: "Reorder now", variant: "red" },
  bundle: { label: "Overstocked", variant: "green" },
};

const maxRev = Math.max(...products.map(p => p.revenue));

export default function ProductsPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Product Analytics</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Shopify · performance, inventory signals, movers</p>
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
        <KPICard label="Total SKUs sold" value="305" sub="COD 149 · Prepaid 156" />
        <KPICard label="Best seller" value="Position Print" sub="66 orders · ₹72,006" />
        <KPICard label="Avg SKUs/order" value="1.41" changeLabel="Bundle opportunity" change={1} />
        <KPICard label="Stock-out risk" value="1 product" sub="Combo Fabric · 12 days" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <Card>
          <CardHeader title="Revenue by product" />
          {products.map((p, i) => (
            <BarRow
              key={i}
              label={p.name.replace(" Set", "").substring(0, 16)}
              pct={Math.round((p.revenue / maxRev) * 100)}
              value={formatINR(p.revenue)}
              color={["green", "blue", "amber", "purple"][i] as "green" | "blue" | "amber" | "purple"}
            />
          ))}
          <InsightCard type="info" title="AI: Bundle Position Print + Embroidery at ₹2,200" body="Both top sellers. Bundle est. 18% AOV lift. Target 35–44 female via IG Feed." />
        </Card>

        <Card>
          <CardHeader title="Demand forecast" right="Next 30 days" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Product", "Stock", "Daily sell rate", "Days left", "Action"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const daysLeft = Math.round(p.stock / p.dailySell);
                  return (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2">{p.name}</td>
                      <td className={`py-1.5 px-1.5 font-medium ${p.stock <= 50 ? "text-[#d94040]" : ""}`}>{p.stock}</td>
                      <td className="py-2 px-2">{p.dailySell}/day</td>
                      <td className={`py-1.5 px-1.5 font-medium ${daysLeft <= 15 ? "text-[#d94040]" : ""}`}>{daysLeft}d</td>
                      <td className="py-2 px-2">
                        <Badge variant={actionConfig[p.signal]?.variant}>{actionConfig[p.signal]?.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
