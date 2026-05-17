"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { BarRow } from "@/components/ui/bar-row";
import { placements, ageGroups } from "@/lib/mock-data";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function PlacementPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Ads Placement</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Meta placement intelligence · Aug 1–19, 2025</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
            <FileSpreadsheet size={12} /> CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
            <FileText size={12} /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardHeader title="Purchases by placement" />
          {placements.map((p, i) => (
            <BarRow key={i} label={p.name} pct={p.pct} value={p.purchases.toString()} color={["green", "blue", "purple", "teal", "amber"][i] as "green" | "blue" | "purple" | "teal" | "amber"} />
          ))}
        </Card>

        <Card>
          <CardHeader title="Age distribution" />
          {ageGroups.map((a, i) => (
            <BarRow key={i} label={a.age} pct={a.pct} value={a.purchases.toString()} color={["green", "blue", "teal", "purple", "amber"][i] as "green" | "blue" | "teal" | "purple" | "amber"} />
          ))}
        </Card>

        <Card>
          <CardHeader title="Device split" />
          <BarRow label="Android" pct={100} value="128" color="green" />
          <BarRow label="iPhone" pct={52} value="66" color="blue" />
          <BarRow label="Desktop" pct={2} value="2" color="amber" />
          <div className="mt-2 text-center p-2.5 bg-[#f7f7f5] rounded-lg">
            <div className="text-2xl font-bold text-[#181816]">97%</div>
            <div className="text-[10px] text-[#686864]">Mobile traffic</div>
          </div>
          <InsightCard type="info" title="97% mobile — fix mobile UX first, then scale" body="All ad spend drives mobile traffic. Ensure your product pages load in under 3 seconds and have a sticky Add-to-Cart button before increasing budget." />
        </Card>
      </div>
    </div>
  );
}
