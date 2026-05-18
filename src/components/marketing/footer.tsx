import Link from "next/link";

const pages = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Reports", href: "/reports" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const legal = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund" },
  { label: "Cookie Policy", href: "/cookies" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#F97316]/30 to-transparent" />

      {/* Footer CTA */}
      <div className="border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-[20px] font-black text-white mb-1">Ready to stop guessing?</div>
            <p className="text-[13px] text-[#71717A]">Start your free 14-day trial. No credit card needed.</p>
          </div>
          <Link href="/install"
            className="shrink-0 px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[13px] transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_32px_rgba(249,115,22,0.5)] hover:-translate-y-0.5">
            Install free on Shopify →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                <span className="text-white font-black text-[14px]">S</span>
              </div>
              <span className="font-black text-[18px] text-white">Skylitee</span>
            </div>
            <p className="text-[13px] text-[#71717A] leading-relaxed mb-4">
              One dashboard for Shopify, Meta Ads, Google GSC and GA4. Built for Indian D2C brands.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] text-[#71717A]">Live on Shopify App Store</span>
            </div>
          </div>

          {/* Pages */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#48484A] mb-4">Pages</div>
            <ul className="space-y-2.5">
              {pages.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-[#71717A] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#48484A] mb-4">Legal</div>
            <ul className="space-y-2.5">
              {legal.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-[#71717A] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#48484A] mb-4">Contact</div>
            <ul className="space-y-3">
              <li>
                <div className="text-[11px] text-[#48484A] mb-0.5">Support</div>
                <a href="mailto:support@skylitee.io" className="text-[13px] text-[#71717A] hover:text-[#F97316] transition-colors">
                  support@skylitee.io
                </a>
              </li>
              <li>
                <div className="text-[11px] text-[#48484A] mb-0.5">Billing & Accounts</div>
                <a href="mailto:account@skylitee.io" className="text-[13px] text-[#71717A] hover:text-[#F97316] transition-colors">
                  account@skylitee.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-[#48484A]">© 2026 Orange Sky. All rights reserved.</p>
          <p className="text-[12px] text-[#48484A]">Made in India 🇮🇳 · Built for Shopify merchants</p>
        </div>
      </div>
    </footer>
  );
}
