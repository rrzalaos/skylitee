"use client";
import { useState, useEffect, useCallback } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { WarnBanner } from "@/components/ui/warn-banner";
import { formatINR } from "@/lib/utils";
import { useDateRange } from "@/lib/date-range-context";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ShopifyKpis {
  grossSales: number;
  totalOrders: number;
  aov: number;
  codOrders: number;
  prepaidOrders: number;
}

interface MetaKpis {
  spend: number;
  roas: number;
  cac: number;
  purchases: number;
}

export default function FinancialPage() {
  const { range } = useDateRange();
  const [cogs, setCogs] = useState(38);
  const [logistics, setLogistics] = useState(8);

  const [metaConnected, setMetaConnected] = useState(false);
  const [shopifyData, setShopifyData] = useState<ShopifyKpis | null>(null);
  const [metaData, setMetaData] = useState<MetaKpis | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shopifyRes, metaAccountRes] = await Promise.all([
        fetch(`/api/shopify/dashboard?from=${range.from}&to=${range.to}`),
        fetch("/api/meta/accounts"),
      ]);
      const shopifyJson = await shopifyRes.json();
      const metaAccountJson = await metaAccountRes.json();

      if (!shopifyJson.error) setShopifyData(shopifyJson.kpis);

      const connected = !metaAccountJson.error;
      setMetaConnected(connected);

      if (connected) {
        const metaRes = await fetch(`/api/meta?from=${range.from}&to=${range.to}`);
        const metaJson = await metaRes.json();
        if (!metaJson.error) setMetaData(metaJson.kpis);
      }
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  // ── Derived P&L figures ─────────────────────────────────────────────────────
  const grossRevenue = shopifyData?.grossSales ?? 0;
  const codPct = shopifyData
    ? shopifyData.totalOrders > 0
      ? shopifyData.codOrders / shopifyData.totalOrders
      : 0.45
    : 0.45;
  // Estimate returns as 15% of COD orders (COD return rate ~30%) + 2% prepaid
  const returnsEst = Math.round(grossRevenue * (codPct * 0.3 + (1 - codPct) * 0.02));
  const netRevenue = grossRevenue - returnsEst;
  const cogsAmt = Math.round(netRevenue * (cogs / 100));
  const grossProfit = netRevenue - cogsAmt;
  const adSpend = metaData?.spend ?? 0;
  const logisticsAmt = Math.round(grossRevenue * (logistics / 100));
  const platformFees = Math.round(grossRevenue * 0.02);
  const netContribution = grossProfit - adSpend - logisticsAmt - platformFees;

  const margin = (100 - cogs - logistics) / 100;
  const beRoas = margin > 0 ? (1 / margin).toFixed(2) : "∞";
  const currentRoas = metaData?.roas ?? 0;
  const isBelowBE = currentRoas > 0 && currentRoas < parseFloat(beRoas);
  const isUnknownRoas = !metaConnected || currentRoas === 0;

  // LTV/CAC
  const cac = metaData?.cac ?? 0;
  const aov = shopifyData?.aov ?? 0;
  const ltvEstimate = aov * 2;
  const ltvCac = cac > 0 ? +(ltvEstimate / cac).toFixed(2) : 0;

  const grossMarginPct = netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 100) : 0;

  if (loading) {
    return (
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Financial Dashboard</h2>
            <p className="text-[15px] text-[#686864] mt-0.5">P&L · unit economics · LTV · break-even analysis</p>
          </div>
        </div>
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading financial data…</div>
      </div>
    );
  }

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

      {!metaConnected && (
        <WarnBanner type="amber">
          <div>
            <span className="font-semibold">Meta Ads not connected — ad spend is ₹0 below.</span>
            {" "}Revenue and order data is real (Shopify). Connect Meta for an accurate P&L with real ad spend.
          </div>
        </WarnBanner>
      )}

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard
          label="Gross Revenue"
          value={formatINR(grossRevenue)}
          sub={`${shopifyData?.totalOrders ?? 0} orders`}
        />
        <KPICard
          label="Gross Margin"
          value={`${grossMarginPct}%`}
          sub={`After COGS est. ${formatINR(cogsAmt)}`}
        />
        <KPICard
          label="Net Contribution"
          value={formatINR(netContribution)}
          sub={netContribution < 0 ? "Currently unprofitable" : "Profitable"}
        />
        <KPICard
          label="LTV:CAC Ratio"
          value={ltvCac > 0 ? `${ltvCac}×` : "—"}
          sub={ltvCac > 0 && ltvCac < 3 ? "Below 3× benchmark" : ltvCac >= 3 ? "Above 3× benchmark" : "Connect Meta for CAC"}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="P&L statement" right={`${range.from} to ${range.to}`} />
          {[
            { label: "Gross revenue", value: grossRevenue, positive: true },
            { label: `↳ Returns est. (COD ${Math.round(codPct * 100)}%)`, value: -returnsEst, positive: false, sub: true },
            { label: "Net revenue", value: netRevenue, positive: true, bold: true },
            { label: `↳ COGS est. (${cogs}%)`, value: -cogsAmt, positive: false, sub: true },
            { label: "Gross profit", value: grossProfit, positive: true, bold: true },
            { label: "↳ Meta ad spend", value: -adSpend, positive: false, sub: true, muted: !metaConnected },
            { label: `↳ Logistics / COD fees (${logistics}%)`, value: -logisticsAmt, positive: false, sub: true },
            { label: "↳ Platform fees (2%)", value: -platformFees, positive: false, sub: true },
            { label: "Net contribution", value: netContribution, positive: netContribution >= 0, bold: true, large: true },
          ].map((row, i) => (
            <div key={i} className={`flex justify-between items-center py-1.5 border-b border-black/[0.06] last:border-0 ${row.large ? "border-t border-black/[0.09] pt-2" : ""}`}>
              <span className={`text-[14px] ${row.sub ? "pl-3 text-[#686864] text-[13px]" : ""} ${row.bold ? "font-semibold" : ""}`}>
                {row.label}
                {row.muted && <span className="ml-1.5 text-[11px] text-[#9e9e9a]">(not connected)</span>}
              </span>
              <span className={`text-[14px] font-medium ${row.positive ? "text-[#0d6b4f]" : "text-[#d94040]"} ${row.bold ? "font-semibold" : ""} ${row.large ? "text-[16px]" : ""}`}>
                {row.value < 0 ? "−" : ""}{formatINR(Math.abs(row.value))}
              </span>
            </div>
          ))}
          {netContribution < 0 && adSpend > 0 && (
            <WarnBanner type="red">
              Ad spend exceeds gross profit. Need ROAS ≥{beRoas} to break even. Current: {currentRoas > 0 ? `${currentRoas}×` : "—"}
            </WarnBanner>
          )}
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
              <div className={`text-2xl font-semibold mt-0.5 ${isUnknownRoas ? "text-[#181816]" : isBelowBE ? "text-[#d94040]" : "text-[#0d6b4f]"}`}>
                {beRoas}
              </div>
              <div className="text-[13px] text-[#9e9e9a] mt-0.5">
                {isUnknownRoas
                  ? "Connect Meta to compare with your current ROAS"
                  : isBelowBE
                    ? `Current ROAS ${currentRoas}× is below break-even`
                    : `Current ROAS ${currentRoas}× is above break-even`}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Unit economics" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "CAC (Meta)", value: cac > 0 ? formatINR(cac) : "—" },
                { label: "AOV", value: aov > 0 ? formatINR(aov) : "—" },
                { label: "Est. LTV (2×)", value: ltvEstimate > 0 ? formatINR(ltvEstimate) : "—" },
                { label: "LTV:CAC", value: ltvCac > 0 ? `${ltvCac}×` : "—" },
              ].map(s => (
                <div key={s.label} className="text-center p-2.5 bg-[#f7f7f5] rounded-lg">
                  <div className="text-lg font-semibold text-[#181816]">{s.value}</div>
                  <div className="text-[15px] text-[#686864] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {ltvCac > 0 && ltvCac < 3 && (
              <InsightCard
                type="warning"
                title={`LTV:CAC ${ltvCac}× below healthy 3× benchmark`}
                body="Build email nurture + loyalty program to increase repeat purchase rate. Each 10% improvement in repeat rate raises LTV significantly."
              />
            )}
            {ltvCac >= 3 && (
              <InsightCard
                title={`Strong LTV:CAC ${ltvCac}× — above 3× benchmark`}
                body="Your customer economics are healthy. Focus on scaling acquisition while maintaining this LTV:CAC ratio."
              />
            )}
            {!metaConnected && (
              <InsightCard
                type="warning"
                title="Connect Meta to see real CAC and LTV:CAC"
                body="CAC and ROAS require Meta Ads data. Connect Meta in Settings → Connections."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
