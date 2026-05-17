"use client";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "amber" | "blue" | "purple" | "teal" | "pink" | "gray";

const variants: Record<BadgeVariant, string> = {
  green: "bg-[#e0f5ee] text-[#064d38]",
  red: "bg-[#fce8e8] text-[#6e1c1c]",
  amber: "bg-[#faecd7] text-[#5c3608]",
  blue: "bg-[#e4eef9] text-[#0a3d7a]",
  purple: "bg-[#eceafb] text-[#32297a]",
  teal: "bg-[#e0f3f5] text-[#0a4a50]",
  pink: "bg-[#fae8ef] text-[#5c1a30]",
  gray: "bg-[#f1efe8] text-[#3c3c39]",
};

export function Badge({ variant = "gray", children, className }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap", variants[variant], className)}>
      {children}
    </span>
  );
}
