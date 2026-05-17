"use client";
import { NotConnected } from "@/components/ui/not-connected";

export default function PlacementPage() {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Ads Placement</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Meta placement intelligence · placement breakdown</p>
      </div>
      <NotConnected
        platform="meta"
        label="Meta Business Suite"
        description="Connect Meta to see which placements (Reels, Feed, Stories, Audience Network) are driving the best ROAS and conversion rates."
      />
    </div>
  );
}
