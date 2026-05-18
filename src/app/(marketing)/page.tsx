import Link from "next/link";
import { Check, Zap, ShoppingBag, Target, Search, TrendingUp, ArrowRight } from "lucide-react";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";

export const metadata = { title: "Skylitee — One Dashboard. All Your Brand Data." };

function DashboardMockup() {
  const bars = [38, 55, 42, 70, 58, 83, 67, 88, 62, 79, 85, 96];
  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="bg-[#1C1C1E] px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="ml-3 flex-1 bg-[#2C2C2E] rounded-md h-6 flex items-center px-3">
          <span className="text-[11px] text-[#48484A]">app.skylitee.io/dashboard</span>
        </div>
      </div>
      <div className="bg-[#111113] flex" style={{ minHeight: 300 }}>
        <div className="w-11 bg-[#1C1C1E] border-r border-white/[0.05] flex flex-col items-center py-4 gap-3 shrink-0">
          <SkyLiteeLogo size={28} />
          {[
            { bg: "#F9731615", border: "#F9731640" },
            { bg: "#3B82F615", border: "#3B82F640" },
            { bg: "#22C55E15", border: "#22C55E40" },
            { bg: "#8B5CF615", border: "#8B5CF640" },
            { bg: "#EC489915", border: "#EC489940" },
          ].map((c, i) => (
            <div key={i} className="w-6 h-6 rounded-lg" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
          ))}
        </div>
        <div className="flex-1 p-4 flex flex-col gap-2.5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Revenue", value: "₹4.2L", color: "#F97316", change: "+18%" },
              { label: "ROAS", value: "3.8×", color: "#3B82F6", change: "+0.4" },
              { label: "Orders", value: "312", color: "#22C55E", change: "+24" },
              { label: "GSC Clicks", value: "1.8K", color: "#8B5CF6", change: "+12%" },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-[#1C1C1E] p-2.5 border border-white/[0.05]">
                <div className="text-[9px] text-[#48484A] mb-1 font-medium">{m.label}</div>
                <div className="text-[15px] font-black leading-none mb-1" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[9px] text-[#22C55E] font-semibold">{m.change}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[#1C1C1E] p-3 border border-white/[0.05]">
            <div className="text-[9px] text-[#48484A] mb-2 font-medium">Revenue — Last 12 days</div>
            <div className="flex items-end gap-0.5 h-16">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background: i === bars.length - 1 ? '#F97316' : i >= 9 ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)',
                  }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Meta ROAS", value: "4.1×", color: "#3B82F6" },
              { label: "New Customers", value: "189", color: "#22C55E" },
              { label: "Top City", value: "Mumbai", color: "#F97316" },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-[#1C1C1E] p-2.5 border border-white/[0.05]">
                <div className="text-[9px] text-[#48484A] mb-1 font-medium">{m.label}</div>
                <div className="text-[12px] font-bold" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const platforms = [
  { name: "Shopify", color: "#96BF48", symbol: "S" },
  { name: "Meta Ads", color: "#1877F2", symbol: "f" },
  { name: "Google GSC", color: "#EA4335", symbol: "G" },
  { name: "Google GA4", color: "#F9AB00", symbol: "G" },
  { name: "More coming", color: "#F97316", symbol: "+" },
];

const features = [
  {
    tag: "Shopify",
    tagColor: "#96BF48",
    title: "See everything happening in your store — in real time",
    desc: "Revenue, orders, AOV, top products, customer segments, geo breakdown and cohort retention. All updated live, no exports needed.",
    items: ["Daily revenue vs last period", "Top products & SKU performance", "Customer LTV & retention cohorts", "City and state breakdown"],
    icon: ShoppingBag,
    mockupLines: [
      { label: "Today's Revenue", value: "₹1,24,850", change: "+22%", color: "#F97316" },
      { label: "Orders", value: "94", change: "+8", color: "#22C55E" },
      { label: "AOV", value: "₹1,328", change: "-2%", color: "#EF4444" },
      { label: "New Customers", value: "61", change: "+31%", color: "#3B82F6" },
    ],
  },
  {
    tag: "Meta Ads",
    tagColor: "#1877F2",
    title: "Stop guessing why your ads aren't working",
    desc: "Campaign ROAS, CAC, CTR, funnel diagnosis, creative performance, placement analysis and timing reports — built for D2C brands that run Meta.",
    items: ["ROAS & CAC per campaign", "Rule-based funnel diagnosis", "Creative thumb-stop ratio", "Best hours & days to spend"],
    icon: Target,
    mockupLines: [
      { label: "Total Spend", value: "₹28,400", change: "7 campaigns", color: "#3B82F6" },
      { label: "ROAS", value: "4.1×", change: "vs 3.2× last week", color: "#22C55E" },
      { label: "CTR", value: "2.8%", change: "+0.4%", color: "#F97316" },
      { label: "CAC", value: "₹312", change: "-₹28", color: "#8B5CF6" },
    ],
  },
  {
    tag: "Google",
    tagColor: "#EA4335",
    title: "GSC + GA4 in one view — not two tabs",
    desc: "Search Console keywords, GA4 traffic channels, ecommerce funnel, landing page performance, audience and geo data — unified.",
    items: ["Top keywords & rankings", "GA4 traffic by channel", "View → ATC → purchase funnel", "Landing page performance"],
    icon: Search,
    mockupLines: [
      { label: "GSC Clicks", value: "1,842", change: "+340 this week", color: "#EA4335" },
      { label: "Sessions", value: "4,210", change: "+18%", color: "#3B82F6" },
      { label: "Top Keyword", value: "#3 ranking", change: "custom t-shirts", color: "#F9AB00" },
      { label: "Organic Revenue", value: "₹68K", change: "via GA4", color: "#22C55E" },
    ],
  },
];

const reviews = [
  { name: "Priya M.", brand: "Loomcraft Fabrics", text: "Finally stopped jumping between tabs. Everything I need is right there. The Meta funnel diagnosis alone saved us ₹40K/month in bad spend.", rating: 5 },
  { name: "Karan S.", brand: "Bold Threads", text: "The cohort retention chart showed us our best month ever was November — so we doubled down there. Revenue went up 3x in 60 days.", rating: 5 },
  { name: "Ananya R.", brand: "Neon Bottle", text: "I'm not a data person. Skylitee makes me feel like one. The AI chat answers my dumb questions without judgment.", rating: 5 },
];

const steps = [
  { n: "1", title: "Install on Shopify", desc: "Find Skylitee in the App Store. One click to install — no code, no setup." },
  { n: "2", title: "Connect your platforms", desc: "Link Meta Ads, Google Search Console and Google Analytics in under 5 minutes." },
  { n: "3", title: "Stop tab-switching forever", desc: "Your command center is live. All data, one screen, updated every day." },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-[#0A0A0A] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #3B82F6 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[13px] font-bold px-3.5 py-1.5 rounded-full mb-6">
                <Zap size={12} fill="#F97316" /> Live on Shopify App Store
              </div>
              <h1 className="text-[38px] sm:text-[48px] lg:text-[56px] font-black leading-[1.08] mb-6">
                Stop switching tabs.<br />
                <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  See everything at once.
                </span>
              </h1>
              <p className="text-[18px] sm:text-[19px] text-[#A1A1AA] leading-relaxed mb-8 max-w-md">
                Skylitee connects Shopify, Meta Ads and Google into one clean dashboard. Built for D2C brand owners who want answers, not more tabs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/install"
                  className="px-7 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_24px_rgba(249,115,22,0.4)] hover:shadow-[0_0_36px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 text-center">
                  Start free — 14 days →
                </Link>
                <Link href="/features"
                  className="px-7 py-4 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white font-bold rounded-xl text-[16px] transition-all text-center">
                  See all features
                </Link>
              </div>
              <div className="flex items-center gap-8">
                {[{ v: "₹0", l: "to set up" }, { v: "14d", l: "free trial" }, { v: "5min", l: "to connect" }].map(s => (
                  <div key={s.l}>
                    <div className="text-[24px] font-black text-white">{s.v}</div>
                    <div className="text-[13px] text-[#52525B] font-medium">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative mt-6 lg:mt-0">
              <div className="absolute -inset-4 rounded-3xl opacity-30"
                style={{ background: "radial-gradient(ellipse, rgba(249,115,22,0.3) 0%, transparent 70%)", filter: "blur(40px)" }} />
              <div className="relative">
                <DashboardMockup />
              </div>
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-[#22C55E] text-white text-[12px] font-black px-3 py-1.5 rounded-full shadow-lg">
                Live data ↑
              </div>
              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-[#1C1C1E] border border-white/10 text-white text-[13px] font-bold px-3.5 py-2 rounded-xl shadow-xl">
                <span className="text-[#F97316]">✓</span> All platforms synced
              </div>
            </div>
          </div>
        </div>

        {/* Platform logos bar */}
        <div className="relative border-t border-white/[0.05] py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center text-[13px] font-bold uppercase tracking-[0.12em] text-[#3F3F46] mb-6">Connects with</div>
            <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
              {platforms.map(p => (
                <div key={p.name} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[13px] text-white"
                    style={{ background: p.color }}>
                    {p.symbol}
                  </div>
                  <span className="text-[14px] font-semibold text-[#71717A]">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature sections ── */}
      {features.map((f, idx) => (
        <section key={f.tag} className={`py-16 sm:py-20 lg:py-24 px-4 ${idx % 2 === 0 ? "bg-white" : "bg-[#F5F5F4]"}`}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Text — swaps order on desktop for odd sections */}
              <div className={idx % 2 !== 0 ? "lg:order-2" : ""}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold mb-5 border"
                  style={{ background: `${f.tagColor}10`, color: f.tagColor, borderColor: `${f.tagColor}30` }}>
                  <f.icon size={12} /> {f.tag}
                </div>
                <h2 className="text-[28px] sm:text-[32px] lg:text-[36px] font-black text-[#18181B] leading-tight mb-4">{f.title}</h2>
                <p className="text-[17px] sm:text-[18px] text-[#71717A] leading-relaxed mb-6">{f.desc}</p>
                <ul className="space-y-3">
                  {f.items.map(item => (
                    <li key={item} className="flex items-center gap-3 text-[16px] text-[#52525B] font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#F97316]/10 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[#F97316]" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup — swaps order on desktop for odd sections */}
              <div className={idx % 2 !== 0 ? "lg:order-1" : ""}>
                <div className="rounded-2xl bg-[#111113] border border-white/[0.08] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                  <div className="bg-[#1C1C1E] px-4 py-2.5 flex items-center gap-2 border-b border-white/[0.05]">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                    </div>
                    <span className="text-[11px] text-[#48484A] ml-2 font-medium">{f.tag} · Skylitee</span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {f.mockupLines.map(m => (
                      <div key={m.label} className="flex items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-3.5 border border-white/[0.05]">
                        <span className="text-[13px] text-[#71717A] font-medium">{m.label}</span>
                        <div className="text-right">
                          <div className="text-[16px] font-black" style={{ color: m.color }}>{m.value}</div>
                          <div className="text-[11px] text-[#48484A]">{m.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* ── How it works ── */}
      <section className="py-20 sm:py-24 px-4 bg-[#0A0A0A] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-10 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">Simple setup</div>
            <h2 className="text-[32px] sm:text-[40px] font-black">Up in 5 minutes, not 5 days</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {steps.map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+36px)] right-0 h-px bg-gradient-to-r from-[#F97316]/40 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_rgba(249,115,22,0.4)]">
                  <span className="text-white font-black text-[22px]">{s.n}</span>
                </div>
                <h3 className="text-[18px] font-bold mb-2">{s.title}</h3>
                <p className="text-[16px] text-[#71717A] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">From real founders</div>
            <h2 className="text-[28px] sm:text-[34px] font-black text-[#18181B]">Brand owners love Skylitee</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map(r => (
              <div key={r.name} className="rounded-2xl border border-black/[0.06] p-6 bg-white hover:shadow-lg hover:border-[#F97316]/20 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <span key={i} className="text-[#F97316] text-[16px]">★</span>
                  ))}
                </div>
                <p className="text-[16px] text-[#52525B] leading-relaxed mb-5">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-black/[0.05]">
                  <div className="w-9 h-9 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316] font-black text-[14px]">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#18181B]">{r.name}</div>
                    <div className="text-[13px] text-[#A1A1AA]">{r.brand}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="py-16 sm:py-20 px-4 bg-[#F5F5F4]">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Pricing</div>
          <h2 className="text-[30px] sm:text-[36px] font-black text-[#18181B] mb-2">One plan. Everything included.</h2>
          <p className="text-[17px] text-[#71717A] mb-8">No tiers. No hidden fees. Start free.</p>
          <div className="rounded-2xl border-2 border-[#F97316] bg-white p-8 shadow-[0_0_0_1px_rgba(249,115,22,0.2),0_16px_48px_rgba(249,115,22,0.12)]">
            <div className="text-[17px] font-bold text-[#18181B] mb-1">Skylitee Pro</div>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-[52px] font-black text-[#18181B] leading-none">$29</span>
              <span className="text-[16px] text-[#A1A1AA] mb-2">/mo</span>
            </div>
            <div className="text-[15px] text-[#22C55E] font-semibold mb-6">14-day free trial — no credit card</div>
            <ul className="text-left space-y-2.5 mb-6">
              {["Shopify full analytics", "Meta Ads dashboard", "Google GSC + GA4", "AI Insights & Chat", "Cohort retention & P&L"].map(feat => (
                <li key={feat} className="flex items-center gap-2.5 text-[16px] text-[#52525B]">
                  <Check size={13} className="text-[#22C55E] shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            <Link href="/install" className="block w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] text-center transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_32px_rgba(249,115,22,0.5)]">
              Start free trial →
            </Link>
          </div>
          <Link href="/pricing" className="inline-block mt-4 text-[15px] text-[#F97316] font-semibold hover:underline">
            Full pricing details <ArrowRight size={13} className="inline" />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-20 sm:py-28 px-4 bg-[#0A0A0A] text-white text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-20 rounded-full"
            style={{ background: "radial-gradient(ellipse, #F97316 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[13px] font-bold px-3.5 py-1.5 rounded-full mb-6">
            <TrendingUp size={12} /> Join hundreds of D2C brands
          </div>
          <h2 className="text-[34px] sm:text-[44px] lg:text-[52px] font-black leading-tight mb-4">
            Ready to see your full brand picture?
          </h2>
          <p className="text-[18px] text-[#71717A] mb-10">
            14-day free trial. No credit card. Cancel anytime from Shopify admin.
          </p>
          <Link href="/install"
            className="inline-block px-10 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-black rounded-xl text-[16px] transition-all shadow-[0_0_32px_rgba(249,115,22,0.4)] hover:shadow-[0_0_48px_rgba(249,115,22,0.6)] hover:-translate-y-0.5">
            Install on Shopify — Free to Start →
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-[14px] text-[#52525B]">
            <span>✓ No setup fees</span>
            <span>✓ Works with your existing Shopify store</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>
    </>
  );
}
