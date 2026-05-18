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
    <footer className="bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-[14px]">S</span>
              </div>
              <span className="font-black text-[18px] text-white">Skylitee</span>
            </div>
            <p className="text-[13px] text-[#A1A1AA] leading-relaxed">
              One Dashboard. All Your Reports. Built for D2C brands on Shopify.
            </p>
          </div>

          {/* Pages */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A] mb-4">Pages</div>
            <ul className="space-y-2.5">
              {pages.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-[#A1A1AA] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A] mb-4">Legal</div>
            <ul className="space-y-2.5">
              {legal.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-[#A1A1AA] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71717A] mb-4">Contact</div>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:support@skylitee.io" className="text-[13px] text-[#A1A1AA] hover:text-white transition-colors">
                  support@skylitee.io
                </a>
              </li>
              <li>
                <a href="mailto:account@skylitee.io" className="text-[13px] text-[#A1A1AA] hover:text-white transition-colors">
                  account@skylitee.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-[#71717A]">© 2026 Orange Sky. All rights reserved.</p>
          <p className="text-[12px] text-[#71717A]">Built for Shopify merchants worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
