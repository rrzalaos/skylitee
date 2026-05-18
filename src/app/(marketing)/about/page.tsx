import Link from "next/link";

export const metadata = { title: "About — Skylitee" };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-16">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-2">Our story</div>
        <h1 className="text-[40px] font-black text-[#18181B] mb-4">Built by a D2C brand, for D2C brands</h1>
      </div>

      <div className="space-y-8 text-[15px] text-[#52525B] leading-relaxed">
        <p>
          Skylitee was born out of frustration. Running a D2C brand on Shopify means constantly jumping between tabs — Shopify analytics, Meta Ads Manager, Google Search Console, Google Analytics — just to answer one simple question: <strong className="text-[#18181B]">How is my business doing today?</strong>
        </p>
        <p>
          We built Skylitee to fix that. One dashboard that pulls data from all your platforms and shows it in one clean, simple view — no exports, no spreadsheets, no tab switching.
        </p>
        <p>
          We are <strong className="text-[#18181B]">Orange Sky</strong>, a small team based in India building tools for Indian D2C brands. We understand the unique challenges of selling online in India — COD orders, RTO rates, platform fragmentation — and we&apos;ve built Skylitee around those realities.
        </p>

        <div className="rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-6">
          <div className="text-[14px] font-bold text-[#EA580C] mb-2">Our mission</div>
          <p className="text-[14px] text-[#92400E]">
            Give every D2C brand owner the clarity they need to make fast, confident decisions — without needing a data analyst.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
          {[
            { value: "2025", label: "Founded" },
            { value: "8+", label: "Merchants" },
            { value: "India", label: "Based in" },
          ].map(s => (
            <div key={s.label} className="text-center rounded-2xl border border-black/[0.06] p-5 bg-white">
              <div className="text-[28px] font-black text-[#F97316]">{s.value}</div>
              <div className="text-[12px] font-bold text-[#71717A] uppercase tracking-[0.08em]">{s.label}</div>
            </div>
          ))}
        </div>

        <p>
          Skylitee is listed on the Shopify App Store and trusted by Shopify merchants. We&apos;re constantly adding new features based on feedback from real store owners.
        </p>
      </div>

      <div className="text-center mt-16">
        <Link href="/install" className="inline-block px-8 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[14px] transition-colors">
          Try Skylitee free for 14 days →
        </Link>
      </div>
    </div>
  );
}
