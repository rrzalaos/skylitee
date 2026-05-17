"use client";
import { NotConnected } from "@/components/ui/not-connected";

export default function AttributionPage() {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Channel Attribution</h2>
        <p className="text-[12px] text-[#686864] mt-0.5">Cross-channel customer journey · last-click model</p>
      </div>
      <NotConnected
        platform="attribution"
        label="Meta + Google Ads"
        description="Attribution requires at least one ad platform connected. Connect Meta or Google Ads to see customer journey paths, touchpoint analysis, and multi-model attribution."
      />
    </div>
  );
}
