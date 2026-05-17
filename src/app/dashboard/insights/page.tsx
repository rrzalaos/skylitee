"use client";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { aiInsights } from "@/lib/mock-data";
import { FileText } from "lucide-react";
import { formatINR } from "@/lib/utils";

const typeToInsight: Record<string, "default" | "warning" | "danger" | "info" | "purple" | "teal" | "pink"> = {
  scale: "info", danger: "danger", warning: "warning",
  audience: "purple", seo: "teal", customer: "pink",
};

export default function InsightsPage() {
  const [targetRoas, setTargetRoas] = useState(1.5);
  const projectedRevenue = Math.round(175811 * targetRoas);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">AI Insights</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Top actions to take today · updated every 3 hours</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3">Revenue forecast</div>

          <div className="bg-[#f7f7f5] rounded-xl p-3.5 mb-2.5">
            <div className="text-[12px] text-[#686864] mb-1">Month-end forecast</div>
            <div className="text-2xl font-bold text-[#0d6b4f]">₹4,02,000</div>
            <div className="text-[12px] text-[#d94040] font-medium mt-0.5">₹48K below target · 89% confidence</div>
          </div>

          <div className="bg-[#e4eef9] rounded-xl p-3.5 mb-4">
            <div className="text-[12px] text-[#686864] mb-1">Demand spike: Position Print</div>
            <div className="text-2xl font-bold text-[#0a3d7a]">↑ 28% demand</div>
            <div className="text-[12px] text-[#3478d4] font-medium mt-0.5">Stock up 200 units before Sep 1</div>
          </div>

          <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3">Campaign actions</div>
          {aiInsights.slice(0, 3).map((insight, i) => (
            <InsightCard key={i} type={typeToInsight[insight.type]} title={insight.title} body={insight.body} />
          ))}
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3">Key actions</div>
          <InsightCard type="pink" title="Top 20% customers spend 4.1× more" body="Create WhatsApp VIP group for Champions. Expected lift: +₹18–25K/month." action="Set up VIP group" />
          <InsightCard title="Pause Combo Fabric ads now" body="Only 34 units left. Stockout in 12 days. Wasting ₹320/day on unfulfillable orders." action="Go to Products" />
          <InsightCard type="warning" title="512 abandoned carts = ₹5.6L missed" body="3-email recovery sequence can recover 8–12% = +₹44–67K/month." action="Set up recovery flow" />

          <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3 mt-4">Budget reallocation</div>

          <Card>
            <CardHeader title="AI budget split" right={<Badge variant="purple">+₹53K revenue at same spend</Badge>} />
            <BarRow label="Meta (now)" pct={100} value="₹1,75,811" color="green" />
            <BarRow label="Meta (AI rec.)" pct={76} value="₹1,33,000" color="green" />
            <BarRow label="Google Search" pct={20} value="₹35,000" color="amber" />
            <BarRow label="Google PMax" pct={5} value="₹9,000" color="teal" />

            <div className="mt-3">
              <div className="text-[12px] text-[#686864] mb-1.5">
                ROAS simulator: <strong className="text-[#181816]">{targetRoas.toFixed(1)}×</strong>
              </div>
              <input
                type="range" min={1.0} max={3.0} step={0.1}
                value={targetRoas}
                onChange={(e) => setTargetRoas(parseFloat(e.target.value))}
                className="w-full accent-[#17a773]"
              />
              <div className="text-xl font-bold text-[#0d6b4f] mt-2">
                Projected: {formatINR(projectedRevenue)}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
