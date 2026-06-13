import Link from "next/link";
import { BarChart2, Target, Search, TrendingUp, DollarSign, Users, Map, Zap, Calendar, ShoppingBag, Trophy, FileText } from "lucide-react";

export const metadata = { title: "Reports — Skylitee" };

const reports = [
  {
    icon: ShoppingBag,
    title: "Sales Report",
    desc: "Top products, top cities, COD vs prepaid split, discount usage, refund rate and payment methods.",
    tag: "Shopify", tagColor: "#4a7a1e", tagBg: "#96BF4810",
    mockup: [
      { label: "Top Product", value: "Shirt #3", color: "#96BF48" },
      { label: "COD Rate", value: "62%", color: "#F97316" },
      { label: "Refund Rate", value: "4.1%", color: "#EF4444" },
    ],
  },
  {
    icon: BarChart2,
    title: "Sales Analysis",
    desc: "Store vs Meta vs Google vs Organic — by day, week or month. Blended ROAS, weekday-vs-weekend, and best day to sell.",
    tag: "Analytics", tagColor: "#F97316", tagBg: "#F9731610",
    mockup: [
      { label: "Blended ROAS", value: "3.1×", color: "#22C55E" },
      { label: "Best day", value: "Saturday", color: "#F97316" },
      { label: "Organic share", value: "21%", color: "#3B82F6" },
    ],
  },
  {
    icon: Users,
    title: "Customer Report",
    desc: "New vs returning customers, LTV segments, customer acquisition trend and city-wise breakdown.",
    tag: "Shopify", tagColor: "#4a7a1e", tagBg: "#96BF4810",
    mockup: [
      { label: "New Customers", value: "189", color: "#22C55E" },
      { label: "Returning", value: "34%", color: "#3B82F6" },
      { label: "LTV (avg)", value: "₹2,840", color: "#F97316" },
    ],
  },
  {
    icon: TrendingUp,
    title: "Cohort Retention",
    desc: "Month-by-month retention matrix showing which months produce the most loyal customers who rebuy.",
    tag: "Shopify", tagColor: "#4a7a1e", tagBg: "#96BF4810",
    mockup: [
      { label: "Nov cohort M2", value: "38%", color: "#22C55E" },
      { label: "Best cohort", value: "Nov 2024", color: "#F97316" },
      { label: "Avg retention M1", value: "22%", color: "#3B82F6" },
    ],
  },
  {
    icon: Map,
    title: "Geo Report",
    desc: "Top states and cities by revenue, orders and average order value — across all of India.",
    tag: "Shopify", tagColor: "#4a7a1e", tagBg: "#96BF4810",
    mockup: [
      { label: "#1 City", value: "Mumbai", color: "#F97316" },
      { label: "#2 City", value: "Delhi", color: "#3B82F6" },
      { label: "Top State", value: "Maharashtra", color: "#22C55E" },
    ],
  },
  {
    icon: Target,
    title: "Meta Ads Report",
    desc: "Campaign-level ROAS, CAC, CTR, frequency, funnel diagnosis and creative performance — no Ads Manager needed.",
    tag: "Meta Ads", tagColor: "#1877F2", tagBg: "#1877F210",
    mockup: [
      { label: "ROAS", value: "4.1×", color: "#1877F2" },
      { label: "CAC", value: "₹312", color: "#8B5CF6" },
      { label: "CTR", value: "2.8%", color: "#22C55E" },
    ],
  },
  {
    icon: ShoppingBag,
    title: "Placement Report",
    desc: "Feed vs Reels vs Stories vs Audience Network — which placements actually earn your spend back.",
    tag: "Meta Ads", tagColor: "#1877F2", tagBg: "#1877F210",
    mockup: [
      { label: "Best placement", value: "Reels", color: "#1877F2" },
      { label: "Reels ROAS", value: "5.2×", color: "#22C55E" },
      { label: "Stories ROAS", value: "2.1×", color: "#EF4444" },
    ],
  },
  {
    icon: Calendar,
    title: "Timing Report",
    desc: "Hourly and day-of-week breakdown of ad ROAS, CTR and spend — so you know when to push budget.",
    tag: "Meta Ads", tagColor: "#1877F2", tagBg: "#1877F210",
    mockup: [
      { label: "Best hour", value: "8–10 PM", color: "#F97316" },
      { label: "Best day", value: "Friday", color: "#1877F2" },
      { label: "Worst day", value: "Tuesday", color: "#EF4444" },
    ],
  },
  {
    icon: Search,
    title: "GSC Report",
    desc: "Keywords, clicks, impressions, CTR, average position, top pages, devices and countries from Search Console.",
    tag: "Google", tagColor: "#EA4335", tagBg: "#EA433510",
    mockup: [
      { label: "Top keyword", value: "#3 rank", color: "#EA4335" },
      { label: "Total clicks", value: "1,842", color: "#3B82F6" },
      { label: "Avg CTR", value: "4.2%", color: "#F9AB00" },
    ],
  },
  {
    icon: BarChart2,
    title: "GA4 Report",
    desc: "Traffic channels, ecommerce funnel, landing page performance, audience segments and geo from Google Analytics.",
    tag: "Google", tagColor: "#4285F4", tagBg: "#4285F410",
    mockup: [
      { label: "Sessions", value: "4,210", color: "#4285F4" },
      { label: "Top channel", value: "Organic", color: "#22C55E" },
      { label: "Checkout rate", value: "3.8%", color: "#F97316" },
    ],
  },
  {
    icon: DollarSign,
    title: "Financial P&L",
    desc: "Real profit and loss — enter COGS, shipping, RTO rate, payment gateway fees. Get your actual break-even ROAS.",
    tag: "Analytics", tagColor: "#F97316", tagBg: "#F9731610",
    mockup: [
      { label: "Net Profit", value: "₹68K", color: "#22C55E" },
      { label: "Break-even ROAS", value: "2.4×", color: "#F97316" },
      { label: "RTO Loss", value: "₹8.2K", color: "#EF4444" },
    ],
  },
  {
    icon: Zap,
    title: "Goals Tracker",
    desc: "Set monthly sales, ROAS and AOV targets. Track live pace with last-month performance as a baseline suggestion.",
    tag: "Analytics", tagColor: "#F97316", tagBg: "#F9731610",
    mockup: [
      { label: "Revenue goal", value: "72% done", color: "#F97316" },
      { label: "ROAS goal", value: "✓ Hit", color: "#22C55E" },
      { label: "Days left", value: "11 days", color: "#3B82F6" },
    ],
  },
  {
    icon: Trophy,
    title: "Benchmarking",
    desc: "Your live metrics vs Indian D2C category averages — ROAS, CAC, CPM, AOV, COD and repeat rate — with a 90-day roadmap from your gaps.",
    tag: "Analytics", tagColor: "#F97316", tagBg: "#F9731610",
    mockup: [
      { label: "Your ROAS", value: "Top 30%", color: "#22C55E" },
      { label: "COD ratio", value: "Below avg", color: "#EF4444" },
      { label: "AOV rank", value: "Above avg", color: "#3B82F6" },
    ],
  },
  {
    icon: FileText,
    title: "Custom Report Builder",
    desc: "Pick the blocks you want, set a date range, add your logo and client name, and export a white-label PDF in seconds. Save templates to reuse.",
    tag: "Analytics", tagColor: "#F97316", tagBg: "#F9731610",
    mockup: [
      { label: "Output", value: "Branded PDF", color: "#F97316" },
      { label: "White-label", value: "Logo + name", color: "#8B5CF6" },
      { label: "Templates", value: "Reusable", color: "#22C55E" },
    ],
  },
];

