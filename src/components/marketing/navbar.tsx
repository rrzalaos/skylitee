"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.4)]">
            <span className="text-white font-black text-[15px]">S</span>
          </div>
          <span className={`font-black text-[18px] transition-colors ${scrolled ? "text-[#18181B]" : "text-white"}`}>Skylitee</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`text-[13px] font-medium transition-colors hover:text-[#F97316] ${scrolled ? "text-[#52525B]" : "text-white/80"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/install" className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-[13px] font-bold rounded-lg transition-all shadow-[0_0_16px_rgba(249,115,22,0.35)] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)] hover:-translate-y-0.5">
            Install Free →
          </Link>
        </div>

        <button className={`md:hidden p-2 ${scrolled ? "text-[#18181B]" : "text-white"}`} onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-black/[0.06] px-4 py-4 flex flex-col gap-4 shadow-lg">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[14px] font-medium text-[#52525B] hover:text-[#F97316]">
              {l.label}
            </Link>
          ))}
          <Link href="/install" onClick={() => setOpen(false)} className="px-4 py-2.5 bg-[#F97316] text-white text-[13px] font-bold rounded-lg text-center">
            Install Free →
          </Link>
        </div>
      )}
    </nav>
  );
}
