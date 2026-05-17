"use client";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw, Bell, ChevronDown, Calendar } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDateRange, DatePreset } from "@/lib/date-range-context";

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

    fetch("/api/google/sites")
      .then(r => r.json())
      .then(d => {
        if (d.gscSites) {
          setConnections(c => ({
            ...c,
            gsc: d.gscSites.length > 0,
            ga4: (d.ga4Properties?.length ?? 0) > 0,
          }));
        }
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
      <header className="bg-white border-b border-black/[0.09] px-4 h-13 flex items-center gap-2 sticky top-0 z-20">
        <h1 className="text-[14px] font-semibold text-[#181816] flex-1">{title}</h1>

        {/* Date picker */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-black/[0.09] rounded-lg text-[15px] text-[#686864] bg-[#f7f7f5] hover:bg-[#f1f0ed] transition-colors"
          >
            <Calendar size={11} />
            {range.label}
            <ChevronDown size={10} />
          </button>

          {showDatePicker && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-black/[0.09] rounded-xl shadow-lg z-50 py-1.5 min-w-[200px]">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  className={`w-full text-left px-3.5 py-2 text-[15px] hover:bg-[#f7f7f5] transition-colors ${
                    range.preset === p.id ? "font-semibold text-[#0d6b4f] bg-[#f0faf5]" : "text-[#181816]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {range.preset === "custom" && (
                <div className="px-3.5 pb-2.5 pt-1.5 border-t border-black/[0.06] space-y-1.5">
                  <div className="text-[13px] text-[#686864] font-medium pt-1">From</div>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="w-full text-[14px] border border-black/[0.12] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#17a773]"
                  />
                  <div className="text-[13px] text-[#686864] font-medium">To</div>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="w-full text-[14px] border border-black/[0.12] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#17a773]"
                  />
                  <button
                    onClick={applyCustom}
                    disabled={!customFrom || !customTo}
                    className="w-full py-1.5 bg-[#17a773] text-white rounded-lg text-[14px] font-semibold disabled:opacity-50 hover:bg-[#0d6b4f] transition-colors"
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
          className="text-[15px] px-2.5 py-1.5 border border-black/[0.09] rounded-lg bg-[#f7f7f5] text-[#181816]"
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[14px] border transition-colors ${
              p.connected
                ? "bg-[#f7f7f5] border-black/[0.09] text-[#0d6b4f]"
                : "bg-[#fce8e8] border-[#f5a0a0] text-[#6e1c1c] cursor-pointer hover:bg-[#fbd5d5]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${p.connected ? "bg-[#17a773]" : "bg-[#d94040]"}`} />
            {p.label}
          </div>
        ))}

        {/* Refresh */}
        <button
          onClick={() => { showToast("Refreshing data..."); window.location.reload(); }}
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
        <div className="w-8 h-8 rounded-full bg-[#9FE1CB] flex items-center justify-center text-[14px] font-semibold text-[#064d38] cursor-pointer">
          S
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181e] text-white px-3.5 py-2 rounded-lg text-[15px] font-medium z-50 flex items-center gap-2 shadow-lg">
          ✓ {toast}
        </div>
      )}
    </>
  );
}
