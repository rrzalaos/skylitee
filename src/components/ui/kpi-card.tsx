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
    <div className="relative bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden group cursor-default">
      {/* Orange accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F97316] via-[#FB923C] to-transparent" />
      {/* Glow orb background */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#F97316] opacity-[0.05] rounded-full group-hover:opacity-[0.09] transition-opacity" />

      <div className="relative">
        <div className="text-[11px] font-bold text-[#A1A1AA] dark:text-[#71717A] mb-3 uppercase tracking-[0.12em] flex items-center gap-1.5">
          {icon && <span className="opacity-70">{icon}</span>}
          {label}
        </div>
        <div className="text-[28px] font-black text-[#18181B] dark:text-[#F4F4F5] leading-none tracking-tight">
          {value}
        </div>
        {change !== undefined && (
          <div className={cn(
            "inline-flex items-center gap-1 text-[11px] mt-2.5 px-2 py-0.5 rounded-full font-bold",
            isUp
              ? "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]"
              : "bg-[#FEF2F2] text-[#DC2626] dark:bg-[#2D0A0A] dark:text-[#FCA5A5]"
          )}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {changeLabel || (isUp ? `+${change}%` : `${change}%`)}
          </div>
        )}
        {sub && <div className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] mt-1.5">{sub}</div>}
      </div>
    </div>
  );
}
