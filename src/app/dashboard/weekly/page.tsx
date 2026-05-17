"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { FileText } from "lucide-react";
import { WarnBanner } from "@/components/ui/warn-banner";
import { formatINR } from "@/lib/utils";

interface MetaKpis {
  spend: number;
  roas: number;
  cac: number;
  purchases: number;
  purchaseValue: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  roas: number;
  purchases: number;
}

interface ShopifyKpis {
  grossSales: number;
  totalOrders: number;
  aov: number;
  newCustomers: number;
  returningCustomers: number;
}

function isoWeekBounds(offsetWeeks: number): { from: string; to: string } {
  const now = new Date();
  // Go to start of current week (Monday)
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7) + offsetWeeks * 7);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    from: monday.toISOString().split("T")[0],
    to: sunday.toISOString().split("T")[0],
  };
}

export default function WeeklyPage() {
  const [metaConnected, setMetaConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [thisWeekMeta, setThisWeekMeta] = useState<MetaKpis | null>(null);
  const [lastWeekMeta, setLastWeekMeta] = useState<MetaKpis | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [thisWeekShopify, setThisWeekShopify] = useState<ShopifyKpis | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [metaAccountRes, shopifyRes] = await Promise.all([
          fetch("/api/meta/accounts"),
          fetch(`/api/shopify/dashboard?from=${isoWeekBounds(0).from}&to=${isoWeekBounds(0).to}`),
        ]);

        const metaAccountJson = await metaAccountRes.json();
        const shopifyJson = await shopifyRes.json();
        if (!shopifyJson.error) setThisWeekShopify(shopifyJson.kpis);

        const connected = !metaAccountJson.error;
        setMetaConnected(connected);

        if (connected) {
          const thisW = isoWeekBounds(0);
          const lastW = isoWeekBounds(-1);
          const [thisRes, lastRes] = await Promise.all([
            fetch(`/api/meta?from=${thisW.from}&to=${thisW.to}`),
            fetch(`/api/meta?from=${lastW.from}&to=${lastW.to}`),
          ]);
          const [thisJson, lastJson] = await Promise.all([thisRes.json(), lastRes.json()]);
          if (!thisJson.error) {
            setThisWeekMeta(thisJson.kpis);
            setCampaigns((thisJson.campaigns ?? []).slice(0, 8));
          }
          if (!lastJson.error) setLastWeekMeta(lastJson.kpis);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) => formatINR(n);

  // Generate action items based on real data
  const actionItems: { color: string; title: string; sub: string }[] = [];

  // Always show Google Ads CTA
  actionItems.push({
    color: "bg-[#d94040]",
    title: "Connect Google Ads — capture intent-based buyers",
    sub: "Google Ads on your top GSC keywords could add significant revenue with higher intent traffic.",
  });

  if (metaConnected && campaigns.length > 0) {
    const zeroCampaigns = campaigns.filter(c => c.spend > 500 && c.roas === 0);
    const highRoasCampaigns = campaigns.filter(c => c.roas >= 1.5);

    if (zeroCampaigns.length > 0) {
      actionItems.push({
        color: "bg-[#d94040]",
        title: `Pause ${zeroCampaigns.length} campaign${zeroCampaigns.length > 1 ? "s" : ""} with zero conversions`,
        sub: `${zeroCampaigns.map(c => c.name).join(", ")} — spending without returns. Reallocate budget.`,
      });
    }

    if (highRoasCampaigns.length > 0) {
      const best = highRoasCampaigns[0];
      actionItems.push({
        color: "bg-[#e89820]",
        title: `Scale "${best.name}" — ROAS ${best.roas}×`,
        sub: `Top performer this week. Increase budget 20% every 3 days while ROAS stays above break-even.`,
      });
    }
  }

  if (thisWeekShopify) {
    const codPct = thisWeekShopify.totalOrders > 0
      ? Math.round(((thisWeekShopify.totalOrders - (thisWeekShopify.totalOrders - 0)) / thisWeekShopify.totalOrders) * 100)
      : 0;
    if (codPct > 50) {
      actionItems.push({
        color: "bg-[#3478d4]",
        title: "Launch prepaid incentive to reduce COD returns",
        sub: "Offer ₹50–75 discount on prepaid orders. Reduces return rate and improves net contribution.",
      });
    }
  }

  // Always add repeat customers CTA
  if ((thisWeekShopify?.returningCustomers ?? 0) > 0) {
    actionItems.push({
      color: "bg-[#3478d4]",
      title: "Nurture this week's repeat buyers",
      sub: `${thisWeekShopify?.returningCustomers ?? 0} returning customers ordered this week. Enrol in VIP / loyalty flow.`,
    });
  }

  const roasDelta = thisWeekMeta && lastWeekMeta && lastWeekMeta.roas > 0
    ? +(((thisWeekMeta.roas - lastWeekMeta.roas) / lastWeekMeta.roas) * 100).toFixed(1)
    : null;

  const spendDelta = thisWeekMeta && lastWeekMeta && lastWeekMeta.spend > 0
    ? +(((thisWeekMeta.spend - lastWeekMeta.spend) / lastWeekMeta.spend) * 100).toFixed(1)
    : null;

  const revenueDelta = thisWeekShopify && lastWeekMeta
    ? null // can't compare without last week shopify — skip
    : null;

  // Headline text
  const headline = (() => {
    if (!metaConnected || !thisWeekMeta) {
      return "Connect Meta Ads to see your weekly performance headline with real ROAS and spend data.";
    }
    if (thisWeekMeta.spend === 0 && thisWeekMeta.roas === 0) {
      return "No Meta ad spend recorded this week yet. Data updates as your ads run.";
    }
    const roasStr = thisWeekMeta.roas > 0 ? `ROAS ${thisWeekMeta.roas}×` : "no conversions tracked";
    const spendStr = fmt(thisWeekMeta.spend);
    const trendStr = roasDelta !== null
      ? roasDelta > 0 ? `ROAS up ${roasDelta}% vs last week.` : `ROAS down ${Math.abs(roasDelta)}% vs last week.`
      : "";
    return `${spendStr} spend this week, ${roasStr}. ${trendStr}`.trim();
  })();

  return (
    <div>
      {!metaConnected && !loading && (
        <WarnBanner type="amber">
          <span className="font-semibold">Meta Ads not connected</span> — campaign metrics below are sample data, not your real campaigns. Connect Meta in Settings → Connections.
        </WarnBanner>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Weekly Digest</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">
            {metaConnected ? "Shopify live + Meta live" : "Auto-generated · Shopify live + Meta estimated"}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
          <FileText size={12} /> PDF
        </button>
      </div>

      {loading ? (
        <div className="text-[15px] text-[#686864] py-12 text-center">Loading weekly data…</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            {/* Headline */}
            <div className="bg-[#e0f5ee] border border-[#9FE1CB] rounded-xl px-3.5 py-3 mb-2">
              <div className="text-[14px] font-semibold text-[#064d38] mb-1.5 flex items-center gap-1.5">✨ This week&apos;s headline</div>
              <div className="text-[15px] font-medium text-[#0d6b4f] leading-relaxed">
                {headline}
              </div>
            </div>

            {/* This week vs last week */}
            <Card className="mb-2">
              <CardHeader title="This week vs last week" />
              {metaConnected && thisWeekMeta ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Shopify Revenue",
                      value: thisWeekShopify ? fmt(thisWeekShopify.grossSales) : "—",
                      sub: `${thisWeekShopify?.totalOrders ?? 0} orders`,
                      color: "text-[#0d6b4f]",
                      bg: "bg-[#e0f5ee]",
                    },
                    {
                      label: "Meta Spend",
                      value: fmt(thisWeekMeta.spend),
                      sub: lastWeekMeta
                        ? spendDelta !== null
                          ? `${spendDelta > 0 ? "+" : ""}${spendDelta}% vs last week`
                          : "vs last week"
                        : "This week",
                      color: thisWeekMeta.spend > 0 ? "text-[#181816]" : "text-[#9e9e9a]",
                      bg: "bg-[#f7f7f5]",
                    },
                    {
                      label: "ROAS (this week)",
                      value: thisWeekMeta.roas > 0 ? `${thisWeekMeta.roas}×` : "—",
                      sub: roasDelta !== null
                        ? `${roasDelta > 0 ? "▲" : "▼"} ${Math.abs(roasDelta)}% vs last week`
                        : "vs last week",
                      color: thisWeekMeta.roas >= 1.5 ? "text-[#0d6b4f]" : thisWeekMeta.roas >= 1 ? "text-[#e89820]" : "text-[#d94040]",
                      bg: thisWeekMeta.roas >= 1.5 ? "bg-[#e0f5ee]" : thisWeekMeta.roas >= 1 ? "bg-[#fff3e0]" : "bg-[#fce8e8]",
                    },
                    {
                      label: "ROAS (last week)",
                      value: lastWeekMeta && lastWeekMeta.roas > 0 ? `${lastWeekMeta.roas}×` : "—",
                      sub: lastWeekMeta ? fmt(lastWeekMeta.spend) + " spend" : "No data",
                      color: (lastWeekMeta?.roas ?? 0) >= 1.5 ? "text-[#0d6b4f]" : "text-[#686864]",
                      bg: "bg-[#f7f7f5]",
                    },
                  ].map((s, i) => (
                    <div key={i} className={`text-center p-2.5 rounded-lg ${s.bg}`}>
                      <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
                      <div className="text-[13px] text-[#686864] mt-0.5">{s.label}</div>
                      <div className="text-[12px] text-[#9e9e9a]">{s.sub}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[15px] text-[#9e9e9a] py-4 text-center">
                  Connect Meta to see real week-over-week comparison.
                </div>
              )}
            </Card>

            {/* Campaigns this week */}
            {metaConnected && campaigns.length > 0 && (
              <Card>
                <CardHeader title="Campaigns this week" right={<span className="text-[13px] text-[#9e9e9a]">{campaigns.length} active</span>} />
                <div className="space-y-1.5">
                  {campaigns.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between text-[14px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === "ACTIVE" ? "bg-[#17a773]" : "bg-[#9e9e9a]"}`} />
                        <span className="text-[#686864] truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[#9e9e9a]">{fmt(c.spend)}</span>
                        <span className={`font-semibold ${c.roas >= 1.5 ? "text-[#0d6b4f]" : c.roas >= 1 ? "text-[#e89820]" : c.roas > 0 ? "text-[#d94040]" : "text-[#9e9e9a]"}`}>
                          {c.roas > 0 ? `${c.roas}×` : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div>
            {/* Action items */}
            <Card className="mb-2">
              <CardHeader
                title="This week&apos;s action items"
                right={<Badge variant="amber">{actionItems.length} priority tasks</Badge>}
              />
              {actionItems.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-[#f7f7f5] rounded-lg mb-1.5 last:mb-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-semibold shrink-0 ${a.color}`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#181816]">{a.title}</div>
                    <div className="text-[15px] text-[#686864] mt-0.5">{a.sub}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Forecast */}
            <Card>
              <CardHeader title="Next week forecast" />
              {metaConnected && thisWeekMeta ? (
                <>
                  <BarRow
                    label="Revenue"
                    pct={Math.min(Math.round((thisWeekShopify?.grossSales ?? 0) / 100000 * 100), 100)}
                    value={thisWeekShopify ? fmt(Math.round(thisWeekShopify.grossSales * 1.05)) : "—"}
                    color="green"
                  />
                  <BarRow
                    label="Ad Spend"
                    pct={Math.min(Math.round(thisWeekMeta.spend / 100000 * 100), 100)}
                    value={fmt(Math.round(thisWeekMeta.spend * 1.1))}
                    color="red"
                  />
                  <BarRow
                    label="Orders"
                    pct={Math.min(Math.round((thisWeekShopify?.totalOrders ?? 0) / 100 * 100), 100)}
                    value={String(Math.round((thisWeekShopify?.totalOrders ?? 0) * 1.05))}
                    color="blue"
                  />
                  <div className="mt-2 text-[13px] text-[#686864] bg-[#f7f7f5] rounded-lg px-2.5 py-1.5">
                    Forecast = +5% on this week&apos;s actuals (conservative estimate)
                  </div>
                </>
              ) : (
                <>
                  <BarRow label="Revenue" pct={72} value="Connect Meta for real forecast" color="green" />
                  <BarRow label="Ad Spend" pct={60} value="—" color="red" />
                  <BarRow label="Orders" pct={65} value="—" color="blue" />
                  <div className="mt-2 text-[13px] text-[#686864] bg-[#f7f7f5] rounded-lg px-2.5 py-1.5">
                    + Google Ads connected: add est. ₹18–22K on top of forecast
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
