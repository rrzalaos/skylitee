"use client";
import { cn } from "@/lib/utils";

type BarColor = "green" | "blue" | "amber" | "red" | "purple" | "teal" | "pink";

const barColors: Record<BarColor, string> = {
  green: "bg-[#17a773]",
  blue: "bg-[#3478d4]",
  amber: "bg-[#e89820]",
  red: "bg-[#d94040]",
  purple: "bg-[#6b62d4]",
  teal: "bg-[#1494a0]",
  pink: "bg-[#c4446a]",
};

export function BarRow({ label, pct, value, color = "green" }: { label: string; pct: number; value: string; color?: BarColor }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[15px] text-[#686864] w-28 text-right shrink-0 truncate font-medium">{label}</div>
      <div className="flex-1 bg-[#f7f7f5] rounded h-2 overflow-hidden">
        <div className={cn("h-full rounded", barColors[color])} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[15px] text-[#181816] font-semibold w-16 shrink-0">{value}</div>
    </div>
  );
}
