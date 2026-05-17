"use client";
import { NotConnected } from "@/components/ui/not-connected";

export default function MetaPage() {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Meta Campaigns</h2>
        <p className="text-[12px] text-[#686864] mt-0.5">Meta Business Suite · Campaign performance</p>
      </div>
      <NotConnected
        platform="meta"
        label="Meta Business Suite"
        description="Connect Meta to see real campaign spend, ROAS, ad performance, and get AI recommendations on which campaigns to scale or pause."
      />
    </div>
  );
}
