"use client";
import Link from "next/link";
import { Share2, Megaphone, BarChart2 } from "lucide-react";

const config: Record<string, { icon: React.ReactNode; accentColor: string }> = {
  meta: { icon: <Share2 size={26} />, accentColor: "text-[#1877F2]" },
  gads: { icon: <Megaphone size={26} />, accentColor: "text-[#34A853]" },
  attribution: { icon: <BarChart2 size={26} />, accentColor: "text-[#71717A]" },
};

export function NotConnected({
  platform,
  label,
  description,
}: {
  platform: string;
  label: string;
  description?: string;
}) {
  const cfg = config[platform] ?? { icon: <Share2 size={26} />, accentColor: "text-[#71717A]" };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl">
      <div className={`w-14 h-14 bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-2xl flex items-center justify-center mb-4 border border-black/[0.06] dark:border-white/[0.06] ${cfg.accentColor}`}>
        {cfg.icon}
      </div>
      <h3 className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1.5">{label} not connected</h3>
      <p className="text-[13px] text-[#71717A] dark:text-[#A1A1AA] mb-6 max-w-xs leading-relaxed px-4">
        {description ?? `Connect ${label} to unlock real campaign data, performance metrics, and AI-powered recommendations.`}
      </p>
      <Link href="/dashboard/connections">
        <button className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[13px] font-semibold hover:bg-[#EA580C] transition-colors">
          Go to Connections
        </button>
      </Link>
    </div>
  );
}
