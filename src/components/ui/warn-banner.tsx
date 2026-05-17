"use client";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

type WarnType = "amber" | "red" | "blue" | "green";

const styles: Record<WarnType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  amber: { bg: "bg-[#faecd7]", border: "border-[#f5c06a]", text: "text-[#5c3608]", icon: <AlertTriangle size={14} className="shrink-0" /> },
  red: { bg: "bg-[#fce8e8]", border: "border-[#f5a0a0]", text: "text-[#6e1c1c]", icon: <AlertCircle size={14} className="shrink-0" /> },
  blue: { bg: "bg-[#e4eef9]", border: "border-[#a0c0f0]", text: "text-[#0a3d7a]", icon: <Info size={14} className="shrink-0" /> },
  green: { bg: "bg-[#e0f5ee]", border: "border-[#9FE1CB]", text: "text-[#064d38]", icon: <CheckCircle size={14} className="shrink-0" /> },
};

export function WarnBanner({ type = "amber", children }: { type?: WarnType; children: React.ReactNode }) {
  const s = styles[type];
  return (
    <div className={cn("flex items-start gap-2 p-2.5 rounded-lg border text-[13px] mb-3", s.bg, s.border, s.text)}>
      {s.icon}
      <span>{children}</span>
    </div>
  );
}
