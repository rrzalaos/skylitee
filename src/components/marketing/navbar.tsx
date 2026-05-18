"use client";
import { useState } from "react";
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[14px]">S</span>
          </div>
          <span className="font-black text-[18px] text-[#18181B]">Skylitee</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-[13px] font-medium text-[#52525B] hover:text-[#18181B] transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/install"
            className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-[13px] font-bold rounded-lg transition-colors"
          >
            Install App →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-black/[0.06] px-4 py-4 flex flex-col gap-4">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[14px] font-medium text-[#52525B]">
              {l.label}
            </Link>
          ))}
          <Link href="/install" onClick={() => setOpen(false)} className="px-4 py-2 bg-[#F97316] text-white text-[13px] font-bold rounded-lg text-center">
            Install App →
          </Link>
        </div>
      )}
    </nav>
  );
}
