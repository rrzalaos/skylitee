"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type DatePreset = "today" | "yesterday" | "7d" | "28d" | "this_month" | "last_month" | "custom";

export interface DateRange {
  preset: DatePreset;
  from: string;
  to: string;
  label: string;
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sub(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - n);
  return r;
}

export function getPresetRange(preset: DatePreset): Omit<DateRange, "preset"> {
  const today = new Date();
  switch (preset) {
    case "today":
      return { from: fmt(today), to: fmt(today), label: "Today" };
    case "yesterday": {
      const y = sub(today, 1);
      return { from: fmt(y), to: fmt(y), label: "Yesterday" };
    }
    case "7d":
      return { from: fmt(sub(today, 6)), to: fmt(today), label: "Last 7 days" };
    case "28d":
      return { from: fmt(sub(today, 27)), to: fmt(today), label: "Last 28 days" };
    case "this_month": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(first), to: fmt(today), label: "This month" };
    }
    case "last_month": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(first), to: fmt(last), label: "Last month" };
    }
    default:
      return { from: fmt(sub(today, 27)), to: fmt(today), label: "Last 28 days" };
  }
}

interface DateRangeContextType {
  range: DateRange;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  compareWith: string;
  setCompareWith: (v: string) => void;
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const initial = getPresetRange("this_month");
  const [range, setRange] = useState<DateRange>({ preset: "this_month", ...initial });
  const [compareWith, setCompareWith] = useState("prev_period");

  const setPreset = (preset: DatePreset) => {
    if (preset === "custom") {
      setRange(r => ({ ...r, preset: "custom" }));
      return;
    }
    const r = getPresetRange(preset);
    setRange({ preset, ...r });
  };

  const setCustomRange = (from: string, to: string) => {
    if (!from || !to) return;
    const d1 = new Date(from + "T00:00:00");
    const d2 = new Date(to + "T00:00:00");
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const label = `${d1.toLocaleDateString("en-IN", opts)} – ${d2.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
    setRange({ preset: "custom", from, to, label });
  };

  return (
    <DateRangeContext.Provider value={{ range, setPreset, setCustomRange, compareWith, setCompareWith }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}

export function getComparisonRange(range: DateRange, compareWith: string): { from: string; to: string; label: string } | null {
  const from = new Date(range.from + "T00:00:00");
  const to = new Date(range.to + "T00:00:00");
  const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const subDate = (d: Date, n: number): Date => { const r = new Date(d); r.setDate(r.getDate() - n); return r; };

  switch (compareWith) {
    case "prev_period": {
      const compTo = subDate(from, 1);
      const compFrom = subDate(compTo, days - 1);
      return { from: fmt(compFrom), to: fmt(compTo), label: "prev period" };
    }
    case "last_week":
      return { from: fmt(subDate(from, 7)), to: fmt(subDate(to, 7)), label: "last week" };
    case "last_month": {
      const cf = new Date(from); cf.setMonth(cf.getMonth() - 1);
      const ct = new Date(to); ct.setMonth(ct.getMonth() - 1);
      return { from: fmt(cf), to: fmt(ct), label: "last month" };
    }
    case "last_year": {
      const cf = new Date(from); cf.setFullYear(cf.getFullYear() - 1);
      const ct = new Date(to); ct.setFullYear(ct.getFullYear() - 1);
      return { from: fmt(cf), to: fmt(ct), label: "last year" };
    }
    default:
      return null;
  }
}
