"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";

const links = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Reports", href: "/reports" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-black/[0.06]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <SkyLiteeLogo size={34} />
          <span className={`font-black text-[20px] transition-colors ${scrolled ? "text-[#18181B]" : "text-white"}`}>Sky Litee</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`text-[15px] font-medium transition-colors hover:text-[#F97316] ${scrolled ? "text-[#52525B]" : "text-white/85"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard" className={`px-4 py-2.5 text-[14px] font-semibold rounded-lg transition-colors border ${scrolled ? "border-black/[0.12] text-[#52525B] hover:text-[#18181B] hover:border-black/[0.25]" : "border-white/30 text-white/85 hover:text-white hover:border-white/60"}`}>
            Login
          </Link>
          <Link href="/signup" className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-[14px] font-bold rounded-lg transition-all shadow-[0_0_16px_rgba(249,115,22,0.35)] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)] hover:-translate-y-0.5">
            Install Free →
          </Link>
        </div>

        <button className={`md:hidden p-2 ${scrolled ? "text-[#18181B]" : "text-white"}`} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-black/[0.06] px-5 py-5 flex flex-col gap-4 shadow-lg">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[16px] font-medium text-[#52525B] hover:text-[#F97316] py-1">
              {l.label}
            </Link>
          ))}
          <Link href="/dashboard" onClick={() => setOpen(false)} className="px-4 py-3 border border-black/[0.12] text-[#52525B] text-[15px] font-semibold rounded-lg text-center">
            Login
          </Link>
          <Link href="/signup" onClick={() => setOpen(false)} className="px-4 py-3 bg-[#F97316] text-white text-[15px] font-bold rounded-lg text-center">
            Install Free →
          </Link>
        </div>
      )}
    </nav>
  );
}
