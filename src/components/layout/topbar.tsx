"use client";
import { usePathname } from "next/navigation";
import { RefreshCw, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";

const titles: Record<string, string> = {
  "/dashboard": "Command Center",
  "/dashboard/anomaly": "Anomaly Feed",
  "/dashboard/insights": "AI Insights Engine",
  "/dashboard/chat": "AI Assistant",
  "/dashboard/sales": "Sales Report",
  "/dashboard/goals": "Monthly Goals",
  "/dashboard/products": "Product Analytics",
  "/dashboard/customers": "Customer Intelligence",
  "/dashboard/cohort": "Cohort Analysis",
  "/dashboard/geo": "Geo Performance",
  "/dashboard/meta": "Meta Campaigns",
  "/dashboard/placement": "Ads Placement",
  "/dashboard/creative": "Creative Studio",
  "/dashboard/timing": "Time Intelligence",
  "/dashboard/gads": "Google Ads",
  "/dashboard/gsc": "Search Console",
  "/dashboard/ga4": "Analytics GA4",
  "/dashboard/attribution": "Attribution",
  "/dashboard/financial": "Financial P&L",
  "/dashboard/benchmarking": "Benchmarking",
  "/dashboard/weekly": "Weekly Digest",
  "/dashboard/connections": "Connections",
};

const platforms = [
  { label: "Shopify", connected: true },
  { label: "Meta", connected: true },
  { label: "GSC", connected: true },
  { label: "GA4", connected: true },
  { label: "G.Ads", connected: false },
];

export function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] || "Skylitee";
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  return (
    <>
      <header className="bg-white border-b border-black/[0.09] px-4 h-13 flex items-center gap-2 sticky top-0 z-20">
        <h1 className="text-[14px] font-semibold text-[#181816] flex-1">{title}</h1>

        {/* Date picker */}
        <button className="flex items-center gap-1 px-3 py-1.5 border border-black/[0.09] rounded-lg text-[12px] text-[#686864] bg-[#f7f7f5] hover:bg-[#f1f0ed] transition-colors">
          Aug 1–19, 2025 <ChevronDown size={10} />
        </button>

        {/* Compare */}
        <select className="text-[12px] px-2.5 py-1.5 border border-black/[0.09] rounded-lg bg-[#f7f7f5] text-[#181816]">
          <option>vs Last Month</option>
          <option>vs Last Year</option>
          <option>vs Goal</option>
        </select>

        {/* Platform pills */}
        {platforms.map((p) => (
          <div
            key={p.label}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${
              p.connected
                ? "bg-[#f7f7f5] border-black/[0.09] text-[#0d6b4f]"
                : "bg-[#fce8e8] border-[#f5a0a0] text-[#6e1c1c] cursor-pointer"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${p.connected ? "bg-[#17a773]" : "bg-[#d94040]"}`} />
            {p.label}
          </div>
        ))}

        {/* Refresh */}
        <button
          onClick={() => showToast("Data refreshed successfully")}
          className="w-8 h-8 rounded-lg border border-black/[0.09] flex items-center justify-center text-[#686864] hover:bg-[#f7f7f5] transition-colors"
        >
          <RefreshCw size={14} />
        </button>

        {/* Bell */}
        <button className="w-8 h-8 rounded-lg border border-black/[0.09] flex items-center justify-center text-[#686864] hover:bg-[#f7f7f5] transition-colors relative">
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#d94040] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#9FE1CB] flex items-center justify-center text-[11px] font-semibold text-[#064d38] cursor-pointer">
          FB
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181e] text-white px-3.5 py-2 rounded-lg text-[12px] font-medium z-50 flex items-center gap-2 shadow-lg">
          ✓ {toast}
        </div>
      )}
    </>
  );
}
