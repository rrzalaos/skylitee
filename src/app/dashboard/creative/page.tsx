"use client";
import { NotConnected } from "@/components/ui/not-connected";

export default function CreativePage() {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Creative Studio</h2>
        <p className="text-[12px] text-[#686864] mt-0.5">AI creative scoring · fatigue detection · performance ranking</p>
      </div>
      <NotConnected
        platform="meta"
        label="Meta Business Suite"
        description="Connect Meta to analyse creative fatigue, score your ad creatives 0–100, and get AI-powered recommendations on what to refresh or scale."
      />
    </div>
  );
}
