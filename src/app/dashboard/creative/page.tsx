"use client";
import { useEffect, useState } from "react";
import { NotConnected } from "@/components/ui/not-connected";
import { Card } from "@/components/ui/card";
import { Palette, Clock } from "lucide-react";

export default function CreativePage() {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch("/api/meta/accounts")
      .then(r => r.json())
      .then(d => setConnected(!d.error))
      .catch(() => setConnected(false))
      .finally(() => setChecking(false));
  }, []);

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Creative Studio</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">AI creative scoring · fatigue detection · performance ranking</p>
      </div>

      {checking ? (
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading…</div>
      ) : !connected ? (
        <NotConnected
          platform="meta"
          label="Meta Business Suite"
          description="Connect Meta to analyse creative fatigue, score your ad creatives 0–100, and get AI-powered recommendations on what to refresh or scale."
        />
      ) : (
        <Card>
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 bg-[#f0f5ff] rounded-2xl flex items-center justify-center mb-4 border border-black/[0.09] text-[#1877F2]">
              <Palette size={26} />
            </div>
            <div className="text-[16px] font-semibold text-[#181816] mb-1.5">Meta Ads connected</div>
            <div className="text-[15px] text-[#686864] max-w-sm leading-relaxed">
              Creative-level scoring, fatigue detection, and AI recommendations are coming soon.
              Your ad creatives and performance data are ready to analyse.
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[14px] text-[#9e9e9a]">
              <Clock size={13} /> Available in next update
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
