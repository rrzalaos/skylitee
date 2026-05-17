"use client";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 shadow-sm",
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="text-[15px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">{title}</div>
      {right && <div className="text-[13px] text-[#71717A] dark:text-[#A1A1AA] font-normal flex items-center gap-1.5">{right}</div>}
    </div>
  );
}
