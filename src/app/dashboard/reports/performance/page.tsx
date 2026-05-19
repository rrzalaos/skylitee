"use client";
import { useEffect, useState } from "react";
import { useDateRange } from "@/lib/date-range-context";
import { Card, CardHeader } from "@/components/ui/card";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { formatINR, cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, ShoppingCart, Share2, Megaphone } from "lucide-react";
import Link from "next/link";

interface SalesKPIs { grossSales: number; totalOrders: number; aov: number; newCustomers: number; returningCustomers: number; codOrders: number; prepaidOrders: number; }
interface MetaKPIs { spend: number; roas: number; cac: number; purchases: number; purchaseValue: number; ctr: number; cpc: number; atc: number; checkout: number; impressions: number; clicks: number; atcRatio: number; checkoutRatio: number; purchaseRatio: number; }
interface GA4KPIs { sessions: number; users: number; bounceRate: number; }

function Signal({ type, metric, value, detail }: { type: "good" | "warn" | "bad"; metric: string; value: string; detail: string }) {
  const s = {
    good: { bg: "bg-[#F0FDF4] dark:bg-[#052E16]/40 border-[#86EFAC]", icon: <CheckCircle2 size={14} className="text-[#16A34A] shrink-0 mt-0.5" />, label: "text-[#166534] dark:text-[#4ADE80]" },
    warn: { bg: "bg-[#FFFBEB] dark:bg-[#2D1C00]/40 border-[#FCD34D]", icon: <AlertTriangle size={14} className="text-[#D97706] shrink-0 mt-0.5" />, label: "text-[#92400E] dark:text-[#FCD34D]" },
    bad: { bg: "bg-[#FEF2F2] dark:bg-[#2D0A0A]/40 border-[#FCA5A5]", icon: <XCircle size={14} className="text-[#DC2626] shrink-0 mt-0.5" />, label: "text-[#991B1B] dark:text-[#FCA5A5]" },
  }[type];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3", s.bg)}>
      {s.icon}
      <div><div className={cn("text-[12px] font-bold", s.label)}>{metric}: {value}</div>
        <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{detail}</div></div>
    </div>
  );
}

