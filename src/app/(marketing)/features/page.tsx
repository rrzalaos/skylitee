import Link from "next/link";
import { ShoppingBag, Target, Search, BarChart2, Users, Map, TrendingUp, Zap, MessageSquare, DollarSign, Bell, Calendar, Check } from "lucide-react";

export const metadata = { title: "Features — Skylitee" };

const sections = [
  {
    platform: "Shopify",
    tagColor: "#96BF48",
    tagBg: "#96BF4812",
    darkBg: false,
    headline: "Your store. Fully visible.",
    sub: "Everything happening in your Shopify store — in one view. No exports, no guessing.",
    features: [
      { icon: BarChart2, title: "Sales Dashboard", desc: "Revenue, orders, AOV, refunds and daily trends vs previous period." },
      { icon: ShoppingBag, title: "Product Analytics", desc: "Top sellers, low-stock alerts, SKU-level revenue and return rates." },
      { icon: Users, title: "Customer Segments", desc: "New vs returning, LTV distribution, and customer city breakdown." },
      { icon: Map, title: "Geo Reports", desc: "Top cities and states by order count and revenue across India." },
      { icon: TrendingUp, title: "Cohort Retention", desc: "Month-by-month matrix showing which cohorts stick and rebuy." },
      { icon: Bell, title: "Anomaly Alerts", desc: "Automatic alerts when revenue, orders or ROAS moves unusually." },
    ],
  },
  {
    platform: "Meta Ads",
    tagColor: "#1877F2",
    tagBg: "#1877F212",
    darkBg: true,
    headline: "Run Meta like you know what's working.",
    sub: "Campaign-level data, creative performance and rule-based funnel diagnosis — all without opening Ads Manager.",
    features: [
      { icon: Target, title: "Campaign Performance", desc: "ROAS, CAC, CTR, CPC, frequency, spend and purchases in one row." },
      { icon: Zap, title: "Funnel Diagnosis", desc: "Rule-based AI flags where your funnel is leaking — clicks, ATC or checkout." },
      { icon: BarChart2, title: "Placement Analysis", desc: "Feed vs Reels vs Stories — which placement earns your spend back." },
      { icon: ShoppingBag, title: "Creative Performance", desc: "Compare ads by ROAS, CTR, thumb-stop ratio and cost per click." },
      { icon: Calendar, title: "Timing Report", desc: "Best hours and days of the week to maximize ad return." },
      { icon: TrendingUp, title: "Spend Trends", desc: "Daily and weekly spend vs ROAS trend to catch budget waste early." },
    ],
  },
  {
    platform: "Google",
    tagColor: "#4285F4",
    tagBg: "#4285F412",
    darkBg: false,
    headline: "GSC + GA4 — finally in one place.",
    sub: "Stop flipping between Search Console and Analytics. See rankings, traffic, ecommerce funnel and audience — all together.",
    features: [
      { icon: Search, title: "Search Console", desc: "Top keywords, impressions, clicks, CTR and average ranking position." },
      { icon: BarChart2, title: "GA4 Traffic", desc: "Sessions, users, channels, bounce rate and session duration trends." },
      { icon: TrendingUp, title: "Ecommerce Funnel", desc: "View → Add to Cart → Checkout → Purchase funnel from GA4 events." },
      { icon: Map, title: "Audience & Geo", desc: "New vs returning users, cities, regions, device and browser." },
      { icon: ShoppingBag, title: "Landing Pages", desc: "Which landing pages drive the most sessions and lowest bounce." },
      { icon: Users, title: "Channel Attribution", desc: "Organic vs paid vs direct vs referral — where your traffic comes from." },
    ],
  },
  {
    platform: "AI & Insights",
    tagColor: "#F97316",
    tagBg: "#F9731612",
    darkBg: true,
    headline: "Your brand's analyst. No salary required.",
    sub: "AI insights generated from your real store data, a P&L calculator, and a goals tracker — all in one plan.",
    features: [
      { icon: Zap, title: "AI Insights", desc: "3 data-driven insights generated daily from your real store metrics." },
      { icon: MessageSquare, title: "AI Chat Assistant", desc: "Ask anything about your store in plain English. Get a real answer." },
      { icon: DollarSign, title: "Financial P&L", desc: "Real P&L with COGS, shipping, RTO, gateway fees and break-even ROAS." },
      { icon: Target, title: "Goals Tracker", desc: "Set revenue, ROAS and AOV targets. Track live pace with smart suggestions." },
      { icon: Bell, title: "Weekly Digest", desc: "A weekly email summarising your store's performance and key changes." },
      { icon: BarChart2, title: "Attribution Dashboard", desc: "Cross-platform view of which channel drives the most revenue." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-20 sm:py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">Everything included</div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-tight mb-4">
            All features.<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              One plan.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[#71717A] max-w-xl mx-auto mb-8">
            No tiers. No feature gating. Every single thing Skylitee does is in Skylitee Pro at $29/mo.
          </p>
          <Link href="/install" className="inline-block px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_24px_rgba(249,115,22,0.4)] hover:shadow-[0_0_36px_rgba(249,115,22,0.6)]">
            Start 14-day free trial →
          </Link>
        </div>
      </section>

      {/* Platform sections */}
      {sections.map((s) => (
        <section key={s.platform} className={`py-16 sm:py-20 px-4 ${s.darkBg ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold mb-4 border"
                style={{ background: s.darkBg ? `${s.tagColor}15` : s.tagBg, color: s.tagColor, borderColor: `${s.tagColor}30` }}>
                {s.platform}
              </div>
              <h2 className={`text-[28px] sm:text-[34px] font-black mb-3 ${s.darkBg ? "text-white" : "text-[#18181B]"}`}>{s.headline}</h2>
              <p className="text-[17px] sm:text-[18px] leading-relaxed max-w-xl text-[#71717A]">{s.sub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.features.map(f => (
                <div key={f.title}
                  className={`rounded-2xl p-5 sm:p-6 border transition-all group hover:-translate-y-0.5 ${
                    s.darkBg
                      ? "bg-white/[0.03] border-white/[0.07] hover:border-[#F97316]/30 hover:bg-white/[0.05]"
                      : "bg-white border-black/[0.06] hover:border-[#F97316]/30 hover:shadow-lg"
                  }`}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${s.tagColor}15`, border: `1px solid ${s.tagColor}25` }}>
                    <f.icon size={19} style={{ color: s.tagColor }} />
                  </div>
                  <div className={`text-[16px] font-bold mb-2 ${s.darkBg ? "text-white" : "text-[#18181B]"}`}>{f.title}</div>
                  <div className="text-[15px] leading-relaxed text-[#71717A]">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* What's included summary */}
      <section className="py-16 sm:py-20 px-4 bg-[#F5F5F4]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">What you get</div>
            <h2 className="text-[28px] sm:text-[34px] font-black text-[#18181B]">Full access. Day one.</h2>
          </div>
          <div className="rounded-2xl bg-white border border-[#F97316]/20 shadow-[0_0_0_1px_rgba(249,115,22,0.1),0_12px_40px_rgba(249,115,22,0.08)] p-7 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                "Shopify sales, orders & revenue",
                "Meta Ads ROAS, CAC, CTR & creatives",
                "Google Search Console keywords",
                "Google Analytics 4 traffic & funnel",
                "AI daily insights from real data",
                "AI chat assistant for your store",
                "Financial P&L calculator",
                "Goals tracker with live pace",
                "Cohort retention analysis",
                "Geo report by city & state",
                "Anomaly alerts",
                "Weekly performance digest",
              ].map(feat => (
                <div key={feat} className="flex items-center gap-3 text-[15px] text-[#52525B]">
                  <div className="w-5 h-5 rounded-full bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-[#22C55E]" />
                  </div>
                  {feat}
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-black/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[24px] font-black text-[#18181B]">$29<span className="text-[15px] font-normal text-[#A1A1AA]">/month</span></div>
                <div className="text-[14px] text-[#22C55E] font-semibold">14-day free trial — no credit card</div>
              </div>
              <Link href="/install" className="px-7 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[15px] transition-all shadow-[0_0_16px_rgba(249,115,22,0.3)]">
                Start free trial →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
