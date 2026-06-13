"use client";
import { cn } from "@/lib/utils";

type InsightType = "default" | "warning" | "danger" | "info" | "purple" | "teal" | "pink";

const borderColors: Record<InsightType, string> = {
  default: "border-l-[#F97316]",
  warning: "border-l-[#EAB308]",
  danger: "border-l-[#EF4444]",
  info: "border-l-[#3B82F6]",
  purple: "border-l-[#8B5CF6]",
  teal: "border-l-[#14B8A6]",
  pink: "border-l-[#EC4899]",
};

interface InsightCardProps {
  title: string;
  body: string;
  type?: InsightType;
  action?: string;
}

export function InsightCard({ title, body, type = "default", action }: InsightCardProps) {
  return (
    <div className={cn(
      "bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-r-xl p-3 mb-2 border-l-[3px]",
      borderColors[type]
    )}>
      <div className="text-[16px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">{title}</div>
      <div className="text-[15px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{body}</div>
      {action && (
        <div className="text-[15px] text-[#F97316] font-semibold mt-1.5 cursor-pointer flex items-center gap-1">→ {action}</div>
      )}
    </div>
  );
}
