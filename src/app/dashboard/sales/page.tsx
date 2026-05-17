"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { WarnBanner } from "@/components/ui/warn-banner";
import { kpis, channels, products } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

function downloadCSV() {
  const rows = [
    ["Channel", "Sales", "Orders", "ROAS", "AOV", "Status"],
    ...channels.map(c => [c.name, formatINR(c.sales), c.orders, c.roas ?? "—", c.aov ? formatINR(c.aov) : "—", c.status]),
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "sales-report.csv"; a.click();
}

const signalBadge: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" }> = {
  bestseller: { label: "Best seller", variant: "green" },
  good: { label: "Good", variant: "green" },
  reorder: { label: "Reorder now", variant: "red" },
  bundle: { label: "Bundle opp.", variant: "amber" },
};

export default function SalesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Sales Report</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Shopify · Aug 1–19, 2025</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4] hover:bg-[#e0f5e9] transition-colors">
          <FileSpreadsheet size={13} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-4">
        <KPICard label="Gross Sales" value={formatINR(kpis.grossSales)} change={kpis.grossSalesChange} />
        <KPICard label="Total Orders" value={kpis.totalOrders.toString()} change={kpis.ordersChange} />
        <KPICard label="AOV" value={formatINR(kpis.aov)} change={kpis.aovChange} />
        <KPICard label="Organic Revenue" value={formatINR(kpis.organicRevenue)} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <Card>
          <CardHeader title="Channel breakdown" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Channel", "Sales", "Orders", "ROAS", "Status"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channels.map((c, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2 font-medium">{c.name}</td>
                    <td className="py-2 px-2 font-semibold">{formatINR(c.sales)}</td>
                    <td className="py-2 px-2">{c.orders}</td>
                    <td className="py-2 px-2">
                      {c.roas ? <Badge variant={c.roas >= 1.5 ? "green" : c.roas >= 1 ? "amber" : "red"}>{c.roas.toFixed(2)}</Badge> : <Badge variant="green">Free</Badge>}
                    </td>
                    <td className="py-2 px-2">
                      {c.status === "live" ? <Badge variant="green">Live</Badge> : <Badge variant="red">Not connected</Badge>}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-black/[0.09] bg-[#f7f7f5]">
                  <td className="py-2 px-2">Total</td>
                  <td className="py-2 px-2">{formatINR(kpis.grossSales)}</td>
                  <td className="py-2 px-2">{kpis.totalOrders}</td>
                  <td className="py-2 px-2">1.34</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="COD vs Prepaid" />
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "Prepaid orders", value: "99", color: "text-[#0d6b4f]" },
              { label: "COD orders", value: "117", color: "text-[#e89820]" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-[#f7f7f5] rounded-xl">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[12px] text-[#686864] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex h-3 rounded-full overflow-hidden mb-3">
            <div className="bg-[#17a773]" style={{ width: "46%" }} />
            <div className="bg-[#e89820]" style={{ width: "54%" }} />
          </div>
          <InsightCard type="warning" title="COD is 54% — 14pts above benchmark" body="Add a ₹75 prepaid incentive. Saves ~₹5K/mo in returns." action="Create prepaid offer" />
        </Card>
      </div>

      <Card>
        <CardHeader title="SKU performance" right="Top by revenue" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.09]">
                {["Product", "Orders", "Revenue", "Stock", "Action"].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-[11px] font-semibold text-[#686864]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                  <td className="py-2 px-2 font-medium">{p.name}</td>
                  <td className="py-2 px-2">{p.total}</td>
                  <td className="py-2 px-2 font-semibold">{formatINR(p.revenue)}</td>
                  <td className={`py-2 px-2 font-semibold ${p.stock <= 50 ? "text-[#d94040]" : "text-[#0d6b4f]"}`}>
                    {p.stock}{p.stock <= 50 ? " — Low!" : ""}
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant={signalBadge[p.signal]?.variant || "gray"}>
                      {signalBadge[p.signal]?.label || p.signal}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
