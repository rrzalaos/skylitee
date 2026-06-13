"use client";
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "amber" | "blue" | "purple" | "teal" | "pink" | "gray" | "orange";

const variants: Record<BadgeVariant, string> = {
  orange: "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]",
  green: "bg-[#F0FDF4] text-[#166534] dark:bg-[#052E16] dark:text-[#4ADE80]",
  red: "bg-[#FEF2F2] text-[#991B1B] dark:bg-[#2D0A0A] dark:text-[#FCA5A5]",
  amber: "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]",
  blue: "bg-[#EFF6FF] text-[#1E40AF] dark:bg-[#0D1E3D] dark:text-[#93C5FD]",
  purple: "bg-[#F5F3FF] text-[#5B21B6] dark:bg-[#1E1344] dark:text-[#C4B5FD]",
  teal: "bg-[#F0FDFA] text-[#134E4A] dark:bg-[#042F2E] dark:text-[#5EEAD4]",
  pink: "bg-[#FDF2F8] text-[#831843] dark:bg-[#2D0A1A] dark:text-[#F9A8D4]",
  gray: "bg-[#F5F5F5] text-[#404040] dark:bg-[#262626] dark:text-[#A3A3A3]",
};

export function Badge({ variant = "gray", children, className }: { variant?: BadgeVariant; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-block text-[13px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap", variants[variant], className)}>
      {children}
    </span>
  );
}
