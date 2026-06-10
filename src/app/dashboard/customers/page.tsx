"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { BarRow } from "@/components/ui/bar-row";
import { formatINR } from "@/lib/utils";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToPDF } from "@/lib/export";

interface CustomerData {
  kpis: {
    totalCustomers: number;
    repeat: number;
    oneTime: number;
    avgLTV: number;
    newThisMonth: number;
  };
  topCities: { city: string; count: number; pct: number }[];
}

export default function CustomersPage() {
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shopify/customers")
      .then(r => r.json())
      .then(d => { if (d.kpis) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  const repeatRate = data ? Math.round((data.kpis.repeat / Math.max(data.kpis.totalCustomers, 1)) * 100) : 0;
  const maxCity = data ? Math.max(...data.topCities.map(c => c.count), 1) : 1;

  function buildSections() {
    if (!data) return [];
    return [
      {
        title: "Customer KPIs",
        headers: ["Metric", "Value"],
        rows: [
          ["Total Customers", data.kpis.totalCustomers],
          ["Avg LTV (Revenue per customer)", formatINR(data.kpis.avgLTV)],
          ["Repeat Rate", `${repeatRate}%`],
          ["Repeat Buyers", data.kpis.repeat],
          ["One-time Buyers", data.kpis.oneTime],
          ["New This Month", data.kpis.newThisMonth],
        ],
      },
      {
        title: "Customer Segments",
        headers: ["Segment", "Count", "% of Total"],
        rows: [
          ["Repeat Buyers", data.kpis.repeat, `${Math.round((data.kpis.repeat / Math.max(data.kpis.totalCustomers, 1)) * 100)}%`],
          ["One-time Buyers", data.kpis.oneTime, `${Math.round((data.kpis.oneTime / Math.max(data.kpis.totalCustomers, 1)) * 100)}%`],
          ["New This Month", data.kpis.newThisMonth, `${Math.round((data.kpis.newThisMonth / Math.max(data.kpis.totalCustomers, 1)) * 100)}%`],
        ],
      },
      {
        title: "Top Cities by Customers",
        headers: ["#", "City", "Customers", "% of Total"],
        rows: data.topCities.map((c, i) => [i + 1, c.city, c.count, `${c.pct}%`]),
      },
    ];
  }

  function handleExportCSV() { exportToCSV("skylitee-customers", buildSections()); }
  async function handleExportPDF() {
    await exportToPDF("skylitee-customers", "Customer Intelligence", "Shopify live data · All time", buildSections());
  }

  const segments = data ? [
    { name: "Repeat buyers", icon: "🏆", count: data.kpis.repeat, color: "text-[#0d6b4f]", border: "border-[#e0f5ee]", desc: "Ordered more than once" },
    { name: "One-time", icon: "🛍️", count: data.kpis.oneTime, color: "text-[#5c3608]", border: "border-[#faecd7]", desc: "Only one order so far" },
    { name: "New this month", icon: "🆕", count: data.kpis.newThisMonth, color: "text-[#0a3d7a]", border: "border-[#e4eef9]", desc: "Joined this month" },
  ] : [];

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Customer Intelligence</h2>
            <span className="text-[11px] font-semibold text-[#0d6b4f] bg-[#e0f5ee] px-2 py-0.5 rounded-full">All-time</span>
          </div>
          <p className="text-[15px] text-[#686864] mt-0.5">
            Lifetime customer data from Shopify · auto-synced every 30 min
            <span className="text-[#a3a39e]"> (not affected by the date range)</span>
          </p>
        </div>
        <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} disabled={!data} />
      </div>

      {loading ? (
        <div className="text-[15px] text-[#686864] py-8 text-center">Loading real customer data...</div>
      ) : !data ? (
        <div className="text-[15px] text-[#d94040] py-8 text-center">Could not load customer data. Check Shopify connection.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <KPICard label="Total Customers" value={data.kpis.totalCustomers.toLocaleString()} />
            <KPICard label="Avg LTV" value={formatINR(data.kpis.avgLTV)} sub="Revenue per customer" />
            <KPICard
              label="Repeat Rate"
              value={`${repeatRate}%`}
              change={repeatRate >= 25 ? 1 : -1}
              changeLabel={repeatRate >= 25 ? "Above 25% benchmark" : "Below 25% benchmark"}
            />
            <KPICard label="New This Month" value={data.kpis.newThisMonth.toString()} sub="New customers acquired" />
          </div>

          <Card className="mb-2">
            <CardHeader title="Customer Segments" right={`${data.kpis.totalCustomers.toLocaleString()} total customers`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              {segments.map(seg => (
                <div key={seg.name} className={`border rounded-xl p-4 text-center ${seg.border}`}>
                  <div className="text-2xl mb-1.5">{seg.icon}</div>
                  <div className="text-[14px] font-semibold text-[#181816]">{seg.name}</div>
                  <div className={`text-2xl font-bold mt-1 ${seg.color}`}>{seg.count.toLocaleString()}</div>
                  <div className="text-[13px] text-[#686864] mt-1">{seg.desc}</div>
                  <div className={`text-[13px] font-semibold mt-1 ${seg.color}`}>
                    {Math.round((seg.count / Math.max(data.kpis.totalCustomers, 1)) * 100)}% of total
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Card>
              <CardHeader title="AI actions" />
              {data.kpis.repeat > 0 && (
                <InsightCard title={`${data.kpis.repeat} repeat buyers — reward them`} body="Send a WhatsApp or email with early access to new drops. Repeat buyers spend 3× more on average." />
              )}
              {data.kpis.oneTime > 0 && (
                <InsightCard type="info" title={`${data.kpis.oneTime} one-time buyers — trigger 2nd purchase`} body="Email Day 7 post-purchase with complementary product suggestion. 2nd purchase rate increases from ~18% → 31% with this nudge." />
              )}
              {data.kpis.newThisMonth > 0 && (
                <InsightCard type="purple" title={`${data.kpis.newThisMonth} new customers this month`} body="Welcome flow: send a personalised thank-you with brand story + product care tips. Sets the tone for long-term loyalty." />
              )}
              {repeatRate < 25 && (
                <InsightCard type="warning" title={`Repeat rate ${repeatRate}% — below 25% benchmark`} body="Focus on post-purchase flows: 7-day follow-up email, loyalty points, or a small discount on the next order." />
              )}
            </Card>

            <Card>
              <CardHeader title="Top cities by customers" />
              {data.topCities.length === 0 ? (
                <div className="text-[15px] text-[#686864] py-4 text-center">No location data available</div>
              ) : (
                data.topCities.map((c, i) => (
                  <BarRow
                    key={i}
                    label={c.city}
                    pct={Math.round((c.count / maxCity) * 100)}
                    value={`${c.count} customers (${c.pct}%)`}
                    color={["green", "blue", "amber", "purple", "teal", "green", "blue", "amber"][i] as "green" | "blue" | "amber" | "purple" | "teal"}
                  />
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
