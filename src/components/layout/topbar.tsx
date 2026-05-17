"use client";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw, Bell, ChevronDown, Calendar, Sun, Moon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDateRange, DatePreset } from "@/lib/date-range-context";
import { useTheme } from "@/lib/theme-context";

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

const presets: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "28d", label: "Last 28 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "custom", label: "Custom range" },
];

const compareOptions = [
  { id: "prev_period", label: "vs Previous period" },
  { id: "yesterday", label: "vs Yesterday" },
  { id: "last_week", label: "vs Last week" },
  { id: "last_month", label: "vs Last month" },
  { id: "last_year", label: "vs Last year" },
  { id: "goal", label: "vs Goal" },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const title = titles[pathname] || "Skylitee";
  const [toast, setToast] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [connections, setConnections] = useState({ shopify: false, meta: false, gsc: false, ga4: false });
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const { range, setPreset, setCustomRange, compareWith, setCompareWith } = useDateRange();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (d.shop) setConnections(c => ({ ...c, shopify: true })); })
      .catch(() => {});

    fetch("/api/meta/accounts")
      .then(r => r.json())
      .then(d => { setConnections(c => ({ ...c, meta: !d.error })); })
      .catch(() => {});

    fetch("/api/google/sites")
      .then(r => r.json())
      .then(d => {
        setConnections(c => ({
          ...c,
          gsc: !!(d.gscConnected ?? (d.gscSites?.length > 0)),
          ga4: !!(d.ga4Connected ?? (d.ga4Properties?.length > 0)),
        }));
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const handlePreset = (id: DatePreset) => {
    setPreset(id);
    if (id !== "custom") setShowDatePicker(false);
  };

  const applyCustom = () => {
    if (customFrom && customTo) {
      setCustomRange(customFrom, customTo);
      setShowDatePicker(false);
    }
  };

  const platforms = [
    { label: "Shopify", connected: connections.shopify },
    { label: "Meta", connected: connections.meta },
    { label: "GSC", connected: connections.gsc },
    { label: "GA4", connected: connections.ga4 },
    { label: "G.Ads", connected: false },
  ];

  return (
    <>
      <header className="bg-white dark:bg-[#111111] border-b border-black/[0.06] dark:border-white/[0.06] px-4 h-12 flex items-center gap-2 sticky top-0 z-20">
        <h1 className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5] flex-1 uppercase tracking-wider">{title}</h1>

        {/* Date picker */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-black/[0.08] dark:border-white/[0.08] rounded-lg text-[13px] text-[#71717A] dark:text-[#A1A1AA] bg-[#F5F5F4] dark:bg-[#1C1C1C] hover:bg-[#EBEBEB] dark:hover:bg-[#262626] transition-colors"
          >
            <Calendar size={11} />
            {range.label}
            <ChevronDown size={10} />
          </button>

          {showDatePicker && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-lg z-50 py-1.5 min-w-[200px]">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors ${
                    range.preset === p.id
                      ? "font-semibold text-[#EA580C] bg-[#FFF7ED] dark:bg-[#2A1A0E] dark:text-[#FB923C]"
                      : "text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F5F4] dark:hover:bg-[#262626]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {range.preset === "custom" && (
                <div className="px-3.5 pb-2.5 pt-1.5 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1.5">
                  <div className="text-[12px] text-[#71717A] font-semibold pt-1">From</div>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="w-full text-[13px] border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#262626] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#F97316]"
                  />
                  <div className="text-[12px] text-[#71717A] font-semibold">To</div>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="w-full text-[13px] border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#262626] text-[#18181B] dark:text-[#F4F4F5] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#F97316]"
                  />
                  <button
                    onClick={applyCustom}
                    disabled={!customFrom || !customTo}
                    className="w-full py-1.5 bg-[#F97316] text-white rounded-lg text-[13px] font-semibold disabled:opacity-40 hover:bg-[#EA580C] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compare */}
        <select
          value={compareWith}
          onChange={e => setCompareWith(e.target.value)}
          className="text-[13px] px-2.5 py-1.5 border border-black/[0.08] dark:border-white/[0.08] rounded-lg bg-[#F5F5F4] dark:bg-[#1C1C1C] text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#F97316]"
        >
          {compareOptions.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>

        {/* Platform pills */}
        {platforms.map((p) => (
          <div
            key={p.label}
            onClick={() => !p.connected && router.push("/dashboard/connections")}
            title={p.connected ? `${p.label} connected` : `${p.label} not connected — click to connect`}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              p.connected
                ? "bg-[#F5F5F4] dark:bg-[#1C1C1C] border-black/[0.06] dark:border-white/[0.06] text-[#52525B] dark:text-[#A1A1AA]"
                : "bg-[#FEF2F2] dark:bg-[#2D0A0A] border-[#FCA5A5] dark:border-[#991B1B] text-[#991B1B] dark:text-[#FCA5A5] cursor-pointer hover:bg-[#FEE2E2] dark:hover:bg-[#3D0F0F]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${p.connected ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
            {p.label}
          </div>
        ))}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Refresh */}
        <button
          onClick={() => { showToast("Refreshing data..."); window.location.reload(); }}
          className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors"
        >
          <RefreshCw size={14} />
        </button>

        {/* Bell */}
        <button className="w-8 h-8 rounded-lg border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors relative">
          <Bell size={14} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-[13px] font-bold text-white cursor-pointer">
          S
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] px-3.5 py-2 rounded-xl text-[13px] font-semibold z-50 flex items-center gap-2 shadow-xl">
          ✓ {toast}
        </div>
      )}
    </>
  );
}
