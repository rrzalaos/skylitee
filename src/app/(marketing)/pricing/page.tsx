import Link from "next/link";
import { Check } from "lucide-react";

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
  { q: "Is there a free trial?", a: "Yes — 14 days free, no credit card required. You get full access to all features during the trial." },
  { q: "What happens after the trial?", a: "After 14 days, Shopify will prompt you to approve the $29/month subscription. If you don't approve, access is paused." },
  { q: "How is billing handled?", a: "All billing is managed by Shopify. You'll be charged through your Shopify account — the same way you pay for other Shopify apps." },
  { q: "Can I cancel anytime?", a: "Yes. You can cancel anytime from your Shopify admin under Apps & Sales Channels → Skylitee → Cancel subscription." },
  { q: "Do I need Meta or Google connected to use the app?", a: "No. You can use Skylitee with just your Shopify store. Meta and Google connections are optional and can be added anytime." },
];

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Simple pricing</div>
        <h1 className="text-[40px] font-black text-[#18181B] mb-4">One plan. Everything included.</h1>
        <p className="text-[15px] text-[#71717A]">No tiers, no hidden fees. Start free for 14 days.</p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl border border-[#F97316] shadow-[0_0_0_1px_#F97316,0_12px_40px_rgba(249,115,22,0.12)] p-8 mb-16 bg-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[18px] font-bold text-[#18181B]">Skylitee Pro</div>
            <div className="text-[13px] text-[#22C55E] font-semibold mt-0.5">14-day free trial included</div>
          </div>
          <div className="text-right">
            <div className="text-[42px] font-black text-[#18181B] leading-none">$29</div>
            <div className="text-[13px] text-[#A1A1AA]">/month after trial</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
          {features.map(f => (
            <div key={f} className="flex items-start gap-2 text-[13px] text-[#52525B]">
              <Check size={13} className="text-[#22C55E] shrink-0 mt-0.5" />
              {f}
            </div>
          ))}
        </div>

        <Link href="/install" className="block w-full py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[14px] text-center transition-colors">
          Start 14-day free trial →
        </Link>
        <p className="text-center text-[12px] text-[#A1A1AA] mt-3">No credit card needed. Billing handled by Shopify.</p>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-[24px] font-black text-[#18181B] mb-8 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map(f => (
            <div key={f.q} className="rounded-2xl border border-black/[0.06] p-5 bg-white">
              <div className="text-[14px] font-bold text-[#18181B] mb-2">{f.q}</div>
              <div className="text-[13px] text-[#71717A] leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
