"use client";
import { cn } from "@/lib/utils";

type InsightType = "default" | "warning" | "danger" | "info" | "purple" | "teal" | "pink";

const borderColors: Record<InsightType, string> = {
  default: "border-l-[#17a773]",
  warning: "border-l-[#e89820]",
  danger: "border-l-[#d94040]",
  info: "border-l-[#3478d4]",
  purple: "border-l-[#6b62d4]",
  teal: "border-l-[#1494a0]",
  pink: "border-l-[#c4446a]",
};

interface InsightCardProps {
  title: string;
  body: string;
  type?: InsightType;
  action?: string;
}

export function InsightCard({ title, body, type = "default", action }: InsightCardProps) {
  return (
    <div className={cn("bg-[#f7f7f5] rounded-r-lg p-3 mb-2 border-l-[3px]", borderColors[type])}>
      <div className="text-[16px] font-semibold text-[#181816]">{title}</div>
      <div className="text-[15px] text-[#686864] mt-0.5 leading-relaxed">{body}</div>
      {action && <div className="text-[15px] text-[#0a3d7a] font-semibold mt-1.5 cursor-pointer flex items-center gap-1">→ {action}</div>}
    </div>
  );
}
