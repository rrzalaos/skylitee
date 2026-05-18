import Link from "next/link";
import { Check, Zap } from "lucide-react";

export const metadata = { title: "Pricing — Skylitee" };

const features = [
  "Shopify sales, orders & revenue dashboard",
  "Meta Ads — ROAS, CAC, CTR, spend & creatives",
  "Google Search Console & Analytics 4",
  "AI Insights & Chat assistant",
  "Cohort retention analysis",
  "Financial P&L calculator",
  "Goals tracker with live pace",
  "Geo, customer segments & anomaly alerts",
  "Attribution dashboard",
  "Weekly performance digest",
  "12+ reports across all platforms",
  "Dark & light mode",
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes — 14 days free, no credit card required. You get full access to every feature during the trial. No limits." },
  { q: "What happens after the 14 days?", a: "Shopify will prompt you to approve the $29/month subscription. If you don't approve, your access pauses. No surprise charges." },
  { q: "How does billing work?", a: "All billing is handled by Shopify — the same way you pay for other Shopify apps. No separate account or card needed." },
  { q: "Can I cancel anytime?", a: "Yes. Go to Shopify Admin → Apps → Skylitee → Cancel subscription. Your access continues until the end of the billing period." },
  { q: "Do I need Meta and Google connected?", a: "No. Skylitee works great with just your Shopify store. Meta and Google connections are optional and can be added or removed anytime." },
  { q: "Is there a discount for annual billing?", a: "Not yet — billing is monthly through Shopify. Annual billing is on our roadmap. If you need it, reach out and we'll see what we can do." },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-20 sm:py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">Simple pricing</div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-tight mb-4">
            One plan.<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Everything included.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[#71717A]">No tiers. No add-ons. No hidden fees. Just $29/month after a 14-day free trial.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {/* Plan card */}
        <div className="rounded-2xl border-2 border-[#F97316] bg-white p-7 sm:p-9 mb-6 shadow-[0_0_0_1px_rgba(249,115,22,0.15),0_20px_60px_rgba(249,115,22,0.12)] relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#F97316] text-white text-[12px] font-black px-4 py-1.5 rounded-bl-xl">
            Most popular
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                  <span className="text-white font-black text-[15px]">S</span>
                </div>
                <div className="text-[20px] font-black text-[#18181B]">Skylitee Pro</div>
              </div>
              <div className="text-[15px] text-[#22C55E] font-semibold flex items-center gap-1.5">
                <Zap size={13} fill="#22C55E" /> 14-day free trial — no credit card needed
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-end gap-1">
                <span className="text-[52px] font-black text-[#18181B] leading-none">$29</span>
                <span className="text-[16px] text-[#A1A1AA] mb-1.5">/month</span>
              </div>
              <div className="text-[14px] text-[#A1A1AA]">billed monthly via Shopify</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {features.map(f => (
              <div key={f} className="flex items-start gap-3 text-[15px] text-[#52525B]">
                <div className="w-5 h-5 rounded-full bg-[#22C55E]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={11} className="text-[#22C55E]" />
                </div>
                {f}
              </div>
            ))}
          </div>

          <Link href="/install"
            className="block w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl text-[16px] text-center transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_36px_rgba(249,115,22,0.5)] hover:-translate-y-0.5">
            Start 14-day free trial →
          </Link>
          <p className="text-center text-[14px] text-[#A1A1AA] mt-3">
            No credit card needed · Billing managed by Shopify · Cancel anytime
          </p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {[
            { icon: "🛡️", label: "Shopify Verified", desc: "Listed on Shopify App Store" },
            { icon: "🔒", label: "Secure billing", desc: "Managed 100% by Shopify" },
            { icon: "✈️", label: "Cancel anytime", desc: "No lock-ins, no penalties" },
          ].map(b => (
            <div key={b.label} className="rounded-2xl border border-black/[0.06] bg-white p-5 text-center">
              <div className="text-[26px] mb-2">{b.icon}</div>
              <div className="text-[15px] font-bold text-[#18181B] mb-1">{b.label}</div>
              <div className="text-[13px] text-[#A1A1AA]">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-[28px] sm:text-[32px] font-black text-[#18181B] mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map(f => (
              <div key={f.q} className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-7 hover:border-[#F97316]/20 hover:shadow-sm transition-all">
                <div className="text-[16px] font-bold text-[#18181B] mb-2">{f.q}</div>
                <div className="text-[15px] text-[#71717A] leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Still have questions */}
        <div className="mt-10 rounded-2xl bg-[#F5F5F4] border border-black/[0.06] p-6 text-center">
          <div className="text-[17px] font-bold text-[#18181B] mb-1">Still have questions?</div>
          <p className="text-[15px] text-[#71717A] mb-4">We reply fast. Usually within a few hours.</p>
          <Link href="/contact" className="inline-block px-6 py-3 bg-[#18181B] hover:bg-black text-white font-bold rounded-xl text-[15px] transition-colors">
            Contact us →
          </Link>
        </div>
      </div>
    </>
  );
}
