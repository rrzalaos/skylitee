import Link from "next/link";
import { Check, BarChart2, Target, Zap, ShoppingBag, TrendingUp, Search } from "lucide-react";

export const metadata = { title: "Skylitee — One Dashboard. All Your Reports." };

const features = [
  { icon: ShoppingBag, title: "Shopify Analytics", desc: "Sales, orders, revenue, customers, products and geo — all in one view." },
  { icon: Target, title: "Meta Ads", desc: "ROAS, CAC, CTR, spend, creative performance and funnel diagnosis." },
  { icon: Search, title: "Google GSC & GA4", desc: "Search Console rankings, GA4 traffic, ecommerce events and audience data." },
];

const steps = [
  { n: "01", title: "Install the app", desc: "Find Skylitee on the Shopify App Store and click Install." },
  { n: "02", title: "Connect your platforms", desc: "Link Meta Ads, Google Search Console and Google Analytics 4." },
  { n: "03", title: "Start growing", desc: "All your data in one dashboard — no spreadsheets, no tab switching." },
];

const stats = [
  { value: "8+", label: "Merchants" },
  { value: "5", label: "Platforms" },
  { value: "$0", label: "Setup cost" },
  { value: "14", label: "Day free trial" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#F97316]/10 text-[#F97316] text-[12px] font-bold px-3 py-1 rounded-full mb-6">
            <Zap size={11} /> Now live on Shopify App Store
          </div>
          <h1 className="text-[42px] sm:text-[56px] font-black leading-tight mb-6">
            One Dashboard.<br />
            <span className="text-[#F97316]">All Your Reports.</span>
          </h1>
          <p className="text-[16px] text-[#A1A1AA] max-w-xl mx-auto mb-10 leading-relaxed">
            Connect Shopify, Meta Ads and Google in minutes. Track sales, ROAS, traffic and growth — without switching tabs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/install" className="px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[14px] transition-colors">
              Start 14-day free trial →
            </Link>
            <Link href="/features" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.10] text-white font-bold rounded-xl text-[14px] transition-colors">
              See all features
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#F97316] py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-[32px] font-black text-white">{s.value}</div>
              <div className="text-[12px] font-bold text-white/80 uppercase tracking-[0.08em]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">What we connect</div>
            <h2 className="text-[32px] font-black text-[#18181B]">All your data. One place.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="rounded-2xl border border-black/[0.06] p-6 hover:border-[#F97316]/40 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-[#FFF7ED] rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={18} className="text-[#F97316]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#18181B] mb-2">{f.title}</h3>
                <p className="text-[13px] text-[#71717A] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-[#F5F5F4]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Simple setup</div>
            <h2 className="text-[32px] font-black text-[#18181B]">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 bg-[#F97316] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-black text-[14px]">{s.n}</span>
                </div>
                <h3 className="text-[15px] font-bold text-[#18181B] mb-2">{s.title}</h3>
                <p className="text-[13px] text-[#71717A] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-md mx-auto text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Pricing</div>
          <h2 className="text-[32px] font-black text-[#18181B] mb-4">Simple. One plan.</h2>
          <div className="rounded-2xl border border-[#F97316] shadow-[0_0_0_1px_#F97316,0_8px_32px_rgba(249,115,22,0.10)] p-8 mb-6">
            <div className="text-[15px] font-bold text-[#18181B] mb-1">Skylitee Pro</div>
            <div className="text-[42px] font-black text-[#18181B] leading-none">$29<span className="text-[16px] text-[#A1A1AA] font-normal">/mo</span></div>
            <div className="text-[12px] text-[#22C55E] font-semibold mt-1 mb-6">14-day free trial included</div>
            <ul className="text-left space-y-2 mb-6">
              {["Shopify full analytics", "Meta Ads dashboard", "Google GSC + GA4", "AI Insights & Chat", "Goals & Financial P&L"].map(f => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-[#52525B]">
                  <Check size={13} className="text-[#22C55E] shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/install" className="block w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[13px] text-center transition-colors">
              Start free trial →
            </Link>
          </div>
          <Link href="/pricing" className="text-[13px] text-[#F97316] font-semibold hover:underline">See full pricing details</Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-[#0A0A0A] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[36px] font-black mb-4">Ready to see your full picture?</h2>
          <p className="text-[15px] text-[#A1A1AA] mb-8">14-day free trial. No credit card needed. Cancel anytime.</p>
          <Link href="/install" className="inline-block px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[14px] transition-colors">
            Install on Shopify — It&apos;s Free to Start →
          </Link>
        </div>
      </section>
    </>
  );
}