export default function PerformanceReportPage() {
  const { range } = useDateRange();
  const [sales, setSales] = useState<{ kpis: SalesKPIs; allBySku: {name:string;qty:number;revenue:number}[]; topCities: {city:string;orders:number;revenue:number}[]; recentOrders: {name:string;total:number;status:string;gateway:string;city:string;isCod:boolean;date:string}[] } | null>(null);
  const [meta, setMeta] = useState<{ kpis: MetaKPIs; campaigns: {name:string;roas:number;spend:number;purchases:number;status:string}[] } | null>(null);
  const [ga4, setGa4] = useState<{ kpis: GA4KPIs } | null>(null);
  const [loading, setLoading] = useState(true);
  const generatedAt = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetch(`/api/shopify/sales?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch(`/api/meta?from=${range.from}&to=${range.to}`).then(r => r.json()),
      fetch(`/api/ga4?from=${range.from}&to=${range.to}`).then(r => r.json()),
    ]).then(([sR, mR, gR]) => {
      if (sR.status === "fulfilled" && !sR.value?.error) setSales(sR.value);
      if (mR.status === "fulfilled" && !mR.value?.error) setMeta(mR.value);
      if (gR.status === "fulfilled" && !gR.value?.error) setGa4(gR.value);
    }).finally(() => setLoading(false));
  }, [range.from, range.to]);

  if (loading) return <div className="text-[14px] text-[#A1A1AA] py-20 text-center">Loading performance data…</div>;
  if (!sales) return (
    <div className="text-center py-16">
      <p className="text-[14px] text-[#71717A] mb-3">Could not load performance data.</p>
      <Link href="/dashboard/connections" className="text-[#F97316] font-semibold text-[13px]">Check Shopify connection →</Link>
    </div>
  );

  const s = sales.kpis;
  const m = meta?.kpis;
  const g = ga4?.kpis;
  const codPct = s.totalOrders ? Math.round((s.codOrders / s.totalOrders) * 100) : 0;
  const metaOrders = m?.purchases ?? 0;
  const organicOrders = Math.max(0, s.totalOrders - metaOrders);
  const organicRevenue = Math.max(0, s.grossSales - (m?.purchaseValue ?? 0));
  const sessions = g?.sessions ?? 0;
  const convRate = sessions > 0 ? (s.totalOrders / sessions * 100).toFixed(2) : "—";

  const working: {metric: string; value: string; detail: string}[] = [];
  const attention: {type: "warn" | "bad"; metric: string; value: string; detail: string}[] = [];

  if (m?.roas && m.roas >= 3) working.push({ metric: "ROAS", value: `${m.roas}x`, detail: "Above the 3x profitability benchmark — Meta ads are generating strong returns. Eligible for budget scaling." });
  if (m?.roas && m.roas >= 2 && m.roas < 3) working.push({ metric: "ROAS", value: `${m.roas}x`, detail: "Between 2–3x — ads are profitable. Optimise creative and audience targeting to push above 3x." });
  if (s.totalOrders > 0) working.push({ metric: "Orders", value: s.totalOrders.toString(), detail: `${s.totalOrders} orders placed — revenue is active. AOV of ${formatINR(s.aov)} is your benchmark for upsell potential.` });
  if (s.returningCustomers > 0) working.push({ metric: "Returning Customers", value: s.returningCustomers.toString(), detail: `${s.returningCustomers} repeat buyers in this period — organic retention signal. Invest in loyalty/WhatsApp to grow this.` });
  if (m && m.atcRatio >= 50) working.push({ metric: "ATC Rate", value: `${m.atcRatio}%`, detail: "Good add-to-cart signal — product pages are converting browsers into cart additions." });

  if (m?.roas !== undefined && m.roas < 2) attention.push({ type: "bad", metric: "ROAS", value: `${m.roas}x`, detail: "Below 2x — ads are losing money. Pause lowest-performing campaigns, refresh creative, and review targeting." });
  if (codPct > 50) attention.push({ type: "warn", metric: "COD Rate", value: `${codPct}%`, detail: "More than half your orders are COD — risk of high RTOs. Introduce a Rs.75 prepaid discount to shift payment preference." });
  if (m && m.atcRatio < 30) attention.push({ type: "warn", metric: "ATC Rate", value: `${m.atcRatio}%`, detail: "Low add-to-cart rate — product pages may have friction (unclear pricing, no social proof, slow load). Run CRO audit." });
  if (m && m.checkoutRatio < 40) attention.push({ type: "warn", metric: "Checkout Drop-off", value: `${m.checkoutRatio}%`, detail: "Customers add to cart but abandon before checkout — hidden shipping cost or limited payment options. Show total cost upfront." });
  if (sessions > 0 && s.totalOrders / sessions < 0.01) attention.push({ type: "warn", metric: "Site Conversion", value: `${convRate}%`, detail: "Very low site conversion — traffic is not converting. Review landing pages, page speed, and product-audience fit." });

  function buildSections() {
    if (!sales) return [];
    return [
      { title: "Performance KPIs", headers: ["Metric", "Value"], rows: [
        ["Gross Sales", formatINR(s.grossSales)], ["Total Orders", s.totalOrders], ["AOV", formatINR(s.aov)],
        ["New Customers", s.newCustomers], ["Returning Customers", s.returningCustomers],
        ["Prepaid Orders", s.prepaidOrders], ["COD Orders", s.codOrders], ["COD Rate", `${codPct}%`],
        ...(m ? [
          ["Meta Spend", formatINR(m.spend)] as [string,string], ["ROAS", `${m.roas}x`] as [string,string],
          ["CAC", formatINR(m.cac)] as [string,string], ["CTR", `${m.ctr}%`] as [string,string],
          ["CPC", formatINR(m.cpc)] as [string,string], ["ATC Ratio", `${m.atcRatio}%`] as [string,string],
          ["Checkout Ratio", `${m.checkoutRatio}%`] as [string,string],
        ] : []),
        ...(g ? [["Sessions", g.sessions] as [string,number], ["Bounce Rate", `${g.bounceRate.toFixed(1)}%`] as [string,string]] : []),
      ]},
      { title: "Channel Attribution", headers: ["Channel", "Orders", "Revenue", "Ad Spend", "ROAS"], rows: [
        ["Shopify Total", s.totalOrders, formatINR(s.grossSales), "—", "—"],
        ...(m ? [["Meta Ads", metaOrders, formatINR(m.purchaseValue), formatINR(m.spend), `${m.roas}x`] as (string|number)[]] : []),
        ["Organic / Direct", organicOrders, formatINR(organicRevenue), "—", "—"],
      ]},
      { title: "Payment Split", headers: ["Type", "Orders", "%"], rows: [["Prepaid", s.prepaidOrders, `${100 - codPct}%`], ["COD", s.codOrders, `${codPct}%`]] },
      ...(sales.allBySku?.length ? [{ title: "SKU Performance", headers: ["Product", "Qty", "Revenue"], rows: sales.allBySku.map(p => [p.name, p.qty, formatINR(p.revenue)]) as (string|number)[][] }] : []),
      ...(meta?.campaigns?.length ? [{ title: "Campaign Performance", headers: ["Campaign", "Status", "ROAS", "Spend", "Orders"], rows: meta.campaigns.map(c => [c.name, c.status, `${c.roas}x`, formatINR(c.spend), c.purchases]) as (string|number)[][] }] : []),
    ];
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center"><TrendingUp size={14} className="text-white" /></div>
            <h1 className="text-xl font-bold text-[#18181B] dark:text-[#F4F4F5]">Performance Marketing</h1>
          </div>
          <p className="text-[12px] text-[#A1A1AA] ml-9">{range.label} · Generated {generatedAt}</p>
        </div>
        <ExportButton
          onExportCSV={() => exportToCSV(`skylitee-performance-${range.from}`, buildSections())}
          onExportPDF={() => exportToPDF(`skylitee-performance-${range.from}`, "Performance Marketing Report", range.label, buildSections())}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Gross Sales", value: formatINR(s.grossSales), icon: <ShoppingCart size={13} className="text-[#F97316]" /> },
          { label: "Total Orders", value: s.totalOrders.toString(), icon: <ShoppingCart size={13} className="text-[#F97316]" /> },
          { label: "ROAS", value: m ? `${m.roas}x` : "—", icon: <Share2 size={13} className={m?.roas && m.roas >= 3 ? "text-[#22C55E]" : "text-[#EF4444]"} /> },
          { label: "Meta Spend", value: m ? formatINR(m.spend) : "—", icon: <Megaphone size={13} className="text-[#A1A1AA]" /> },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">{item.icon}<span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wide">{item.label}</span></div>
            <div className="text-[22px] font-black text-[#18181B] dark:text-[#F4F4F5]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="✅ What's Working" />
          <div className="space-y-2">{working.length === 0 ? <p className="text-[13px] text-[#A1A1AA]">Connect Meta Ads for performance signals.</p> : working.map((s, i) => <Signal key={i} type="good" {...s} />)}</div>
        </Card>
        <Card>
          <CardHeader title="⚠️ Needs Attention" />
          <div className="space-y-2">{attention.length === 0 ? <p className="text-[13px] text-[#A1A1AA]">No major issues detected.</p> : attention.map((s, i) => <Signal key={i} {...s} />)}</div>
        </Card>
      </div>

      {/* Channel breakdown */}
      <Card>
        <CardHeader title="Channel Attribution" right="Orders & Revenue by source" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-black/[0.06] dark:border-white/[0.06]">{["Channel","Orders","Revenue","Ad Spend","ROAS","CTR"].map(h => <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {[
                { ch: "Shopify Total", icon: <ShoppingCart size={10} className="text-[#F97316]" />, orders: s.totalOrders, revenue: formatINR(s.grossSales), spend: "—", roas: "—", ctr: "—" },
                ...(m ? [{ ch: "Meta Ads", icon: <Share2 size={10} className="text-[#1877F2]" />, orders: metaOrders, revenue: formatINR(m.purchaseValue), spend: formatINR(m.spend), roas: `${m.roas}x`, ctr: `${m.ctr}%` }] : []),
                { ch: "Organic/Direct", icon: <TrendingUp size={10} className="text-[#22C55E]" />, orders: organicOrders, revenue: formatINR(organicRevenue), spend: "—", roas: "—", ctr: "—" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                  <td className="py-2 px-2 font-semibold dark:text-[#F4F4F5]"><span className="flex items-center gap-1.5">{row.icon}{row.ch}</span></td>
                  <td className="py-2 px-2">{row.orders}</td>
                  <td className="py-2 px-2 font-semibold">{row.revenue}</td>
                  <td className="py-2 px-2 text-[#A1A1AA]">{row.spend}</td>
                  <td className="py-2 px-2">{row.roas === "—" ? <span className="text-[#A1A1AA]">—</span> : <span className={cn("font-bold", Number(row.roas) >= 3 ? "text-[#22C55E]" : Number(row.roas) >= 2 ? "text-[#EAB308]" : "text-[#EF4444]")}>{row.roas}</span>}</td>
                  <td className="py-2 px-2 text-[#A1A1AA]">{row.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Split + Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader title="Payment Split" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#FFF7ED] dark:bg-[#2A1A0E] rounded-xl p-3 text-center border border-[#FED7AA]">
              <div className="text-[28px] font-black text-[#F97316]">{s.prepaidOrders}</div>
              <div className="text-[11px] text-[#A1A1AA]">Prepaid</div>
              <div className="text-[13px] font-bold text-[#EA580C]">{100 - codPct}%</div>
            </div>
            <div className="bg-[#FFFBEB] dark:bg-[#2D1C00] rounded-xl p-3 text-center border border-[#FCD34D]">
              <div className="text-[28px] font-black text-[#EAB308]">{s.codOrders}</div>
              <div className="text-[11px] text-[#A1A1AA]">COD</div>
              <div className="text-[13px] font-bold text-[#92400E] dark:text-[#FCD34D]">{codPct}%</div>
            </div>
          </div>
          <div className="h-2 flex rounded-full overflow-hidden mb-3">
            <div className="bg-[#F97316]" style={{ width: `${100 - codPct}%` }} />
            <div className="bg-[#EAB308]" style={{ width: `${codPct}%` }} />
          </div>
          {codPct > 50 && <div className="bg-[#FFFBEB] dark:bg-[#2D1C00] border border-[#FCD34D] rounded-xl p-2.5 text-[11px] text-[#92400E] dark:text-[#FCD34D]">High COD ratio — offer Rs.75 prepaid discount to reduce RTO risk.</div>}
        </Card>

        {m && (
          <Card>
            <CardHeader title="Meta Funnel" right="Landing page → Purchase" />
            <div className="space-y-1.5">
              {[
                { label: "Clicks", value: m.clicks, color: "#6366F1", pct: 100 },
                { label: "Landing Page Views", value: m.clicks, color: "#F97316", pct: 80 },
                { label: "Add to Cart", value: m.atc, color: "#EAB308", pct: m.atcRatio },
                { label: "Checkout", value: m.checkout, color: "#F97316", pct: m.checkoutRatio },
                { label: "Purchases", value: m.purchases, color: "#22C55E", pct: m.purchaseRatio },
              ].map(step => (
                <div key={step.label} className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold dark:text-[#F4F4F5]">{step.label}</span>
                    <span className="text-[14px] font-black" style={{ color: step.color }}>{step.value.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-1.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${step.pct}%`, backgroundColor: step.color, opacity: 0.75 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Campaign table */}
      {meta?.campaigns && meta.campaigns.length > 0 && (
        <Card>
          <CardHeader title="Campaign Performance" right={`${meta.campaigns.length} campaigns`} />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-black/[0.06] dark:border-white/[0.06]">{["Campaign", "Status", "Spend", "ROAS", "Orders"].map(h => <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {meta.campaigns.sort((a, b) => b.roas - a.roas).map((c, i) => (
                  <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                    <td className="py-2 px-2 font-medium dark:text-[#F4F4F5] max-w-[200px]"><div className="truncate">{c.name}</div></td>
                    <td className="py-2 px-2"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", c.status === "ACTIVE" ? "bg-[#FFF7ED] text-[#EA580C]" : "bg-[#F5F5F4] text-[#71717A]")}>{c.status}</span></td>
                    <td className="py-2 px-2 font-semibold">{formatINR(c.spend)}</td>
                    <td className="py-2 px-2"><span className={cn("font-black", c.roas >= 3 ? "text-[#22C55E]" : c.roas >= 2 ? "text-[#EAB308]" : "text-[#EF4444]")}>{c.roas}x</span></td>
                    <td className="py-2 px-2">{c.purchases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
