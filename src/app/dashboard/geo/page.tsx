"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { BarRow } from "@/components/ui/bar-row";
import { formatINR } from "@/lib/utils";
import { FileSpreadsheet } from "lucide-react";

interface CityRevenue { city: string; revenue: number; }
interface CityCustomers { city: string; count: number; pct: number; }

export default function GeoPage() {
  const [revenueByCity, setRevenueByCity] = useState<CityRevenue[]>([]);
  const [customersByCity, setCustomersByCity] = useState<CityCustomers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/shopify/dashboard").then(r => r.json()),
      fetch("/api/shopify/customers").then(r => r.json()),
    ]).then(([d, c]) => {
      if (d.topCities) setRevenueByCity(d.topCities);
      if (c.topCities) setCustomersByCity(c.topCities);
    }).finally(() => setLoading(false));
  }, []);

  const topCity = revenueByCity[0];
  const totalRevenue = revenueByCity.reduce((s, c) => s + c.revenue, 0);
  const maxRev = Math.max(...revenueByCity.map(c => c.revenue), 1);

  // Merge city data
  const merged = revenueByCity.map(r => {
    const custData = customersByCity.find(c => c.city.toLowerCase() === r.city.toLowerCase());
    return { city: r.city, revenue: r.revenue, customers: custData?.count ?? 0 };
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Geo Performance</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">City-level revenue & customer data from Shopify · This month</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={12} /> CSV
        </button>
      </div>

      {loading ? (
        <div className="text-[15px] text-[#686864] py-8 text-center">Loading real geo data...</div>
      ) : revenueByCity.length === 0 ? (
        <div className="text-[15px] text-[#686864] py-8 text-center">No geo data available yet — orders need shipping addresses to show city data.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <KPICard label="Top city" value={topCity?.city ?? "—"} sub={topCity ? formatINR(topCity.revenue) : ""} />
            <KPICard label="Cities with orders" value={revenueByCity.length.toString()} sub="Unique delivery cities" />
            <KPICard
              label="Top city share"
              value={topCity ? `${Math.round((topCity.revenue / Math.max(totalRevenue, 1)) * 100)}%` : "—"}
              sub="of total revenue"
            />
            <KPICard label="Total customers tracked" value={customersByCity.reduce((s, c) => s + c.count, 0).toString()} sub="With location data" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card>
              <CardHeader title="City performance" right="By revenue · This month" />
              <div className="overflow-x-auto">
                <table className="w-full text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.09]">
                      {["City", "Revenue", "Customers", "Revenue share"].map(h => (
                        <th key={h} className="text-left py-1.5 px-1.5 text-[14px] font-semibold text-[#686864]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {merged.map((g, i) => (
                      <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                        <td className="py-1.5 px-1.5 font-medium">{g.city}</td>
                        <td className="py-1.5 px-1.5 font-semibold">{formatINR(g.revenue)}</td>
                        <td className="py-1.5 px-1.5">{g.customers > 0 ? g.customers : "—"}</td>
                        <td className="py-1.5 px-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-[#f0f0ee] rounded-full overflow-hidden">
                              <div className="h-full bg-[#17a773] rounded-full" style={{ width: `${Math.round((g.revenue / totalRevenue) * 100)}%` }} />
                            </div>
                            <span className="text-[13px] text-[#686864] w-8 text-right">{Math.round((g.revenue / totalRevenue) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div>
              <Card className="mb-2">
                <CardHeader title="Revenue by city" />
                {revenueByCity.map((c, i) => (
                  <BarRow
                    key={i}
                    label={c.city}
                    pct={Math.round((c.revenue / maxRev) * 100)}
                    value={formatINR(c.revenue)}
                    color={["green", "blue", "amber", "purple", "teal"][i % 5] as "green" | "blue" | "amber" | "purple" | "teal"}
                  />
                ))}
              </Card>

              <Card>
                <CardHeader title="Geo AI insights" />
                {topCity && (
                  <InsightCard title={`${topCity.city} is your top market`} body={`${Math.round((topCity.revenue / Math.max(totalRevenue, 1)) * 100)}% of revenue. Run city-specific Meta ads targeting ${topCity.city} for higher relevance and lower CPMs.`} />
                )}
                {revenueByCity.length >= 3 && (
                  <InsightCard type="info" title="Multi-city presence detected" body={`Revenue spread across ${revenueByCity.length} cities. Consider city-specific delivery speed messaging in ads — converts better in metros.`} />
                )}
                <InsightCard type="warning" title="Add ROAS by city" body="Connect Meta Ads and Google Ads to see which cities give the best return on ad spend." />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
