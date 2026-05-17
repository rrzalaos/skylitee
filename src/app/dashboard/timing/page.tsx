"use client";
import { useEffect, useState } from "react";
import { NotConnected } from "@/components/ui/not-connected";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function TimingPage() {
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
        <h2 className="text-lg font-semibold">Time Intelligence</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Best hours &amp; days to run ads · based on your conversion data</p>
      </div>

      {checking ? (
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading…</div>
      ) : !connected ? (
        <NotConnected
          platform="meta"
          label="Meta Business Suite"
          description="Connect Meta to see hourly conversion heatmaps and discover the best time windows to maximise your ad budget — day-parting recommendations included."
        />
      ) : (
        <Card>
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 bg-[#f0f5ff] rounded-2xl flex items-center justify-center mb-4 border border-black/[0.09] text-[#1877F2]">
              <Clock size={26} />
            </div>
            <div className="text-[16px] font-semibold text-[#181816] mb-1.5">Meta Ads connected</div>
            <div className="text-[15px] text-[#686864] max-w-sm leading-relaxed">
              Hourly conversion heatmaps, day-parting recommendations, and peak-hour analysis are coming soon.
              Your campaign data is ready to analyse.
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
