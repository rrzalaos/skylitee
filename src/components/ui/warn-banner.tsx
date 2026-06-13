"use client";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

type WarnType = "amber" | "red" | "blue" | "green";

const styles: Record<WarnType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  amber: {
    bg: "bg-[#FFFBEB] dark:bg-[#2D1C00]",
    border: "border-[#FCD34D] dark:border-[#92400E]",
    text: "text-[#92400E] dark:text-[#FCD34D]",
    icon: <AlertTriangle size={14} className="shrink-0" />,
  },
  red: {
    bg: "bg-[#FEF2F2] dark:bg-[#2D0A0A]",
    border: "border-[#FCA5A5] dark:border-[#991B1B]",
    text: "text-[#991B1B] dark:text-[#FCA5A5]",
    icon: <AlertCircle size={14} className="shrink-0" />,
  },
  blue: {
    bg: "bg-[#EFF6FF] dark:bg-[#0D1E3D]",
    border: "border-[#93C5FD] dark:border-[#1E40AF]",
    text: "text-[#1E40AF] dark:text-[#93C5FD]",
    icon: <Info size={14} className="shrink-0" />,
  },
  green: {
    bg: "bg-[#F0FDF4] dark:bg-[#052E16]",
    border: "border-[#86EFAC] dark:border-[#166534]",
    text: "text-[#166534] dark:text-[#4ADE80]",
    icon: <CheckCircle size={14} className="shrink-0" />,
  },
};

export function WarnBanner({ type = "amber", children }: { type?: WarnType; children: React.ReactNode }) {
  const s = styles[type];
  return (
    <div className={cn("flex items-start gap-2 p-2.5 rounded-xl border text-[15px] mb-3", s.bg, s.border, s.text)}>
      {s.icon}
      <span>{children}</span>
    </div>
  );
}
