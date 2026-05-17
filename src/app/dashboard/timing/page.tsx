"use client";
import { NotConnected } from "@/components/ui/not-connected";

export default function TimingPage() {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Time Intelligence</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Best hours &amp; days to run ads · based on your conversion data</p>
      </div>
      <NotConnected
        platform="meta"
        label="Meta Business Suite"
        description="Connect Meta to see hourly conversion heatmaps and discover the best time windows to maximise your ad budget — day-parting recommendations included."
      />
    </div>
  );
}
