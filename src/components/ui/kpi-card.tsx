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
    <div className="bg-white border border-black/[0.09] rounded-xl p-3.5 hover:shadow-sm transition-shadow">
      <div className="text-[12px] text-[#686864] mb-1.5 flex items-center gap-1 font-medium">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="text-2xl font-semibold text-[#181816] leading-tight">{value}</div>
      {change !== undefined && (
        <div className={cn("text-[12px] mt-1 font-semibold flex items-center gap-1", isUp ? "text-[#0d6b4f]" : "text-[#d94040]")}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {changeLabel || (isUp ? `+${change}% vs last mo` : `${change}% vs last mo`)}
        </div>
      )}
      {sub && <div className="text-[11px] text-[#9e9e9a] mt-0.5">{sub}</div>}
    </div>
  );
}
