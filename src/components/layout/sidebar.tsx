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
  Plug, Activity, ChevronDown
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Command Center", icon: LayoutDashboard, badge: null, dot: null },
      { href: "/dashboard/anomaly", label: "Anomaly Feed", icon: Radar, badge: { text: "5", color: "red" }, dot: null },
      { href: "/dashboard/insights", label: "AI Insights", icon: Brain, badge: { text: "11", color: "amber" }, dot: null },
      { href: "/dashboard/chat", label: "AI Assistant", icon: MessageSquareText, badge: { text: "New", color: "green" }, dot: null },
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
      { href: "/dashboard/meta", label: "Meta Campaigns", icon: Share2, badge: null, dot: "off" },
      { href: "/dashboard/placement", label: "Ads Placement", icon: Layout, badge: null, dot: "off" },
      { href: "/dashboard/creative", label: "Creative Studio", icon: Palette, badge: null, dot: "off" },
      { href: "/dashboard/timing", label: "Time Intelligence", icon: Clock, badge: null, dot: "off" },
    ],
  },
  {
    label: "Google",
    items: [
      { href: "/dashboard/gads", label: "Google Ads", icon: Megaphone, badge: null, dot: "off" },
      { href: "/dashboard/gsc", label: "Search Console", icon: Search, badge: null, dot: "off" },
      { href: "/dashboard/ga4", label: "Analytics GA4", icon: LineChart, badge: null, dot: "off" },
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
    ],
  },
];

const badgeStyles = {
  red: "bg-[#d94040] text-white",
  amber: "bg-[#faecd7] text-[#5c3608]",
  green: "bg-[#e0f5ee] text-[#064d38]",
};

const dotStyles = {
  on: "bg-[#17a773]",
  off: "bg-[#d94040]",
  warn: "bg-[#e89820]",
};

export function Sidebar() {
  const pathname = usePathname();
  const [shopName, setShopName] = useState<string>("My Store");

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (d.shop) setShopName(d.shop.replace(".myshopify.com", "")); })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-[218px] min-w-[218px] bg-white border-r border-black/[0.09] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-3 py-3.5 border-b border-black/[0.09] flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#17a773] rounded-lg flex items-center justify-center text-white">
          <Activity size={14} />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[#181816]">Skylitee</div>
          <div className="text-[10px] text-[#9e9e9a] tracking-wide">Analytics Platform</div>
        </div>
      </div>

      {/* Brand selector */}
      <div className="mx-2 mt-2.5 bg-[#f7f7f5] rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-black/[0.09] cursor-pointer hover:bg-[#f1f0ed] transition-colors">
        <span className="text-[12px] font-semibold text-[#181816]">{shopName}</span>
        <ChevronDown size={10} className="text-[#9e9e9a]" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] font-semibold text-[#9e9e9a] px-3 pt-2 pb-1 uppercase tracking-widest">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[12px] transition-all relative cursor-pointer",
                    isActive
                      ? "bg-[#e0f5ee] text-[#0d6b4f] font-medium"
                      : "text-[#686864] hover:bg-[#f7f7f5] hover:text-[#181816]"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#17a773] rounded-r" />
                  )}
                  <Icon size={13} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn("text-[10px] px-1.5 py-px rounded-full font-semibold", badgeStyles[item.badge.color as keyof typeof badgeStyles])}>
                      {item.badge.text}
                    </span>
                  )}
                  {item.dot && (
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[item.dot as keyof typeof dotStyles])} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-black/[0.09] text-[11px] text-[#9e9e9a]">
        <div>Shopify live sync</div>
        <div className="flex items-center gap-1 mt-0.5 text-[#0d6b4f] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#17a773]" />
          1 of 5 platforms live
        </div>
      </div>
    </aside>
  );
}
