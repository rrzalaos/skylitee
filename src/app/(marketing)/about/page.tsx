import Link from "next/link";
import { Target, Users, Zap, TrendingUp } from "lucide-react";

export const metadata = { title: "About — Skylitee" };

const values = [
  { icon: Target, title: "Built for D2C", desc: "Every feature exists because a real brand owner needed it. Not because it looked good on a roadmap." },
  { icon: Zap, title: "Speed over complexity", desc: "If it takes more than 2 clicks to get an answer, we redesign it. Your time is the most expensive thing you have." },
  { icon: Users, title: "India-first", desc: "COD orders, RTO rates, Rupee P&L — we build for the realities of selling in India, not SaaS playbooks from the US." },
  { icon: TrendingUp, title: "Real data only", desc: "We never show mock numbers or placeholder charts. If your data isn't connected, we say so — not fake it." },
];

const timeline = [
  { year: "2024", event: "Started building after spending too many hours juggling Shopify, Meta Ads Manager, Search Console and Analytics — separately." },
  { year: "Early 2025", event: "First version launched with Shopify analytics and Meta Ads. First 3 paying merchants." },
  { year: "Mid 2025", event: "Added Google Search Console and GA4. Rebuilt the entire UI from scratch based on merchant feedback." },
  { year: "2026", event: "Launched AI Insights, cohort retention, financial P&L and Goals Tracker. Listed officially on the Shopify App Store." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A0A0A] text-white py-20 sm:py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">Our story</div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-tight mb-6">
            Built by a D2C brand.<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              For D2C brands.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[#A1A1AA] leading-relaxed max-w-xl">
            We didn&apos;t build Skylitee because it was a good business idea. We built it because we were drowning in tabs and spreadsheets every morning, just trying to answer one question: <strong className="text-white">how is the store doing today?</strong>
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6 text-[17px] sm:text-[18px] text-[#52525B] leading-relaxed">
            <p>
              Running a D2C brand on Shopify means constantly jumping between platforms — Shopify analytics for revenue, Meta Ads Manager for ROAS, Google Search Console for keywords, Google Analytics for traffic. And none of them talk to each other.
            </p>
            <p>
              You end up building Excel sheets. Then the sheets go stale. Then you stop looking at the data. Then you make decisions on gut feel — and wonder why your margins are shrinking.
            </p>
            <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-6 sm:p-7 my-8">
              <div className="text-[14px] font-bold text-[#EA580C] mb-2 uppercase tracking-wider">Our mission</div>
              <p className="text-[16px] sm:text-[17px] text-[#92400E] font-medium leading-relaxed m-0">
                Give every D2C brand owner the clarity they need to make fast, confident decisions — without needing a data analyst, an Excel wizard, or 11 open tabs.
              </p>
            </div>
            <p>
              We are <strong className="text-[#18181B]">Orange Sky</strong>, a small team based in India. We understand the unique challenges of Indian D2C — COD-heavy orders, high RTO rates, Meta-first ad spend, and the pressure of razor-thin contribution margins. Skylitee is built around those realities.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 bg-[#F5F5F4]">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "2024", label: "Founded" },
            { value: "8+", label: "Merchants" },
            { value: "5", label: "Platforms connected" },
            { value: "India", label: "Built in" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white border border-black/[0.06] p-5 sm:p-6 text-center">
              <div className="text-[28px] sm:text-[32px] font-black text-[#F97316] mb-1">{s.value}</div>
              <div className="text-[13px] font-bold text-[#71717A] uppercase tracking-[0.08em]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">How we build</div>
            <h2 className="text-[28px] sm:text-[34px] font-black text-[#18181B]">What we believe in</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-7 hover:border-[#F97316]/20 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] flex items-center justify-center mb-4">
                  <v.icon size={20} className="text-[#F97316]" />
                </div>
                <div className="text-[17px] font-bold text-[#18181B] mb-2">{v.title}</div>
                <p className="text-[15px] text-[#71717A] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 sm:py-20 px-4 bg-[#0A0A0A] text-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">How we got here</div>
            <h2 className="text-[28px] sm:text-[34px] font-black">The Skylitee timeline</h2>
          </div>
          <div className="space-y-0">
            {timeline.map((t, i) => (
              <div key={t.year} className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center shrink-0 group-hover:bg-[#F97316]/20 transition-colors">
                    <span className="text-[#F97316] font-black text-[11px] text-center leading-tight">{t.year.replace(" ", "\n")}</span>
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-white/[0.06] my-2" />
                  )}
                </div>
                <div className="pb-8">
                  <div className="text-[14px] font-bold text-[#F97316] mb-1.5">{t.year}</div>
                  <p className="text-[16px] text-[#71717A] leading-relaxed">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 bg-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-[28px] sm:text-[34px] font-black text-[#18181B] mb-4">Try Skylitee free for 14 days</h2>
          <p className="text-[17px] text-[#71717A] mb-8">No credit card. No setup fees. Just connect your store and see your data.</p>
          <Link href="/install"
            className="inline-block px-9 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_24px_rgba(249,115,22,0.3)] hover:shadow-[0_0_36px_rgba(249,115,22,0.5)]">
            Install on Shopify →
          </Link>
          <div className="mt-6">
            <Link href="/contact" className="text-[15px] text-[#71717A] hover:text-[#F97316] transition-colors">
              Have questions? Contact us →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
