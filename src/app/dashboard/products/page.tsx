"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet } from "lucide-react";

interface ProductRow {
  id: number;
  name: string;
  total: number;
  revenue: number;
  stock: number;
  price: number;
  signal: string;
}

const signalConfig: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" }> = {
  bestseller: { label: "Best seller", variant: "green" },
  good: { label: "Good", variant: "green" },
  reorder: { label: "Reorder now", variant: "red" },
  bundle: { label: "Bundle opp.", variant: "amber" },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [days, setDays] = useState(new Date().getDate());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/shopify/products").then(r => r.json()),
      fetch("/api/shopify/dashboard").then(r => r.json()),
    ]).then(([p, d]) => {
      if (p.products) setProducts(p.products);
      if (d.period?.days) setDays(d.period.days);
    }).finally(() => setLoading(false));
  }, []);

  const topProduct = products[0];
  const lowStock = products.filter(p => p.stock <= 10);
  const withSales = products.filter(p => p.total > 0);
  const maxRev = Math.max(...products.map(p => p.revenue), 1);

  function downloadCSV() {
    const rows = [
      ["Product", "Orders", "Revenue", "Stock", "Price", "Signal"],
      ...products.map(p => [p.name, p.total, formatINR(p.revenue), p.stock, formatINR(p.price), p.signal]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "products.csv"; a.click();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Product Analytics</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Shopify · live inventory & sales · this month</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={12} /> CSV
        </button>
      </div>

      {loading ? (
        <div className="text-[12px] text-[#686864] py-8 text-center">Loading real product data...</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <KPICard label="Total Products" value={products.length.toString()} sub={`${withSales.length} with sales this month`} />
            <KPICard
              label="Best Seller"
              value={topProduct ? topProduct.name.substring(0, 14) : "—"}
              sub={topProduct ? `${topProduct.total} orders · ${formatINR(topProduct.revenue)}` : "No sales yet"}
            />
            <KPICard label="Total Orders" value={products.reduce((s, p) => s + p.total, 0).toString()} sub="All products this month" />
            <KPICard
              label="Low Stock"
              value={lowStock.length.toString()}
              sub={lowStock.length > 0 ? `${lowStock[0].name.substring(0, 16)}...` : "All stocked"}
              change={lowStock.length > 0 ? -1 : 1}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Card>
              <CardHeader title="Revenue by product" right="This month" />
              {withSales.length === 0 ? (
                <div className="text-[12px] text-[#686864] py-6 text-center">No sales this month yet</div>
              ) : (
                <>
                  {withSales.slice(0, 8).map((p, i) => (
                    <BarRow
                      key={i}
                      label={p.name.substring(0, 18)}
                      pct={Math.round((p.revenue / maxRev) * 100)}
                      value={formatINR(p.revenue)}
                      color={["green", "blue", "amber", "purple", "teal", "green", "blue", "amber"][i] as "green" | "blue" | "amber" | "purple" | "teal"}
                    />
                  ))}
                  {withSales.length >= 2 && (
                    <InsightCard type="info" title={`Top 2 products drive ${Math.round(((withSales[0].revenue + (withSales[1]?.revenue || 0)) / Math.max(products.reduce((s, p) => s + p.revenue, 0), 1)) * 100)}% of revenue`} body="Consider bundling your top sellers to increase AOV." />
                  )}
                </>
              )}
            </Card>

            <Card>
              <CardHeader title="Inventory & demand forecast" right="Based on this month" />
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.09]">
                      {["Product", "Stock", "Sold/day", "Days left", "Action"].map(h => (
                        <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 10).map((p, i) => {
                      const dailySell = days > 0 ? +(p.total / days).toFixed(1) : 0;
                      const daysLeft = dailySell > 0 ? Math.round(p.stock / dailySell) : 999;
                      return (
                        <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                          <td className="py-1.5 px-1.5 max-w-[120px] truncate">{p.name}</td>
                          <td className={`py-1.5 px-1.5 font-medium ${p.stock <= 10 ? "text-[#d94040]" : ""}`}>{p.stock}</td>
                          <td className="py-1.5 px-1.5">{dailySell > 0 ? `${dailySell}/day` : "—"}</td>
                          <td className={`py-1.5 px-1.5 font-medium ${daysLeft <= 15 && dailySell > 0 ? "text-[#d94040]" : ""}`}>
                            {dailySell > 0 ? `${daysLeft}d` : "—"}
                          </td>
                          <td className="py-1.5 px-1.5">
                            <Badge variant={signalConfig[p.signal]?.variant || "blue"}>
                              {signalConfig[p.signal]?.label || p.signal}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
