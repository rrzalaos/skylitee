"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Radar, Brain, MessageSquareText,
  ShoppingCart, Target, Package,
  Users, BarChart2, MapPin,
  Share2, Layout, Palette, Clock,
  Search, LineChart, Megaphone,
  GitMerge, Receipt, Trophy, CalendarDays,
  Plug, Activity, ChevronDown, UserCircle
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Command Center", icon: LayoutDashboard, badge: null, dot: null },
      { href: "/dashboard/anomaly", label: "Anomaly Feed", icon: Radar, badge: { text: "5", color: "red" }, dot: null },
      { href: "/dashboard/insights", label: "AI Insights", icon: Brain, badge: { text: "11", color: "amber" }, dot: null },
      { href: "/dashboard/chat", label: "AI Assistant", icon: MessageSquareText, badge: { text: "New", color: "orange" }, dot: null },
    ],
  },
  {
    label: "Shopify",
    items: [
      { href: "/dashboard/sales", label: "Sales Report", icon: ShoppingCart, badge: null, dot: "on" },
      { href: "/dashboard/goals", label: "Monthly Goals", icon: Target, badge: null, dot: "on" },
      { href: "/dashboard/products", label: "Product Analytics", icon: Package, badge: null, dot: "on" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/dashboard/customers", label: "Customer Intel", icon: Users, badge: null, dot: "on" },
      { href: "/dashboard/cohort", label: "Cohort Analysis", icon: BarChart2, badge: null, dot: "on" },
      { href: "/dashboard/geo", label: "Geo Performance", icon: MapPin, badge: null, dot: "on" },
    ],
  },
  {
    label: "Meta Ads",
    items: [
      { href: "/dashboard/meta", label: "Meta Campaigns", icon: Share2, badge: null, dot: "meta" },
      { href: "/dashboard/placement", label: "Ads Placement", icon: Layout, badge: null, dot: "meta" },
      { href: "/dashboard/creative", label: "Creative Studio", icon: Palette, badge: null, dot: "meta" },
      { href: "/dashboard/timing", label: "Time Intelligence", icon: Clock, badge: null, dot: "meta" },
    ],
  },
  {
    label: "Google",
    items: [
      { href: "/dashboard/gads", label: "Google Ads", icon: Megaphone, badge: null, dot: "off" },
      { href: "/dashboard/gsc", label: "Search Console", icon: Search, badge: null, dot: "google_gsc" },
      { href: "/dashboard/ga4", label: "Analytics GA4", icon: LineChart, badge: null, dot: "google_ga4" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/dashboard/attribution", label: "Attribution", icon: GitMerge, badge: null, dot: null },
      { href: "/dashboard/financial", label: "Financial P&L", icon: Receipt, badge: null, dot: null },
      { href: "/dashboard/benchmarking", label: "Benchmarking", icon: Trophy, badge: null, dot: null },
      { href: "/dashboard/weekly", label: "Weekly Digest", icon: CalendarDays, badge: null, dot: null },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/dashboard/connections", label: "Connections", icon: Plug, badge: null, dot: null },
      { href: "/dashboard/profile", label: "Profile & Account", icon: UserCircle, badge: null, dot: null },
    ],
  },
];

const badgeStyles: Record<string, string> = {
  red: "bg-[#FEF2F2] text-[#991B1B] dark:bg-[#2D0A0A] dark:text-[#FCA5A5]",
  amber: "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]",
  orange: "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]",
  green: "bg-[#F0FDF4] text-[#166534] dark:bg-[#052E16] dark:text-[#4ADE80]",
};

const dotStyles = {
  on: "bg-[#22C55E]",
  off: "bg-[#EF4444]",
  warn: "bg-[#EAB308]",
};

export function Sidebar() {
  const pathname = usePathname();
  const [shopName, setShopName] = useState<string>("My Store");
  const [gscConnected, setGscConnected] = useState<boolean | null>(null);
  const [ga4Connected, setGa4Connected] = useState<boolean | null>(null);
  const [metaConnected, setMetaConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (d.shop) setShopName(d.shop.replace(".myshopify.com", "")); })
      .catch(() => {});

    fetch("/api/google/sites")
      .then(r => r.json())
      .then(d => {
        setGscConnected(!!d.gscConnected);
        setGa4Connected(!!d.ga4Connected);
      })
      .catch(() => { setGscConnected(false); setGa4Connected(false); });

    fetch("/api/meta/accounts")
      .then(r => r.json())
      .then(d => setMetaConnected(!d.error))
      .catch(() => setMetaConnected(false));
  }, []);

  function resolveDot(dot: string | null): string | null {
    if (dot === "google_gsc") return gscConnected == null ? null : gscConnected ? "on" : "off";
    if (dot === "google_ga4") return ga4Connected == null ? null : ga4Connected ? "on" : "off";
    if (dot === "meta") return metaConnected == null ? null : metaConnected ? "on" : "off";
    return dot;
  }

  const liveCount = 1 + (gscConnected ? 1 : 0) + (ga4Connected ? 1 : 0) + (metaConnected ? 1 : 0);

  return (
    <aside className="w-[218px] min-w-[218px] bg-white dark:bg-[#111111] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-3 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center text-white">
          <Activity size={14} />
        </div>
        <div>
          <div className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">Skylitee</div>
          <div className="text-[11px] text-[#A1A1AA] tracking-wide">Analytics Platform</div>
        </div>
      </div>

      {/* Store switcher */}
      <div className="mx-2 mt-2.5 bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl px-2.5 py-1.5 flex items-center justify-between border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-[#EBEBEB] dark:hover:bg-[#262626] transition-colors">
        <span className="text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{shopName}</span>
        <ChevronDown size={10} className="text-[#A1A1AA] shrink-0" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] font-bold text-[#A1A1AA] dark:text-[#525252] px-3 pt-3 pb-1 uppercase tracking-[0.1em]">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const dot = resolveDot(item.dot);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-[13px] transition-all relative cursor-pointer mx-1 rounded-lg",
                    isActive
                      ? "bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C] dark:text-[#FB923C] font-semibold"
                      : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#F97316] rounded-r-full" />
                  )}
                  <Icon size={13} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn("text-[11px] px-1.5 py-px rounded-full font-semibold", badgeStyles[item.badge.color])}>
                      {item.badge.text}
                    </span>
                  )}
                  {dot && (
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[dot as keyof typeof dotStyles])} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-black/[0.06] dark:border-white/[0.06] text-[12px] text-[#A1A1AA]">
        <div className="dark:text-[#71717A]">Shopify live sync</div>
        <div className="flex items-center gap-1 mt-0.5 text-[#EA580C] dark:text-[#FB923C] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
          {liveCount} of 5 platforms live
        </div>
      </div>
    </aside>
  );
}
