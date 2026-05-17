"use client";
import { useEffect, useState } from "react";
import { NotConnected } from "@/components/ui/not-connected";
import { Card } from "@/components/ui/card";
import { Share2, Megaphone, Clock } from "lucide-react";

export default function AttributionPage() {
  const [checking, setChecking] = useState(true);
  const [metaConnected, setMetaConnected] = useState(false);

  useEffect(() => {
    fetch("/api/meta/accounts")
      .then(r => r.json())
      .then(d => setMetaConnected(!d.error))
      .catch(() => setMetaConnected(false))
      .finally(() => setChecking(false));
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Channel Attribution</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Cross-channel customer journey · last-click model</p>
      </div>

      {checking ? (
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading…</div>
      ) : !metaConnected ? (
        <NotConnected
          platform="attribution"
          label="Meta + Google Ads"
          description="Attribution requires at least one ad platform connected. Connect Meta or Google Ads to see customer journey paths, touchpoint analysis, and multi-model attribution."
        />
      ) : (
        <Card>
          <div className="flex flex-col items-center py-14 text-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#e8f0fd] rounded-2xl flex items-center justify-center border border-black/[0.09] text-[#1877F2]">
                <Share2 size={22} />
              </div>
              <div className="text-[#9e9e9a] text-lg">+</div>
              <div className="w-12 h-12 bg-[#f7f7f5] rounded-2xl flex items-center justify-center border border-black/[0.09] text-[#9e9e9a]">
                <Megaphone size={22} />
              </div>
            </div>
            <div className="text-[16px] font-semibold text-[#181816] mb-1.5">Meta connected · Google Ads pending</div>
            <div className="text-[15px] text-[#686864] max-w-sm leading-relaxed">
              Multi-channel attribution analysis is coming soon. Once Google Ads is also connected, you&apos;ll see full customer journey paths and last-click vs linear model comparisons.
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[14px] text-[#9e9e9a]">
              <Clock size={13} /> Available when Google Ads is connected
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
