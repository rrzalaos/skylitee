import Link from "next/link";
import { ShoppingBag, Target, Search, BarChart2, Users, Map, TrendingUp, Zap, MessageSquare, DollarSign, Bell, Calendar } from "lucide-react";

export const metadata = { title: "Features — Skylitee" };

const sections = [
  {
    platform: "Shopify",
    color: "#96BF48",
    features: [
      { icon: BarChart2, title: "Sales Dashboard", desc: "Revenue, orders, AOV, and daily trends at a glance." },
      { icon: ShoppingBag, title: "Product Analytics", desc: "Top sellers, low stock alerts, and SKU-level performance." },
      { icon: Users, title: "Customer Segments", desc: "New vs returning, LTV, and customer city breakdown." },
      { icon: Map, title: "Geo Reports", desc: "Top cities and states driving your revenue." },
      { icon: TrendingUp, title: "Cohort Retention", desc: "See which months produce the most loyal customers." },
      { icon: Bell, title: "Anomaly Alerts", desc: "Automatic alerts when something unusual happens in your store." },
    ],
  },
  {
    platform: "Meta Ads",
    color: "#1877F2",
    features: [
      { icon: Target, title: "Campaign Performance", desc: "ROAS, CAC, CTR, CPC, spend and purchases in one view." },
      { icon: Zap, title: "Funnel Diagnosis", desc: "Rule-based AI diagnosis of your ad funnel — clicks to purchases." },
      { icon: BarChart2, title: "Placement Analysis", desc: "Know which placements (Feed, Reels, Stories) deliver results." },
      { icon: ShoppingBag, title: "Creative Performance", desc: "Compare ad creatives by ROAS, CTR and thumb-stop ratio." },
      { icon: Calendar, title: "Timing Analysis", desc: "Best hours and days of week to run your ads." },
    ],
  },
  {
    platform: "Google",
    color: "#4285F4",
    features: [
      { icon: Search, title: "Search Console", desc: "Keywords, clicks, impressions, CTR and average position." },
      { icon: BarChart2, title: "GA4 Traffic", desc: "Sessions, users, channels, bounce rate and session duration." },
      { icon: TrendingUp, title: "Ecommerce Events", desc: "View-to-ATC-to-checkout-to-purchase funnel from GA4." },
      { icon: Map, title: "Audience & Geo", desc: "New vs returning users, cities, regions and device breakdown." },
    ],
  },
  {
    platform: "AI & Insights",
    color: "#F97316",
    features: [
      { icon: Zap, title: "AI Insights", desc: "3 automated insights generated from your real store data." },
      { icon: MessageSquare, title: "AI Chat Assistant", desc: "Ask questions about your store in plain English." },
      { icon: DollarSign, title: "Financial P&L", desc: "Real P&L with COGS, shipping, RTO and break-even ROAS." },
      { icon: Target, title: "Goals Tracker", desc: "Set sales, ROAS and AOV targets and track live pace." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-16">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Everything included</div>
        <h1 className="text-[40px] font-black text-[#18181B] mb-4">All features. One plan.</h1>
        <p className="text-[15px] text-[#71717A] max-w-xl mx-auto">Every feature is included in Skylitee Pro — no hidden tiers, no add-ons.</p>
      </div>

      <div className="space-y-16">
        {sections.map(s => (
          <div key={s.platform}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-8 rounded-full" style={{ background: s.color }} />
              <h2 className="text-[20px] font-bold text-[#18181B]">{s.platform}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.features.map(f => (
                <div key={f.title} className="rounded-2xl border border-black/[0.06] p-5 hover:border-[#F97316]/30 hover:shadow-sm transition-all bg-white">
                  <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center mb-3">
                    <f.icon size={16} className="text-[#F97316]" />
                  </div>
                  <div className="text-[14px] font-bold text-[#18181B] mb-1">{f.title}</div>
                  <div className="text-[13px] text-[#71717A] leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-16">
        <Link href="/install" className="inline-block px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[14px] transition-colors">
          Start 14-day free trial →
        </Link>
      </div>
    </div>
  );
}
