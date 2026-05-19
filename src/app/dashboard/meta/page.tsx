"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Share2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDateRange } from "@/lib/date-range-context";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface MetaKPIs {
  spend: number; roas: number; cac: number; purchases: number; purchaseValue: number;
  impressions: number; reach: number; frequency: number; cpm: number;
  clicks: number; ctr: number; cpc: number; outboundClicks: number; outboundCtr: number;
  lpv: number; lpRatio: number;
  atc: number; atcValue: number; atcRatio: number;
  checkout: number; checkoutValue: number; checkoutRatio: number;
  purchaseRatio: number; conversionRatio: number;
  videoViews3s: number; thruplay: number; thumbStopRatio: number; holdRatio: number;
}

interface MetaData {
  adAccountName: string;
  currency: string;
  period: { from: string; to: string };
  kpis: MetaKPIs;
  campaigns: {
    id: string; name: string; status: string; objective: string;
    spend: number; impressions: number; clicks: number; ctr: number;
    cpc: number; cpm: number; purchases: number; purchaseValue: number; roas: number; atc: number;
  }[];
  daily: { date: string; spend: number; impressions: number; clicks: number; purchases: number; purchaseValue: number }[];
}

type Tab = "overview" | "campaigns";
type ObjFilter = "ALL" | "SALES" | "TRAFFIC" | "AWARENESS" | "ENGAGEMENT" | "LEADS" | "APP" | "OTHER";

function normalizeObj(raw: string): ObjFilter {
  const r = (raw ?? "").toUpperCase();
  if (r.includes("SALES") || r.includes("CONVERSIONS")) return "SALES";
  if (r.includes("TRAFFIC") || r.includes("LINK_CLICKS")) return "TRAFFIC";
  if (r.includes("AWARENESS") || r.includes("REACH") || r.includes("BRAND")) return "AWARENESS";
  if (r.includes("ENGAGEMENT")) return "ENGAGEMENT";
  if (r.includes("LEAD")) return "LEADS";
  if (r.includes("APP")) return "APP";
  return "OTHER";
}