export default function ReportsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-20 sm:py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">12+ Reports included</div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-tight mb-4">
            Every report your brand needs.<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              All in one plan.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[#71717A] max-w-xl mx-auto">
            Real data. No mock numbers. No spreadsheets. No tab-switching.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {/* Featured — Command Center */}
        <div className="mb-10">
          <div className="rounded-2xl bg-[#0A0A0A] border border-white/[0.08] p-7 sm:p-8 flex flex-col lg:flex-row gap-8 items-center shadow-[0_0_0_1px_rgba(249,115,22,0.15),0_20px_60px_rgba(0,0,0,0.4)]">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold mb-4 border"
                style={{ background: "#F9731615", color: "#F97316", borderColor: "#F9731630" }}>
                ★ Most popular — All Platforms
              </div>
              <h2 className="text-[26px] sm:text-[30px] font-black text-white mb-3">Command Center</h2>
              <p className="text-[16px] sm:text-[17px] text-[#71717A] leading-relaxed">Your daily overview — revenue, ad spend, ROAS, GSC clicks and GA4 sessions on one screen.</p>
            </div>
            <div className="w-full lg:w-80 rounded-xl bg-[#161618] border border-white/[0.06] overflow-hidden">
              <div className="bg-[#1C1C1E] px-3 py-2.5 flex items-center gap-1.5 border-b border-white/[0.05]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <span className="text-[11px] text-[#48484A] ml-2">Command Center</span>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: "Revenue", value: "₹4.2L", change: "+18%", color: "#F97316" },
                  { label: "ROAS", value: "3.8×", change: "+0.4", color: "#3B82F6" },
                  { label: "Orders", value: "312", change: "+24", color: "#22C55E" },
                  { label: "GSC Clicks", value: "1.8K", change: "+12%", color: "#8B5CF6" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between rounded-lg bg-[#111113] px-3 py-3 border border-white/[0.05]">
                    <span className="text-[13px] text-[#48484A]">{m.label}</span>
                    <div className="text-right">
                      <span className="text-[16px] font-black block" style={{ color: m.color }}>{m.value}</span>
                      <span className="text-[11px] text-[#22C55E]">{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Report grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map(r => (
            <div key={r.title}
              className="rounded-2xl border border-black/[0.06] bg-white hover:shadow-lg hover:border-[#F97316]/20 transition-all hover:-translate-y-0.5 overflow-hidden">
              <div className="p-5 sm:p-6 pb-3">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: r.tagBg, border: `1px solid ${r.tagColor}25` }}>
                    <r.icon size={18} style={{ color: r.tagColor }} />
                  </div>
                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: r.tagBg, color: r.tagColor, borderColor: `${r.tagColor}25` }}>
                    {r.tag}
                  </span>
                </div>
                <div className="text-[16px] font-bold text-[#18181B] mb-2">{r.title}</div>
                <div className="text-[14px] text-[#71717A] leading-relaxed">{r.desc}</div>
              </div>
              <div className="mx-5 mb-5 rounded-xl overflow-hidden bg-[#F5F5F4] border border-black/[0.04]">
                {r.mockup.map(m => (
                  <div key={m.label} className="flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.04] last:border-0">
                    <span className="text-[13px] text-[#71717A]">{m.label}</span>
                    <span className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <p className="text-[16px] text-[#71717A] mb-4">All 12+ reports included in Skylitee Pro</p>
          <Link href="/install" className="inline-block px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_32px_rgba(249,115,22,0.5)]">
            Start 14-day free trial →
          </Link>
        </div>
      </div>
    </>
  );
}
