"use client";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  sub?: string;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, change, changeLabel, sub, icon }: KPICardProps) {
  const isUp = change !== undefined && change >= 0;
  return (
    <div className="bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[12px] font-semibold text-[#71717A] dark:text-[#A1A1AA] mb-2 uppercase tracking-wider flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="text-[26px] font-bold text-[#18181B] dark:text-[#F4F4F5] leading-none tracking-tight">{value}</div>
      {change !== undefined && (
        <div className={cn("text-[12px] mt-2 font-semibold flex items-center gap-1", isUp ? "text-[#F97316]" : "text-[#EF4444]")}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {changeLabel || (isUp ? `+${change}%` : `${change}%`)}
        </div>
      )}
      {sub && <div className="text-[12px] text-[#A1A1AA] dark:text-[#71717A] mt-1">{sub}</div>}
    </div>
  );
}
