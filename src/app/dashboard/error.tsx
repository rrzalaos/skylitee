"use client";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-12 h-12 bg-[#FEF2F2] dark:bg-[#2D0A0A] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#FCA5A5] dark:border-[#991B1B]">
          <AlertCircle size={20} className="text-[#EF4444]" />
        </div>
        <div className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">Something went wrong</div>
        <div className="text-[13px] text-[#71717A] dark:text-[#A1A1AA] mb-4">The dashboard couldn&apos;t load. Try refreshing.</div>
        <div className="flex items-center gap-2 justify-center">
          <button onClick={reset} className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-[13px] font-semibold hover:bg-[#EA580C] transition-colors">
            Try again
          </button>
          <Link href="/dashboard/connections" className="px-4 py-2 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-[13px] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
            Check connections
          </Link>
        </div>
      </div>
    </div>
  );
}
