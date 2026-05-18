import Link from "next/link";
import { Target, Users, Zap, TrendingUp } from "lucide-react";

export const metadata = { title: "About — Skylitee" };

const values = [
  { icon: Users, title: "Honest communication", desc: "Simple communication, timelines, and what's included — upfront. No surprises, no hidden scope." },
  { icon: Target, title: "Practical solutions", desc: "We avoid shortcuts that break later. Every feature in Skylitee is built for long-term stability, not demos." },
  { icon: Zap, title: "Dependable support", desc: "We reply fast and take accountability. If something breaks, we fix it — we don't pass the blame." },
  { icon: TrendingUp, title: "Long-term thinking", desc: "Speed, structure, and stability are not optional for ecommerce. We build for growth, not just launch day." },
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
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">About Skylitee</div>
          <h1 className="text-[40px] sm:text-[52px] font-black leading-tight mb-6">
            Built by a team that builds<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              for ecommerce brands.
            </span>
          </h1>
          <p className="text-[17px] sm:text-[19px] text-[#A1A1AA] leading-relaxed max-w-xl">
            Skylitee is a product by <strong className="text-white">Orange Sky</strong> — a Surat-based web development and marketing company that helps ecommerce brands launch faster, improve conversions, and scale with systems that stay stable.
          </p>
        </div>
      </section>

      {/* About Orange Sky */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-4">Who we are</div>
          <div className="space-y-6 text-[17px] sm:text-[18px] text-[#52525B] leading-relaxed">
            <p>
              Orange Sky designs and develops ecommerce websites, specialises in custom Shopify development, and supports brand growth with SEO and performance marketing. We work with D2C brands who are serious about building something that lasts.
            </p>
            <p>
              Most teams can either design well or build well. We care about both — because a Shopify store that looks great but runs slow, or converts poorly, isn&apos;t doing its job.
            </p>

            {/* Mission/Vision/Values block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              {[
                { label: "Vision", text: "Build digital systems that help brands grow sustainably, with clarity and control." },
                { label: "Mission", text: "Deliver reliable ecommerce builds and marketing execution that improves results month after month." },
                { label: "Values", text: "Honest communication, practical solutions, dependable support, and long-term thinking." },
              ].map(b => (
                <div key={b.label} className="rounded-2xl bg-[#F5F5F4] border border-black/[0.06] p-5">
                  <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#F97316] mb-2">{b.label}</div>
                  <p className="text-[14px] text-[#52525B] leading-relaxed">{b.text}</p>
                </div>
              ))}
            </div>

            <p>
              Skylitee was born from a real problem we saw across every Shopify brand we worked with — too many tabs, too many disconnected tools, and no single place to see what&apos;s actually happening. So we built one.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 bg-[#F5F5F4]">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "2024", label: "Founded" },
            { value: "Surat", label: "Based in" },
            { value: "5", label: "Platforms connected" },
            { value: "8+", label: "Active merchants" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-white border border-black/[0.06] p-5 sm:p-6 text-center">
              <div className="text-[26px] sm:text-[30px] font-black text-[#F97316] mb-1">{s.value}</div>
              <div className="text-[13px] font-bold text-[#71717A] uppercase tracking-[0.08em]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">How we work</div>
            <h2 className="text-[28px] sm:text-[34px] font-black text-[#18181B]">What we stand for</h2>
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

      {/* Orange Sky card */}
      <section className="py-16 sm:py-20 px-4 bg-[#0A0A0A] text-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">The team behind Skylitee</div>
            <h2 className="text-[28px] sm:text-[34px] font-black">Orange Sky</h2>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 sm:p-9">
            <p className="text-[17px] text-[#A1A1AA] leading-relaxed mb-8">
              We are a Surat-based ecommerce agency that designs, develops and markets Shopify stores. Skylitee is our proprietary analytics product — built internally, refined on real stores, and now available to all Shopify merchants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-5">
                <div className="text-[13px] text-[#48484A] mb-1.5 font-medium">Email</div>
                <a href="mailto:contact@orangesky.app" className="text-[16px] text-[#F97316] font-semibold hover:underline">
                  contact@orangesky.app
                </a>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-5">
                <div className="text-[13px] text-[#48484A] mb-1.5 font-medium">Phone</div>
                <div className="text-[16px] text-white font-semibold">+91 93777 18643</div>
                <div className="text-[14px] text-[#71717A]">+91 99789 65718</div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-5 sm:col-span-2">
                <div className="text-[13px] text-[#48484A] mb-1.5 font-medium">Location</div>
                <div className="text-[16px] text-white font-semibold">Surat, Gujarat — India 🇮🇳</div>
              </div>
            </div>
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
