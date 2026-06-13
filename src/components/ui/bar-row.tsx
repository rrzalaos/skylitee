"use client";
import { cn } from "@/lib/utils";

type BarColor = "green" | "blue" | "amber" | "red" | "purple" | "teal" | "pink" | "orange";

const barColors: Record<BarColor, string> = {
  orange: "bg-[#F97316]",
  green: "bg-[#22C55E]",
  blue: "bg-[#3B82F6]",
  amber: "bg-[#EAB308]",
  red: "bg-[#EF4444]",
  purple: "bg-[#8B5CF6]",
  teal: "bg-[#14B8A6]",
  pink: "bg-[#EC4899]",
};

export function BarRow({ label, pct, value, color = "orange" }: { label: string; pct: number; value: string; color?: BarColor }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="text-[15px] text-[#71717A] dark:text-[#A1A1AA] w-28 text-right shrink-0 truncate font-medium">{label}</div>
      <div className="flex-1 bg-[#F5F5F4] dark:bg-[#262626] rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full", barColors[color])} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[15px] text-[#18181B] dark:text-[#F4F4F5] font-semibold w-16 shrink-0">{value}</div>
    </div>
  );
}
