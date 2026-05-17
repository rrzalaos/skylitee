"use client";
import { useEffect, useState, useCallback } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import { useDateRange } from "@/lib/date-range-context";
import { FileSpreadsheet, ShoppingBag, Share2, Megaphone, Search } from "lucide-react";

interface DashboardData {
  kpis: {
    grossSales: number;
    totalOrders: number;
    aov: number;
    codOrders: number;
    prepaidOrders: number;
    newCustomers: number;
    returningCustomers: number;
  };
  period: { days: number };
}

interface ProductRow {
  id: number;
  name: string;
  total: number;
  revenue: number;
  stock: number;
  price: number;
  signal: string;
}

const signalBadge: Record<string, { label: string; variant: "green" | "amber" | "red" | "blue" }> = {
  bestseller: { label: "Best seller", variant: "green" },
  good: { label: "Good", variant: "green" },
  reorder: { label: "Reorder now", variant: "red" },
  bundle: { label: "Bundle opp.", variant: "amber" },
};

export default function SalesPage() {
  const { range } = useDateRange();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Channel connection + data state
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaSpend, setMetaSpend] = useState<number | null>(null);
  const [metaRevenue, setMetaRevenue] = useState<number | null>(null);
  const [metaOrders, setMetaOrders] = useState<number | null>(null);
  const [gscConnected, setGscConnected] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, productsRes, metaAccountRes, googleRes] = await Promise.all([
        fetch(`/api/shopify/dashboard?from=${range.from}&to=${range.to}`),
        fetch("/api/shopify/products"),
        fetch("/api/meta/accounts"),
        fetch("/api/google/sites"),
      ]);

      const [dashJson, productsJson, metaAccountJson, googleJson] = await Promise.all([
        dashRes.json(),
        productsRes.json(),
        metaAccountRes.json(),
        googleRes.json(),
      ]);

      if (dashJson.kpis) setDash(dashJson);
      if (productsJson.products) setProducts(productsJson.products);

      const metaOk = !metaAccountJson.error;
      setMetaConnected(metaOk);
      setGscConnected(!!googleJson.gscConnected);

      if (metaOk) {
        const metaRes = await fetch(`/api/meta?from=${range.from}&to=${range.to}`);
        const metaJson = await metaRes.json();
        if (!metaJson.error && metaJson.kpis) {
          setMetaSpend(metaJson.kpis.spend);
          setMetaRevenue(metaJson.kpis.purchaseValue);
          setMetaOrders(metaJson.kpis.purchases);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  const codPct = dash ? Math.round((dash.kpis.codOrders / Math.max(dash.kpis.totalOrders, 1)) * 100) : 0;
  const prepaidPct = 100 - codPct;

  function downloadCSV() {
    if (!products.length) return;
    const rows = [
      ["Product", "Orders", "Revenue", "Stock", "Signal"],
      ...products.map(p => [p.name, p.total, formatINR(p.revenue), p.stock, p.signal]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sales-report.csv"; a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Sales Report</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">Shopify · This month · Live data</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4] hover:bg-[#e0f5e9] transition-colors">
          <FileSpreadsheet size={13} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-[15px] text-[#686864] py-8 text-center">Loading real store data...</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            <KPICard label="Gross Sales" value={dash ? formatINR(dash.kpis.grossSales) : "—"} />
            <KPICard label="Total Orders" value={dash ? dash.kpis.totalOrders.toString() : "—"} />
            <KPICard label="AOV" value={dash ? formatINR(dash.kpis.aov) : "—"} />
            <KPICard label="New Customers" value={dash ? dash.kpis.newCustomers.toString() : "—"} sub={dash ? `${dash.kpis.returningCustomers} returning` : ""} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Card>
              <CardHeader title="Channel breakdown" />
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.09]">
                      {["Channel", "Sales", "Orders", "Status"].map(h => (
                        <th key={h} className="text-left py-2 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Shopify — always live */}
                    <tr className="border-b border-black/[0.06] hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 font-medium">
                        <div className="flex items-center gap-1.5"><ShoppingBag size={11} className="text-[#96BF48]" /> Shopify</div>
                      </td>
                      <td className="py-2 px-2 font-semibold">{dash ? formatINR(dash.kpis.grossSales) : "—"}</td>
                      <td className="py-2 px-2">{dash?.kpis.totalOrders ?? "—"}</td>
                      <td className="py-2 px-2"><Badge variant="green">Live</Badge></td>
                    </tr>

                    {/* Meta Ads */}
                    <tr className="border-b border-black/[0.06] hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 font-medium">
                        <div className="flex items-center gap-1.5"><Share2 size={11} className="text-[#1877F2]" /> Meta Ads</div>
                      </td>
                      <td className="py-2 px-2">
                        {metaConnected && metaRevenue !== null
                          ? <span className="font-semibold">{formatINR(metaRevenue)}</span>
                          : <span className="text-[#9e9e9a]">—</span>}
                      </td>
                      <td className="py-2 px-2">
                        {metaConnected && metaOrders !== null
                          ? metaOrders
                          : <span className="text-[#9e9e9a]">—</span>}
                      </td>
                      <td className="py-2 px-2">
                        {metaConnected
                          ? <Badge variant="green">Connected</Badge>
                          : <Badge variant="red">Not connected</Badge>}
                      </td>
                    </tr>

                    {/* Google Ads */}
                    <tr className="border-b border-black/[0.06] hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 font-medium">
                        <div className="flex items-center gap-1.5"><Megaphone size={11} className="text-[#4285F4]" /> Google Ads</div>
                      </td>
                      <td className="py-2 px-2 text-[#9e9e9a]">—</td>
                      <td className="py-2 px-2 text-[#9e9e9a]">—</td>
                      <td className="py-2 px-2"><Badge variant="red">Not connected</Badge></td>
                    </tr>

                    {/* Search Console */}
                    <tr className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 font-medium">
                        <div className="flex items-center gap-1.5"><Search size={11} className="text-[#4285F4]" /> Search Console</div>
                      </td>
                      <td className="py-2 px-2 text-[#9e9e9a]">—</td>
                      <td className="py-2 px-2 text-[#9e9e9a]">—</td>
                      <td className="py-2 px-2">
                        {gscConnected
                          ? <Badge variant="green">Connected</Badge>
                          : <Badge variant="red">Not connected</Badge>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Meta spend note */}
              {metaConnected && metaSpend !== null && metaSpend > 0 && (
                <div className="mt-2 text-[13px] text-[#686864] bg-[#f7f7f5] rounded-lg px-2.5 py-1.5">
                  Meta ad spend this period: <span className="font-semibold text-[#181816]">{formatINR(metaSpend)}</span>
                  {metaRevenue !== null && metaSpend > 0 && (
                    <> · ROAS <span className="font-semibold text-[#181816]">{(metaRevenue / metaSpend).toFixed(2)}×</span></>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="COD vs Prepaid" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: "Prepaid orders", value: dash?.kpis.prepaidOrders ?? "—", color: "text-[#0d6b4f]" },
                  { label: "COD orders", value: dash?.kpis.codOrders ?? "—", color: "text-[#e89820]" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 bg-[#f7f7f5] rounded-xl">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[15px] text-[#686864] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              {dash && dash.kpis.totalOrders > 0 && (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden mb-3">
                    <div className="bg-[#17a773]" style={{ width: `${prepaidPct}%` }} />
                    <div className="bg-[#e89820]" style={{ width: `${codPct}%` }} />
                  </div>
                  {codPct > 40 && (
                    <InsightCard type="warning" title={`COD is ${codPct}% — consider prepaid incentive`} body="Add a ₹75 prepaid discount to shift COD buyers. Reduces returns and improves cash flow." action="Create prepaid offer" />
                  )}
                </>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="SKU performance" right="Top by revenue · This month" />
            {products.length === 0 ? (
              <div className="text-[15px] text-[#686864] py-6 text-center">No sales data for this month yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.09]">
                      {["Product", "Orders", "Revenue", "Stock", "Action"].map(h => (
                        <th key={h} className="text-left py-2 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 10).map((p, i) => (
                      <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                        <td className="py-2 px-2 font-medium max-w-[180px] truncate">{p.name}</td>
                        <td className="py-2 px-2">{p.total}</td>
                        <td className="py-2 px-2 font-semibold">{formatINR(p.revenue)}</td>
                        <td className={`py-2 px-2 font-semibold ${p.stock <= 10 ? "text-[#d94040]" : "text-[#0d6b4f]"}`}>
                          {p.stock}{p.stock <= 10 ? " — Low!" : ""}
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={signalBadge[p.signal]?.variant || "blue"}>
                            {signalBadge[p.signal]?.label || p.signal}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
