"use client";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white border border-black/[0.09] rounded-xl p-4", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="text-[13px] font-semibold text-[#181816]">{title}</div>
      {right && <div className="text-[11px] text-[#686864] font-normal flex items-center gap-1.5">{right}</div>}
    </div>
  );
}
