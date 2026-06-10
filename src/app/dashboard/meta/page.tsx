"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Share2, ArrowDown, MousePointerClick, MonitorSmartphone, ShoppingCart, CreditCard, PackageCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToPDF } from "@/lib/export";
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

const FUNNEL_COLORS = ["#FB923C", "#F97316", "#EA580C", "#DC2626", "#16A34A"];

function ConversionFunnel({ k, cur }: { k: MetaKPIs; cur: string }) {
  const stages = [
    { label: "Ad Clicks", desc: "Clicked your ad", count: k.clicks, value: 0, Icon: MousePointerClick },
    { label: "Visited Site", desc: "Landing page loaded", count: k.lpv, value: 0, Icon: MonitorSmartphone },
    { label: "Add to Cart", desc: "Added a product", count: k.atc, value: k.atcValue, Icon: ShoppingCart },
    { label: "Reached Checkout", desc: "Started checkout", count: k.checkout, value: k.checkoutValue, Icon: CreditCard },
    { label: "Purchased", desc: "Completed the order", count: k.purchases, value: k.purchaseValue, Icon: PackageCheck },
  ];
  const top = Math.max(stages[0].count, 1);
  // sqrt scale keeps the tiny end-stages visible while the funnel still narrows clearly
  const barWidth = (c: number) => `${Math.max(Math.sqrt(c / top) * 100, 14)}%`;

  return (
    <div>
      {/* Plain-language summary */}
      <p className="text-[13px] text-[#52525B] dark:text-[#A1A1AA] mb-4 leading-relaxed">
        Of <b className="text-[#18181B] dark:text-[#F4F4F5]">{stages[0].count.toLocaleString("en-IN")}</b> people who clicked your ad,{" "}
        <b className="text-[#16A34A]">{k.purchases.toLocaleString("en-IN")}</b> completed a purchase{" "}
        <b className="text-[#18181B] dark:text-[#F4F4F5]">({k.conversionRatio}%)</b>. Each step shows how many continued and how many dropped off.
      </p>

      <div className="space-y-0">
        {stages.map((s, i) => {
          const pctOfTop = (s.count / top) * 100;
          const prev = i > 0 ? stages[i - 1].count : null;
          const continued = prev !== null ? (s.count / Math.max(prev, 1)) * 100 : null;
          const dropped = prev !== null ? Math.max(prev - s.count, 0) : 0;
          const Icon = s.Icon;
          return (
            <div key={s.label}>
              {/* Drop-off connector */}
              {continued !== null && (
                <div className="flex items-center gap-2 pl-9 py-1.5 text-[11px]">
                  <ArrowDown size={13} className="text-[#A1A1AA] shrink-0" />
                  <span className={cn("font-bold",
                    continued >= 50 ? "text-[#16A34A]" : continued >= 20 ? "text-[#EA580C]" : "text-[#DC2626]"
                  )}>{continued.toFixed(1)}% continued</span>
                  <span className="text-[#D4D4D4] dark:text-[#525252]">·</span>
                  <span className="text-[#A1A1AA]">{dropped.toLocaleString("en-IN")} dropped off</span>
                </div>
              )}
              {/* Stage row */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${FUNNEL_COLORS[i]}1A` }}>
                  <Icon size={15} style={{ color: FUNNEL_COLORS[i] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="min-w-0 truncate">
                      <span className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{s.label}</span>
                      <span className="text-[11px] text-[#A1A1AA] ml-2 hidden sm:inline">{s.desc}</span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0">
                      {s.value > 0 && (
                        <span className="text-[11px] text-[#EA580C] dark:text-[#FB923C] font-semibold">{cur}{s.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      )}
                      <span className="text-[17px] font-black text-[#18181B] dark:text-[#F4F4F5] tabular-nums">{s.count.toLocaleString("en-IN")}</span>
                      <span className="text-[11px] text-[#A1A1AA] w-11 text-right">{pctOfTop.toFixed(pctOfTop < 1 ? 2 : 0)}%</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-[#F5F5F4] dark:bg-[#1C1C1C] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: barWidth(s.count), background: `linear-gradient(90deg, ${FUNNEL_COLORS[i]}, ${FUNNEL_COLORS[i]}bb)` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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

// Every benchmarked metric returns ONE verdict: a "strength" (at/above standard, why it
// works + how to keep it) or an "issue"/"risk"/"warning" (below standard, why it happened
// + how to fix). This guarantees the user always sees what's working AND what's not.
function buildDiagnosis(k: MetaKPIs): DiagInsight[] {
  const out: DiagInsight[] = [];

  // ── OVERALL: ROAS (avg 2x break-even, 3x good) ───────────────────────────
  if (k.roas >= 3.0) {
    out.push({ source: "overall", severity: "strength", title: `ROAS ${k.roas}x — profitable, above the 3x target`, body: `Every ₹1 spent returns ₹${k.roas}. This works because targeting, creative and offer are aligned. Scale carefully: raise budget 20–30% at a time and duplicate winning ad sets into lookalikes so you don't reset learning.` });
  } else if (k.roas >= 2.0) {
    out.push({ source: "overall", severity: "warning", title: `ROAS ${k.roas}x — okay but below the 3x target`, body: "You're past the 2x break-even guide but not in strong-profit territory. Why: one funnel stage is leaking value. Fix the weakest stage flagged below and shift budget to your best campaigns to push ROAS toward 3x." });
  } else {
    out.push({ source: "overall", severity: "risk", title: `ROAS ${k.roas}x — below the 2x minimum`, body: "You're spending more than you earn back. Why: usually a weak funnel stage (see below) or low-intent traffic. Pause the lowest-ROAS campaigns first, fix the biggest drop-off stage, and don't raise budgets until ROAS clears 2x." });
  }

  // ── META: CTR (avg 0.9%, 1.5% good) ──────────────────────────────────────
  if (k.ctr >= 1.5) {
    out.push({ source: "meta", severity: "strength", title: `CTR ${k.ctr}% — strong ad engagement`, body: "Above the 1.5% good mark (avg 0.9%). Your hook and creative are resonating. Keep this creative running and use it as the template for new variations." });
  } else if (k.ctr >= 0.9) {
    out.push({ source: "meta", severity: "warning", title: `CTR ${k.ctr}% — around the 0.9% average`, body: "At industry average but not standout. Test 2–3 new hooks/headlines and a different format (video vs image) to push CTR past 1.5% — that also lowers your CPC." });
  } else {
    out.push({ source: "meta", severity: "issue", title: `CTR ${k.ctr}% — ad not compelling enough`, body: "Below the 0.9% avg. People see the ad but don't click. Why: weak hook, unclear offer, or wrong audience. Fix: test new angles (problem-led hook, stronger headline, clearer offer like discount/bundle/free shipping) and a fresh creative format." });
  }

  // ── META: Frequency (1–3x healthy, >5x fatigue) ─────────────────────────
  if (k.frequency <= 3) {
    out.push({ source: "meta", severity: "strength", title: `Frequency ${k.frequency}x — healthy`, body: "Inside the safe 1–3x range, so the audience isn't being over-shown the same ad. No action needed — just watch it as you scale budget." });
  } else if (k.frequency <= 5) {
    out.push({ source: "meta", severity: "warning", title: `Frequency ${k.frequency}x — fatigue building`, body: "Approaching the >5x fatigue zone — the same people keep seeing the ad, which slowly raises CPM and drops CTR. Refresh creatives soon (new angle/format) or widen the audience." });
  } else {
    out.push({ source: "meta", severity: "risk", title: `Frequency ${k.frequency}x — severe ad fatigue`, body: "The audience has seen this ad too many times, inflating CPMs and killing CTR. Launch 2–3 fresh creatives now and expand targeting / lookalikes." });
  }

  // ── WEBSITE: Landing page rate (avg 65%) ─────────────────────────────────
  if (k.lpRatio >= 65) {
    out.push({ source: "website", severity: "strength", title: `Landing page rate ${k.lpRatio}% — clicks reach your page`, body: "Above the 65% avg, so the page loads fast and most clicks become real visits. Protect it: keep mobile load under 3s and keep the ad↔page message consistent." });
  } else if (k.lpRatio >= 45) {
    out.push({ source: "website", severity: "warning", title: `Landing page rate ${k.lpRatio}% — some clicks lost`, body: "Below the 65% avg. A chunk of clickers never see the page. Why: slow mobile load or a redirect. Fix: test page speed (target <3s) and remove pop-ups that block content on arrival." });
  } else {
    out.push({ source: "website", severity: "issue", title: `Landing page rate ${k.lpRatio}% — most clicks never load the page`, body: "Well below the 65% avg — often the biggest leak. Why: slow load, broken/redirecting link, or ad↔page mismatch. Fix: page speed first (<3s on mobile), verify the link works, and match the page headline to the ad promise." });
  }

  // ── WEBSITE: Add-to-cart rate (avg 7%, 12% strong) ──────────────────────
  if (k.atcRatio >= 12) {
    out.push({ source: "website", severity: "strength", title: `Add-to-cart rate ${k.atcRatio}% — product page converting well`, body: "Above the 12% strong mark (avg 7%). Your product page — offer clarity, photos, reviews — is doing its job. Reuse this page structure for new products." });
  } else if (k.atcRatio >= 7) {
    out.push({ source: "website", severity: "strength", title: `Add-to-cart rate ${k.atcRatio}% — above average`, body: "Above the 7% avg. The product page is turning visitors into carts. To push higher, add photo reviews and make the price/offer even clearer above the fold." });
  } else {
    out.push({ source: "website", severity: "issue", title: `Add-to-cart rate ${k.atcRatio}% — product page not converting`, body: "Below the 7% avg. Visitors land but don't add to cart — a product-page issue, not an ad issue. Fix: photo reviews, a crystal-clear offer (price, what's included), urgency (low stock), and an Add-to-Cart button visible without scrolling." });
  }

  // ── WEBSITE: Cart → checkout (avg 50%) ──────────────────────────────────
  if (k.checkoutRatio >= 50) {
    out.push({ source: "website", severity: "strength", title: `Cart → checkout ${k.checkoutRatio}% — low cart abandonment`, body: "Above the 50% avg. Shoppers who add to cart are moving to checkout — your shipping and trust signals are clear. Keep showing shipping cost + ETA early." });
  } else {
    out.push({ source: "website", severity: "issue", title: `Cart → checkout ${k.checkoutRatio}% — high cart abandonment`, body: "Below the 50% avg. Carts are abandoned before checkout. Why: surprise shipping fees, weak trust, or no COD. Fix: show shipping cost + ETA upfront, add trust badges, surface COD, and add a 1-hour cart-recovery WhatsApp/email." });
  }

  // ── WEBSITE: Checkout → purchase (avg 40%) ──────────────────────────────
  if (k.purchaseRatio >= 40) {
    out.push({ source: "website", severity: "strength", title: `Checkout → purchase ${k.purchaseRatio}% — payment step converting`, body: "Above the 40% avg. People who reach checkout are paying — your payment options and checkout trust are working. Keep UPI/COD/card all visible." });
  } else {
    out.push({ source: "website", severity: "issue", title: `Checkout → purchase ${k.purchaseRatio}% — drop-off at payment`, body: "Below the 40% avg. Customers reach checkout but don't pay. Why: limited payment options, surprise fees, or low trust. Fix: show UPI/COD/card/EMI clearly, display the delivery date, add payment-security badges, and remove fee surprises." });
  }

  // ── META: Video (only when there are video views) ───────────────────────
  if (k.videoViews3s > 0) {
    if (k.thumbStopRatio >= 25) {
      out.push({ source: "meta", severity: "strength", title: `Thumb-stop ${k.thumbStopRatio}% — strong opening hook`, body: "Above the 25% avg — your first 1–2s stop the scroll. Keep opening with the product/bold hook and replicate it in new videos." });
    } else {
      out.push({ source: "meta", severity: "issue", title: `Thumb-stop ${k.thumbStopRatio}% — weak opening hook`, body: "Below the 25% avg — people scroll past. Why: slow or unclear opening. Fix: make the first 1–2s grab attention — bold text overlay, show the product instantly, or open with a surprising visual/problem." });
    }
    if (k.holdRatio >= 15) {
      out.push({ source: "meta", severity: "strength", title: `Hold ratio ${k.holdRatio}% — viewers staying`, body: "Above the 15% avg — the video keeps attention. Maintain the tight pacing and get to the benefit early." });
    } else {
      out.push({ source: "meta", severity: "issue", title: `Hold ratio ${k.holdRatio}% — losing viewers fast`, body: "Below the 15% avg. You stop the scroll but lose them. Fix: get to the key benefit in under 5s, cut long intros, add subtitles, and show product proof earlier." });
    }
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

  function buildSections() {
    if (!data) return [];
    const objLabel = (raw: string) => OBJ_META[normalizeObj(raw)]?.label ?? raw;
    return [
      {
        title: "Meta Ads KPIs",
        headers: ["Metric", "Value"],
        rows: [
          ["Spend", fmtC(k.spend)],
          ["ROAS", `${k.roas}x`],
          ["CAC (Cost per acquisition)", fmtC(k.cac)],
          ["Purchases", k.purchases],
          ["Purchase Value", fmtC(k.purchaseValue)],
          ["Impressions", fmt(k.impressions)],
          ["Reach", fmt(k.reach)],
          ["Frequency", k.frequency.toFixed(2)],
          ["CPM", fmtC(k.cpm)],
          ["Clicks", fmt(k.clicks)],
          ["CTR", `${k.ctr}%`],
          ["CPC", fmtC(k.cpc)],
          ["Outbound Clicks", fmt(k.outboundClicks)],
          ["Outbound CTR", `${k.outboundCtr}%`],
          ["Landing Page Views", fmt(k.lpv)],
          ["LP View Ratio", `${k.lpRatio}%`],
          ["Add to Cart", fmt(k.atc)],
          ["ATC Value", fmtC(k.atcValue)],
          ["ATC Ratio", `${k.atcRatio}%`],
          ["Checkout Started", fmt(k.checkout)],
          ["Checkout Value", fmtC(k.checkoutValue)],
          ["Checkout Ratio", `${k.checkoutRatio}%`],
          ["Purchase Ratio", `${k.purchaseRatio}%`],
          ["Conversion Ratio", `${k.conversionRatio}%`],
          ...(hasVideo ? [
            ["Video Views (3s)", fmt(k.videoViews3s)] as [string, string],
            ["Thruplay", fmt(k.thruplay)] as [string, string],
            ["Thumb Stop Ratio", `${k.thumbStopRatio}%`] as [string, string],
            ["Hold Ratio", `${k.holdRatio}%`] as [string, string],
          ] : []),
        ],
      },
      {
        title: "Campaigns",
        headers: ["Campaign", "Status", "Objective", "Spend", "Impressions", "Clicks", "CTR", "CPC", "Orders", "Revenue", "ROAS"],
        rows: data.campaigns.map(c => [
          c.name, c.status, objLabel(c.objective),
          fmtC(c.spend), fmt(c.impressions), fmt(c.clicks),
          `${c.ctr}%`, fmtC(c.cpc), c.purchases, fmtC(c.purchaseValue), `${c.roas}x`,
        ]),
      },
      {
        title: "Daily Trend",
        headers: ["Date", "Spend", "Impressions", "Clicks", "Purchases", "Revenue"],
        rows: data.daily.map(d => [d.date, fmtC(d.spend), fmt(d.impressions), fmt(d.clicks), d.purchases, fmtC(d.purchaseValue)]),
      },
    ];
  }

  function handleExportCSV() { exportToCSV(`skylitee-meta-${range.from}`, buildSections()); }
  async function handleExportPDF() {
    if (!data) return;
    await exportToPDF(
      `skylitee-meta-${range.from}`,
      "Meta Ads Report",
      `${data.adAccountName} · ${data.period.from} → ${data.period.to}`,
      buildSections()
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5]">Meta Ads</h2>
          <p className="text-[13px] text-[#A1A1AA] mt-0.5">
            {data.adAccountName} · {data.period.from} → {data.period.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] text-[#EA580C] dark:text-[#FB923C] font-semibold bg-[#FFF7ED] dark:bg-[#2A1A0E] px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Live
          </span>
          <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
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
            {/* Visual funnel */}
            <div className="mb-4">
              <ConversionFunnel k={k} cur={cur} />
            </div>

            {/* Ratio summary bar — stage conversion vs industry benchmark */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
              {[
                { label: "LP Ratio", value: `${k.lpRatio}%`, avg: "Avg: 65%", good: k.lpRatio >= 65 },
                { label: "ATC Ratio", value: `${k.atcRatio}%`, avg: "Avg: 7%", good: k.atcRatio >= 7 },
                { label: "Checkout Ratio", value: `${k.checkoutRatio}%`, avg: "Avg: 50%", good: k.checkoutRatio >= 50 },
                { label: "Purchase Ratio", value: `${k.purchaseRatio}%`, avg: "Avg: 40%", good: k.purchaseRatio >= 40 },
              ].map(r => (
                <div key={r.label} className={cn("rounded-xl p-2.5 text-center border",
                  r.good
                    ? "bg-[#F0FDF4] border-[#BBF7D0] dark:bg-[#052E16] dark:border-[#14532D]"
                    : "bg-[#FEF2F2] border-[#FECACA] dark:bg-[#2D0A0A] dark:border-[#7F1D1D]"
                )}>
                  <div className="text-[11px] text-[#A1A1AA] font-medium mb-1">{r.label}</div>
                  <div className={cn("text-[16px] font-black", r.good ? "text-[#16A34A]" : "text-[#EF4444]")}>{r.value}</div>
                  <div className={cn("text-[10px] font-bold mt-0.5", r.good ? "text-[#16A34A]" : "text-[#EF4444]")}>
                    {r.good ? "✓ Good" : "↓ Below avg"}
                  </div>
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

          {/* What's working & what's not — vs industry benchmarks */}
          {(() => {
            const diag = buildDiagnosis(k);
            if (diag.length === 0) return null;
            const attention = diag.filter(d => d.severity !== "strength");
            const working = diag.filter(d => d.severity === "strength");
            return (
              <Card>
                <CardHeader title="What's Working & What's Not" right="vs D2C industry benchmarks" />
                {attention.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={14} className="text-[#EF4444]" />
                      <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5] uppercase tracking-wide">Needs attention</span>
                      <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] dark:bg-[#2D0A0A] px-1.5 py-0.5 rounded-full">{attention.length}</span>
                    </div>
                    <div className="space-y-2">
                      {attention.map((ins, i) => <DiagCard key={i} insight={ins} />)}
                    </div>
                  </div>
                )}
                {working.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} className="text-[#22C55E]" />
                      <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5] uppercase tracking-wide">What's working</span>
                      <span className="text-[11px] font-bold text-[#15803D] bg-[#F0FDF4] dark:bg-[#052E16] px-1.5 py-0.5 rounded-full">{working.length}</span>
                    </div>
                    <div className="space-y-2">
                      {working.map((ins, i) => <DiagCard key={i} insight={ins} />)}
                    </div>
                  </div>
                )}
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
