import Link from "next/link";
import { BarChart2, Target, Search, TrendingUp, DollarSign, Users, Map, Zap, Calendar, ShoppingBag } from "lucide-react";

export const metadata = { title: "Reports — Skylitee" };

const reports = [
  { icon: BarChart2, title: "Command Center", desc: "Your daily overview — revenue, ad spend, ROAS, GSC clicks and GA4 sessions on one screen.", tag: "All Platforms" },
  { icon: ShoppingBag, title: "Sales Report", desc: "Full Shopify breakdown — top products, top cities, COD vs prepaid, discounts and refunds.", tag: "Shopify" },
  { icon: Users, title: "Customer Report", desc: "Segments, LTV, new vs returning and customer city heatmap.", tag: "Shopify" },
  { icon: TrendingUp, title: "Cohort Retention", desc: "Month-by-month retention matrix showing which cohorts stick around and buy again.", tag: "Shopify" },
  { icon: Map, title: "Geo Report", desc: "Top states and cities by revenue and order count across India.", tag: "Shopify" },
  { icon: Target, title: "Meta Ads Report", desc: "Campaign-level ROAS, CAC, CTR, frequency, funnel and creative performance.", tag: "Meta Ads" },
  { icon: ShoppingBag, title: "Ad Placement Report", desc: "Compare Feed, Reels, Stories and other placements by spend and ROAS.", tag: "Meta Ads" },
  { icon: Calendar, title: "Timing Report", desc: "Hourly and day-of-week breakdown of your ad performance to find the best time to run.", tag: "Meta Ads" },
  { icon: Search, title: "GSC Report", desc: "Top keywords, pages, devices, countries and sitemap health from Google Search Console.", tag: "Google" },
  { icon: BarChart2, title: "GA4 Report", desc: "Traffic channels, ecommerce funnel, landing pages, audience and geo from Google Analytics.", tag: "Google" },
  { icon: DollarSign, title: "Financial P&L", desc: "Real profit and loss with COGS, shipping costs, RTO rate, gateway fees and break-even ROAS.", tag: "Analytics" },
  { icon: Zap, title: "Goals Tracker", desc: "Set monthly sales, ROAS and AOV targets and track live pace with last-month suggestions.", tag: "Analytics" },
];

const tagColors: Record<string, string> = {
  "All Platforms": "bg-[#0A0A0A] text-white",
  "Shopify": "bg-[#96BF48]/10 text-[#4a7a1e]",
  "Meta Ads": "bg-blue-50 text-blue-700",
  "Google": "bg-red-50 text-red-700",
  "Analytics": "bg-[#FFF7ED] text-[#EA580C]",
};

export default function ReportsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-16">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">12+ Reports</div>
        <h1 className="text-[40px] font-black text-[#18181B] mb-4">Every report your brand needs</h1>
        <p className="text-[15px] text-[#71717A] max-w-xl mx-auto">All reports included in one plan. Real data, no mock numbers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map(r => (
          <div key={r.title} className="rounded-2xl border border-black/[0.06] p-5 bg-white hover:shadow-md hover:border-[#F97316]/30 transition-all flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center">
                <r.icon size={16} className="text-[#F97316]" />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tagColors[r.tag]}`}>{r.tag}</span>
            </div>
            <div className="text-[14px] font-bold text-[#18181B] mb-1">{r.title}</div>
            <div className="text-[13px] text-[#71717A] leading-relaxed flex-1">{r.desc}</div>
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