const OBJ_META: Record<ObjFilter, { label: string; chip: string; badge: string }> = {
  ALL:         { label: "All",         chip: "bg-[#F5F5F4] text-[#52525B] border-[#E5E5E5]",         badge: "bg-[#F5F5F4] text-[#52525B]" },
  SALES:       { label: "Sales",       chip: "bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]",         badge: "bg-[#FFF7ED] text-[#EA580C]" },
  TRAFFIC:     { label: "Traffic",     chip: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",         badge: "bg-[#EFF6FF] text-[#1D4ED8]" },
  AWARENESS:   { label: "Awareness",   chip: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",         badge: "bg-[#F5F3FF] text-[#7C3AED]" },
  ENGAGEMENT:  { label: "Engagement",  chip: "bg-[#FDF2F8] text-[#BE185D] border-[#FBCFE8]",         badge: "bg-[#FDF2F8] text-[#BE185D]" },
  LEADS:       { label: "Leads",       chip: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",         badge: "bg-[#F0FDF4] text-[#15803D]" },
  APP:         { label: "App",         chip: "bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]",         badge: "bg-[#F0FDFA] text-[#0F766E]" },
  OTHER:       { label: "Other",       chip: "bg-[#F5F5F4] text-[#71717A] border-[#E5E5E5]",         badge: "bg-[#F5F5F4] text-[#71717A]" },
};

const statusBadge = (s: string) => {
  if (s === "ACTIVE") return "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]";
  if (s === "PAUSED") return "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]";
  return "bg-[#F5F5F4] text-[#71717A] dark:bg-[#262626] dark:text-[#A1A1AA]";
};

function bench(value: number, avg: number, good: number, higherIsBetter = true): { change: number; changeLabel: string } {
  const isGood = higherIsBetter ? value >= good : value <= good;
  const isAvg = higherIsBetter ? value >= avg : value <= avg;
  const avgLabel = `Avg: ${avg}`;
  if (isGood) return { change: 1, changeLabel: `Above avg · ${avgLabel}` };
  if (isAvg) return { change: 1, changeLabel: `At avg · ${avgLabel}` };
  return { change: -1, changeLabel: `Below avg · ${avgLabel}` };
}

function FunnelStep({ label, count, value, ratio, ratioLabel, cur }: {
  label: string; count: number; value?: number; ratio?: number; ratioLabel?: string; cur: string;
}) {
  return (
    <div className="flex flex-col items-center text-center min-w-0 flex-1">
      <div className="text-[11px] text-[#A1A1AA] font-semibold mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-[20px] font-black text-[#18181B] dark:text-[#F4F4F5]">{count.toLocaleString("en-IN")}</div>
      {value !== undefined && value > 0 && (
        <div className="text-[12px] text-[#EA580C] dark:text-[#FB923C] font-semibold">{cur}{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
      )}
      {ratio !== undefined && (
        <div className={cn("text-[11px] mt-0.5 px-1.5 py-0.5 rounded-full font-bold",
          ratio >= 60 ? "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]"
            : ratio >= 40 ? "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]"
            : "bg-[#FEF2F2] text-[#991B1B] dark:bg-[#2D0A0A] dark:text-[#FCA5A5]"
        )}>{ratio}% {ratioLabel}</div>
      )}
    </div>
  );
}

type DiagSource = "meta" | "website" | "overall";
type DiagSeverity = "issue" | "strength" | "risk" | "warning";
interface DiagInsight { source: DiagSource; severity: DiagSeverity; title: string; body: string }

const sourceLabel: Record<DiagSource, string> = { meta: "Meta Ad", website: "Website / Shopify", overall: "Overall" };
const sourceStyle: Record<DiagSource, string> = {
  meta: "bg-[#EFF6FF] text-[#1877F2] dark:bg-[#0D1E3D] dark:text-[#93C5FD]",
  website: "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]",
  overall: "bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#1E1240] dark:text-[#C4B5FD]",
};
const severityStyle: Record<DiagSeverity, { border: string; bg: string; label: string; labelText: string }> = {
  issue:    { border: "border-l-[#EF4444]", bg: "bg-[#FEF2F2] dark:bg-[#2D0A0A]", label: "ISSUE",    labelText: "text-[#DC2626] dark:text-[#FCA5A5]" },
  strength: { border: "border-l-[#22C55E]", bg: "bg-[#F0FDF4] dark:bg-[#052E16]", label: "GOOD",     labelText: "text-[#15803D] dark:text-[#86EFAC]" },
  risk:     { border: "border-l-[#EAB308]", bg: "bg-[#FFFBEB] dark:bg-[#2D1C00]", label: "RISK",     labelText: "text-[#92400E] dark:text-[#FCD34D]" },
  warning:  { border: "border-l-[#F97316]", bg: "bg-[#FFF7ED] dark:bg-[#2A1A0E]", label: "WATCH",    labelText: "text-[#EA580C] dark:text-[#FB923C]" },
};

function DiagCard({ insight }: { insight: DiagInsight }) {
  const s = severityStyle[insight.severity];
  return (
    <div className={cn("border-l-[3px] rounded-r-xl p-3", s.border, s.bg)}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={cn("text-[10px] font-black uppercase tracking-wider", s.labelText)}>{s.label}</span>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide", sourceStyle[insight.source])}>
          {sourceLabel[insight.source]}
        </span>
      </div>
      <div className="text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-0.5">{insight.title}</div>
      <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">{insight.body}</div>
    </div>
  );
}

function buildDiagnosis(k: MetaKPIs): DiagInsight[] {
  const out: DiagInsight[] = [];

  // ── ROAS ────────────────────────────────────────────────────────────────
  if (k.roas >= 3.0) {
    out.push({ source: "overall", severity: "strength", title: `ROAS ${k.roas}x — profitable spend`, body: "Above the 3x good threshold. Increase daily budget 20–30% incrementally and duplicate winning ad sets into lookalike audiences to scale without hurting ROAS." });
  } else if (k.roas < 2.0) {
    out.push({ source: "overall", severity: "risk", title: `ROAS ${k.roas}x — below the 2x minimum`, body: "You're not recovering ad spend. Pause the lowest-ROAS campaigns first, then fix the weakest funnel stage below. Don't increase budget until ROAS crosses 2x." });
  }

  // ── META SIDE: CTR ───────────────────────────────────────────────────────
  if (k.ctr < 0.9) {
    out.push({ source: "meta", severity: "issue", title: `CTR ${k.ctr}% — ad is not compelling enough`, body: "Below the 0.9% industry avg. People are seeing your ad but not clicking. Test 2–3 new ad copy angles: different hook, stronger headline, new offer framing (discount, bundle, free shipping). Also try a new creative format (video vs. image)." });
  } else if (k.ctr >= 1.5) {
    out.push({ source: "meta", severity: "strength", title: `CTR ${k.ctr}% — strong ad engagement`, body: "Above the 1.5% good threshold. Your ad creative is working. Focus budget on the campaigns driving this CTR and keep this creative active." });
  }

  // ── META SIDE: Frequency / Fatigue ──────────────────────────────────────
  if (k.frequency > 5) {
    out.push({ source: "meta", severity: "risk", title: `Frequency ${k.frequency}x — severe ad fatigue`, body: "Your audience has seen this ad too many times. Launch at least 2–3 fresh creatives immediately: new hook, UGC/testimonial format, or a different offer angle. Expand targeting to new audiences or lookalikes." });
  } else if (k.frequency > 3) {
    out.push({ source: "meta", severity: "warning", title: `Frequency ${k.frequency}x — creative fatigue building`, body: "Approaching the fatigue zone (>5x). Refresh creatives soon — try different visual styles, add a new ad angle, or introduce a seasonal/limited offer to re-engage the audience." });
  }

  // ── META SIDE: Video ────────────────────────────────────────────────────
  if (k.videoViews3s > 0 && k.thumbStopRatio < 25) {
    out.push({ source: "meta", severity: "issue", title: `Thumb Stop ${k.thumbStopRatio}% — weak opening hook`, body: "Below the 25% avg — people scroll past your video. The first 1–2 seconds must be more attention-grabbing: bold text overlay, show the product immediately, start with a surprising visual or a strong problem statement." });
  }
  if (k.videoViews3s > 0 && k.holdRatio < 15) {
    out.push({ source: "meta", severity: "issue", title: `Hold Ratio ${k.holdRatio}% — video losing viewers too fast`, body: "Below the 15% avg. You stop the scroll but lose them quickly. Keep the video tight: get to the key benefit in under 5 seconds, remove long intros, add subtitles, and show product proof earlier." });
  }

  // ── WEBSITE SIDE: LP Ratio (Click → LPV) ────────────────────────────────
  if (k.lpRatio < 65) {
    out.push({ source: "website", severity: "issue", title: `LP Ratio ${k.lpRatio}% — clicks not reaching your landing page`, body: "Below the 65% avg. Most people click your ad but never see your page. This is usually a page load speed issue (target <3s) or a mismatch — what your ad promises vs. what loads. Check: page speed, headline matches ad copy, no popup blocking content on arrival." });
  }

  // ── WEBSITE SIDE: ATC Ratio (LPV → ATC) ─────────────────────────────────
  if (k.atcRatio < 7) {
    out.push({ source: "website", severity: "issue", title: `ATC Ratio ${k.atcRatio}% — product page not converting`, body: "Below the 7% avg. Visitors land but don't add to cart — this is a Shopify/PDP issue, not an ad issue. Fix: add customer reviews with photos, make the offer crystal clear (price, what's included), create urgency (low stock, limited offer), and ensure the ATC button is visible without scrolling." });
  } else if (k.atcRatio >= 12) {
    out.push({ source: "website", severity: "strength", title: `ATC Ratio ${k.atcRatio}% — product page converting well`, body: "Above the 12% good threshold. Your PDP is doing its job. Protect these elements: the offer clarity, social proof, and page layout. Reapply the same structure to any new product pages." });
  }

  // ── WEBSITE SIDE: Checkout Ratio (ATC → Checkout) ───────────────────────
  if (k.checkoutRatio < 50) {
    out.push({ source: "website", severity: "issue", title: `Checkout Ratio ${k.checkoutRatio}% — high cart abandonment`, body: "Below the 50% avg. Customers add to cart but abandon before checkout. Fix: show shipping cost + ETA upfront (surprise fees are #1 reason for cart drop), add trust badges (secure payment, easy returns), offer COD prominently. Set up a cart abandonment WhatsApp/email sequence within 1 hour." });
  }

  // ── WEBSITE SIDE: Purchase Ratio (Checkout → Purchase) ──────────────────
  if (k.purchaseRatio < 40) {
    out.push({ source: "website", severity: "issue", title: `Purchase Ratio ${k.purchaseRatio}% — drop-off at payment`, body: "Below the 40% avg. Customers reach checkout but don't pay. Fix: show all payment options clearly (UPI, COD, card, EMI), display delivery date on checkout page, add trust signals (Razorpay/Stripe badge, 'easy returns' note), and eliminate shipping fee surprises." });
  }

  return out;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-[0.12em]">{children}</div>
      <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
    </div>
  );
}

export default function MetaPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [objFilter, setObjFilter] = useState<ObjFilter>("ALL");

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/meta?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected" || d.error === "token_expired") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  if (loading) return <div className="text-[14px] text-[#A1A1AA] py-16 text-center">Loading Meta Ads data…</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-[#0D1E3D] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE] dark:border-[#1E40AF]">
        <Share2 size={28} className="text-[#1877F2]" />
      </div>
      <h2 className="text-[16px] font-bold mb-1 text-[#18181B] dark:text-[#F4F4F5]">Meta Ads not connected</h2>
      <p className="text-[13px] text-[#71717A] mb-5">Connect to see campaign spend, impressions, clicks and ROAS.</p>
      <Link href="/dashboard/connections" className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[13px] font-semibold hover:bg-[#EA580C] transition-colors">
        Connect Meta Ads →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[14px] text-[#EF4444] py-8 text-center">Could not load Meta Ads data.</div>;

  const k = data.kpis;
  const cur = data.currency === "INR" ? "₹" : data.currency === "USD" ? "$" : data.currency + " ";
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const fmtC = (n: number) => `${cur}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const dailyFmt = data.daily.map(d => ({ ...d, label: d.date.slice(5) }));

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "campaigns", label: `Campaigns (${data.campaigns.length})` },
  ];

  const hasVideo = k.videoViews3s > 0 || k.thruplay > 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Meta Ads</h2>
          <p className="text-[13px] text-[#A1A1AA] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span className="text-[12px] text-[#EA580C] dark:text-[#FB923C] font-semibold bg-[#FFF7ED] dark:bg-[#2A1A0E] px-2.5 py-1 rounded-full">Live</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-black/[0.06] dark:border-white/[0.06] mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === t.key
                ? "border-[#F97316] text-[#F97316]"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {/* Core KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <KPICard label="Total Spend" value={fmtC(k.spend)} />
            <KPICard label="ROAS" value={`${k.roas}x`} {...bench(k.roas, 2.0, 3.0)} />
            <KPICard label="CAC" value={fmtC(k.cac)} sub="Cost per order" />
            <KPICard label="Total Orders" value={fmt(k.purchases)} />
            <KPICard label="Total Order Value" value={fmtC(k.purchaseValue)} />
          </div>

          {/* Reach & Delivery */}
          <div>
            <SectionLabel>Reach &amp; Delivery</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <KPICard label="Impressions" value={k.impressions >= 1000 ? `${(k.impressions / 1000).toFixed(1)}K` : fmt(k.impressions)} />
              <KPICard label="Reach" value={k.reach >= 1000 ? `${(k.reach / 1000).toFixed(1)}K` : fmt(k.reach)} />
              <KPICard label="Frequency" value={`${k.frequency}x`}
                {...bench(k.frequency, 3, 1, false)}
                changeLabel={k.frequency <= 3 ? "Healthy range" : k.frequency <= 5 ? "Approaching fatigue" : "Ad fatigue risk"} />
              <KPICard label="CPM" value={fmtC(k.cpm)} sub="Cost per 1,000 views" />
            </div>
          </div>

          {/* Click Performance */}
          <div>
            <SectionLabel>Click Performance</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <KPICard label="Clicks" value={fmt(k.clicks)} />
              <KPICard label="CTR" value={`${k.ctr}%`} {...bench(k.ctr, 0.9, 1.5)} />
              <KPICard label="CPC" value={fmtC(k.cpc)} />
              <KPICard label="Outbound Clicks" value={fmt(k.outboundClicks)}
                sub={k.outboundCtr > 0 ? `Outbound CTR: ${k.outboundCtr}%` : undefined} />
            </div>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader title="Conversion Funnel" right={<span className="text-[#F97316] font-semibold">CVR: {k.conversionRatio}%</span>} />
            {/* Funnel steps */}
            <div className="flex items-start gap-1 mb-4">
              <FunnelStep label="Outbound Clicks" count={k.outboundClicks} cur={cur} />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.lpRatio >= 65 ? "text-[#EA580C]" : k.lpRatio >= 45 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.lpRatio}%</div>
              </div>
              <FunnelStep label="Landing Page Views" count={k.lpv} cur={cur} ratio={k.lpRatio} ratioLabel="LP Rate" />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.atcRatio >= 12 ? "text-[#EA580C]" : k.atcRatio >= 5 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.atcRatio}%</div>
              </div>
              <FunnelStep label="Add to Cart" count={k.atc} value={k.atcValue} cur={cur} ratio={k.atcRatio} ratioLabel="ATC Rate" />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.checkoutRatio >= 60 ? "text-[#EA580C]" : k.checkoutRatio >= 40 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.checkoutRatio}%</div>
              </div>
              <FunnelStep label="Checkout" count={k.checkout} value={k.checkoutValue} cur={cur} ratio={k.checkoutRatio} ratioLabel="Chk Rate" />
              <div className="flex flex-col items-center justify-center mt-5 shrink-0">
                <ArrowRight size={12} className="text-[#D4D4D4] dark:text-[#525252]" />
                <div className={cn("text-[10px] font-bold mt-0.5",
                  k.purchaseRatio >= 50 ? "text-[#EA580C]" : k.purchaseRatio >= 30 ? "text-[#EAB308]" : "text-[#EF4444]"
                )}>{k.purchaseRatio}%</div>
              </div>
              <FunnelStep label="Purchase" count={k.purchases} value={k.purchaseValue} cur={cur} ratio={k.purchaseRatio} ratioLabel="Pur Rate" />
            </div>

            {/* Ratio summary bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
              {[
                { label: "LP Ratio", value: `${k.lpRatio}%`, avg: "Avg: 65%", good: k.lpRatio >= 65 },
                { label: "ATC Ratio", value: `${k.atcRatio}%`, avg: "Avg: 7%", good: k.atcRatio >= 7 },
                { label: "Checkout Ratio", value: `${k.checkoutRatio}%`, avg: "Avg: 50%", good: k.checkoutRatio >= 50 },
                { label: "Purchase Ratio", value: `${k.purchaseRatio}%`, avg: "Avg: 40%", good: k.purchaseRatio >= 40 },
              ].map(r => (
                <div key={r.label} className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5 text-center">
                  <div className="text-[11px] text-[#A1A1AA] font-medium mb-1">{r.label}</div>
                  <div className={cn("text-[16px] font-black", r.good ? "text-[#F97316]" : "text-[#EF4444]")}>{r.value}</div>
                  <div className="text-[11px] text-[#A1A1AA]">{r.avg}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Video metrics */}
          {hasVideo && (
            <div>
              <SectionLabel>Video Performance</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <KPICard label="Thumb Stop Ratio" value={`${k.thumbStopRatio}%`}
                  {...bench(k.thumbStopRatio, 25, 30)}
                  changeLabel={k.thumbStopRatio >= 30 ? "Strong hook" : k.thumbStopRatio >= 20 ? "Near avg · Avg: 25%" : "Weak hook · Avg: 25%"} />
                <KPICard label="Hold Ratio" value={`${k.holdRatio}%`}
                  {...bench(k.holdRatio, 15, 20)}
                  changeLabel={k.holdRatio >= 20 ? "Strong retention" : k.holdRatio >= 12 ? "Near avg · Avg: 15%" : "Drop-off risk"} />
                <KPICard label="3-Sec Video Views" value={fmt(k.videoViews3s)} sub="Stopped scrolling" />
                <KPICard label="ThruPlay" value={fmt(k.thruplay)} sub="Watched to end / 15s" />
              </div>
            </div>
          )}

          {/* Daily Performance chart */}
          {dailyFmt.length > 0 && (
            <Card>
              <CardHeader title="Daily Performance" right={`${data.period.from} → ${data.period.to}`} />
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyFmt} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                      formatter={(v, name) => [`${cur}${(v as number) ?? 0}`, name === "spend" ? "Spend" : "Revenue"]} />
                    <Legend formatter={(v) => v === "spend" ? "Spend" : "Revenue"} wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="spend" stroke="#94A3B8" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
                    <Area type="monotone" dataKey="purchaseValue" stroke="#F97316" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Funnel Diagnosis */}
          {(() => {
            const diag = buildDiagnosis(k);
            if (diag.length === 0) return null;
            return (
              <Card>
                <CardHeader title="Funnel Diagnosis" right="vs D2C industry benchmarks" />
                <div className="space-y-2">
                  {diag.map((ins, i) => <DiagCard key={i} insight={ins} />)}
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {tab === "campaigns" && (() => {
        // Build objective counts
        const objCounts = new Map<ObjFilter, number>();
        data.campaigns.forEach(c => {
          const o = normalizeObj(c.objective);
          objCounts.set(o, (objCounts.get(o) ?? 0) + 1);
        });
        const activeFilters: ObjFilter[] = ["ALL", ...Array.from(objCounts.keys()).sort()];
        const filtered = objFilter === "ALL" ? data.campaigns : data.campaigns.filter(c => normalizeObj(c.objective) === objFilter);

        // Column definitions per objective
        type CampaignRow = (typeof data.campaigns)[0];
        type Col = { label: string; render: (c: CampaignRow) => React.ReactNode };
        const salesCols: Col[] = [
          { label: "Spend",    render: c => <span className="font-semibold whitespace-nowrap">{cur}{c.spend.toLocaleString("en-IN")}</span> },
          { label: "ROAS",     render: c => <span className={cn("font-bold", c.roas >= 3 ? "text-[#F97316]" : c.roas >= 1 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>{c.roas > 0 ? `${c.roas}x` : "—"}</span> },
          { label: "Orders",   render: c => <span>{c.purchases > 0 ? c.purchases : "—"}</span> },
          { label: "Revenue",  render: c => <span className="whitespace-nowrap">{c.purchaseValue > 0 ? `${cur}${c.purchaseValue.toLocaleString("en-IN")}` : "—"}</span> },
          { label: "ATC",      render: c => <span>{c.atc > 0 ? c.atc : "—"}</span> },
          { label: "CTR",      render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.ctr}%</span> },
          { label: "CPC",      render: c => <span className="whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{cur}{c.cpc}</span> },
        ];
        const trafficCols: Col[] = [
          { label: "Spend",    render: c => <span className="font-semibold whitespace-nowrap">{cur}{c.spend.toLocaleString("en-IN")}</span> },
          { label: "Clicks",   render: c => <span>{c.clicks.toLocaleString("en-IN")}</span> },
          { label: "CTR",      render: c => <span className={cn("font-bold", c.ctr >= 1.5 ? "text-[#F97316]" : c.ctr >= 0.9 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>{c.ctr}%</span> },
          { label: "CPC",      render: c => <span className="whitespace-nowrap font-semibold">{cur}{c.cpc}</span> },
          { label: "Impressions", render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.impressions >= 1000 ? `${(c.impressions/1000).toFixed(1)}K` : c.impressions}</span> },
          { label: "CPM",      render: c => <span className="whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{cur}{c.cpm}</span> },
        ];
        const awareCols: Col[] = [
          { label: "Spend",       render: c => <span className="font-semibold whitespace-nowrap">{cur}{c.spend.toLocaleString("en-IN")}</span> },
          { label: "Impressions", render: c => <span className="font-bold">{c.impressions >= 1000 ? `${(c.impressions/1000).toFixed(1)}K` : c.impressions}</span> },
          { label: "CPM",         render: c => <span className="whitespace-nowrap font-semibold">{cur}{c.cpm}</span> },
          { label: "Clicks",      render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.clicks.toLocaleString("en-IN")}</span> },
          { label: "CTR",         render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.ctr}%</span> },
        ];
        const defaultCols: Col[] = [
          { label: "Spend",       render: c => <span className="font-semibold whitespace-nowrap">{cur}{c.spend.toLocaleString("en-IN")}</span> },
          { label: "Impressions", render: c => <span>{c.impressions >= 1000 ? `${(c.impressions/1000).toFixed(1)}K` : c.impressions}</span> },
          { label: "Clicks",      render: c => <span>{c.clicks.toLocaleString("en-IN")}</span> },
          { label: "CTR",         render: c => <span>{c.ctr}%</span> },
          { label: "CPC",         render: c => <span className="whitespace-nowrap">{cur}{c.cpc}</span> },
        ];
        const allCols: Col[] = [
          { label: "Spend",    render: c => <span className="font-semibold whitespace-nowrap">{cur}{c.spend.toLocaleString("en-IN")}</span> },
          { label: "ROAS",     render: c => <span className={cn("font-bold", c.roas >= 3 ? "text-[#F97316]" : c.roas >= 1 ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#EF4444]")}>{c.roas > 0 ? `${c.roas}x` : "—"}</span> },
          { label: "Orders",   render: c => <span>{c.purchases > 0 ? c.purchases : "—"}</span> },
          { label: "Impressions", render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.impressions >= 1000 ? `${(c.impressions/1000).toFixed(1)}K` : c.impressions}</span> },
          { label: "Clicks",   render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.clicks.toLocaleString("en-IN")}</span> },
          { label: "CTR",      render: c => <span className="text-[#71717A] dark:text-[#A1A1AA]">{c.ctr}%</span> },
          { label: "CPC",      render: c => <span className="whitespace-nowrap text-[#71717A] dark:text-[#A1A1AA]">{cur}{c.cpc}</span> },
        ];

        const cols =
          objFilter === "SALES"     ? salesCols :
          objFilter === "TRAFFIC"   ? trafficCols :
          objFilter === "AWARENESS" ? awareCols :
          objFilter === "ALL"       ? allCols :
          defaultCols;

        return (
          <Card>
            <CardHeader title={`Campaigns (${data.campaigns.length})`} right="From Meta Ads Manager" />

            {/* Objective filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map(f => {
                const m = OBJ_META[f];
                const count = f === "ALL" ? data.campaigns.length : (objCounts.get(f) ?? 0);
                const isActive = objFilter === f;
                return (
                  <button key={f} onClick={() => setObjFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition-all",
                      isActive
                        ? cn(m.chip, "shadow-sm ring-1 ring-current ring-offset-1")
                        : "bg-[#F5F5F4] dark:bg-[#1C1C1C] text-[#71717A] dark:text-[#A1A1AA] border-transparent hover:border-black/10 dark:hover:border-white/10"
                    )}>
                    {m.label} <span className="font-normal opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* KPI hint for selected objective */}
            {objFilter !== "ALL" && (
              <div className="mb-3 text-[12px] text-[#71717A] dark:text-[#A1A1AA] bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-lg px-3 py-2">
                {objFilter === "SALES"     && "Showing: Spend · ROAS · Orders · Revenue · ATC · CTR · CPC"}
                {objFilter === "TRAFFIC"   && "Showing: Spend · Clicks · CTR · CPC · Impressions · CPM"}
                {objFilter === "AWARENESS" && "Showing: Spend · Impressions · CPM · Clicks · CTR"}
                {objFilter === "ENGAGEMENT"&& "Showing: Spend · Impressions · Clicks · CTR · CPC"}
                {objFilter === "LEADS"     && "Showing: Spend · Impressions · Clicks · CTR · CPC"}
                {objFilter === "APP"       && "Showing: Spend · Impressions · Clicks · CTR · CPC"}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-[13px] text-[#A1A1AA] py-6 text-center">No {OBJ_META[objFilter].label.toLowerCase()} campaigns in this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                      <th className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Campaign</th>
                      <th className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Objective</th>
                      <th className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">Status</th>
                      {cols.map(col => (
                        <th key={col.label} className="text-left py-2 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const obj = normalizeObj(c.objective);
                      const objM = OBJ_META[obj];
                      return (
                        <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
                          <td className="py-2.5 px-2 max-w-[180px]">
                            <div className="font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{c.name}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap", objM.badge)}>{objM.label}</span>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-bold", statusBadge(c.status))}>{c.status}</span>
                          </td>
                          {cols.map(col => (
                            <td key={col.label} className="py-2.5 px-2">{col.render(c)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 text-[12px] text-[#A1A1AA] bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-2.5">
              {data.adAccountName} · Live from Meta Ads Manager
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
