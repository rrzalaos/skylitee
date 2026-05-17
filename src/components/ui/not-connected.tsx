"use client";
import Link from "next/link";
import { Share2, Megaphone, BarChart2 } from "lucide-react";

const config: Record<string, { icon: React.ReactNode; accentColor: string }> = {
  meta: { icon: <Share2 size={26} />, accentColor: "text-[#1877F2]" },
  gads: { icon: <Megaphone size={26} />, accentColor: "text-[#34A853]" },
  attribution: { icon: <BarChart2 size={26} />, accentColor: "text-[#686864]" },
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
  const cfg = config[platform] ?? { icon: <Share2 size={26} />, accentColor: "text-[#686864]" };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-black/[0.09] rounded-xl">
      <div className={`w-14 h-14 bg-[#f7f7f5] rounded-2xl flex items-center justify-center mb-4 border border-black/[0.09] ${cfg.accentColor}`}>
        {cfg.icon}
      </div>
      <h3 className="text-[14px] font-semibold text-[#181816] mb-1.5">{label} not connected</h3>
      <p className="text-[12px] text-[#686864] mb-6 max-w-xs leading-relaxed px-4">
        {description ?? `Connect ${label} to unlock real campaign data, performance metrics, and AI-powered recommendations.`}
      </p>
      <Link href="/dashboard/connections">
        <button className="px-5 py-2.5 bg-[#17a773] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d6b4f] transition-colors">
          Go to Connections
        </button>
      </Link>
    </div>
  );
}
