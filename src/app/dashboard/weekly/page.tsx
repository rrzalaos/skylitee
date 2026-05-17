"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { FileText } from "lucide-react";
import { WarnBanner } from "@/components/ui/warn-banner";

const actionItems = [
  { num: 1, color: "bg-[#d94040]", title: "Connect Google Ads — est. ₹40K+ impact this month", sub: "Highest priority action in the entire dashboard" },
  { num: 2, color: "bg-[#d94040]", title: "Reorder Combo Fabric — 10 days to stockout", sub: "Order minimum 150 units today. Pause Combo Fabric ads." },
  { num: 3, color: "bg-[#e89820]", title: "Pause Embroidery static (freq 2.8)", sub: "Creative fatigue. Prepare 2 new creatives by Aug 25." },
  { num: 4, color: "bg-[#e89820]", title: "Scale CBO67 budget by 20%", sub: "ROAS 1.53 + learning complete = safe to scale" },
  { num: 5, color: "bg-[#3478d4]", title: "Launch ₹75 prepaid incentive offer", sub: "Reduces COD ratio, saves ₹5K/month in returns" },
];

export default function WeeklyPage() {
  return (
    <div>
      <WarnBanner type="amber">
        <span className="font-semibold">Meta Ads not connected</span> — campaign metrics (ROAS, CBO) below are sample data, not your real campaigns. Connect Meta in Settings → Connections.
      </WarnBanner>

      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Weekly Digest</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">Auto-generated · Shopify live + Meta estimated</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#c0392b] text-[#c0392b] bg-[#fdf3f3]">
          <FileText size={12} /> PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="bg-[#e0f5ee] border border-[#9FE1CB] rounded-xl px-3.5 py-3 mb-2">
            <div className="text-[14px] font-semibold text-[#064d38] mb-1.5 flex items-center gap-1.5">✨ This week's headline</div>
            <div className="text-[15px] font-medium text-[#0d6b4f] leading-relaxed">
              Best week of August. ROAS 1.34 on ₹63K spend. Week 3 strategy should be replicated in Week 4 immediately.
            </div>
          </div>

          <Card className="mb-2">
            <CardHeader title="Week 3 vs Week 1" />
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Revenue Wk3", value: "₹84K", bg: "bg-[#e0f5ee]", color: "text-[#0d6b4f]" },
                { label: "Revenue Wk1", value: "₹30K", bg: "bg-[#fce8e8]", color: "text-[#d94040]" },
                { label: "ROAS Wk3", value: "1.34", bg: "bg-[#e0f5ee]", color: "text-[#0d6b4f]" },
                { label: "ROAS Wk1", value: "0.80", bg: "bg-[#fce8e8]", color: "text-[#d94040]" },
              ].map((s, i) => (
                <div key={i} className={`text-center p-2 rounded-lg ${s.bg}`}>
                  <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
                  <div className="text-[15px] text-[#686864] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="What changed" />
            <InsightCard title="CBO67 exited learning phase — ROAS climbed 0.9 → 1.34" body="Algorithm found optimal delivery after 7 days. Do NOT edit — let it run. Scale 20% every 3 days." />
            <InsightCard type="info" title="Position Print updated page — bounce dropped 8pts" body="New product page with fabric details and zoom improved engagement. Replicate this on other product pages." />
            <InsightCard type="warning" title="CPM rose 15% in Week 4 — auction competition increasing" body="If CPM exceeds ₹380, pause low-ROAS ad sets to protect budget efficiency." />
          </Card>
        </div>

        <div>
          <Card className="mb-2">
            <CardHeader title={<span>This week's action items</span>} right={<Badge variant="amber">5 priority tasks</Badge>} />
            {actionItems.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-[#f7f7f5] rounded-lg mb-1.5 last:mb-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-semibold shrink-0 ${a.color}`}>
                  {a.num}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#181816]">{a.title}</div>
                  <div className="text-[15px] text-[#686864] mt-0.5">{a.sub}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <CardHeader title="Next week forecast" />
            <BarRow label="Revenue" pct={72} value="₹72,000" color="green" />
            <BarRow label="Ad Spend" pct={60} value="₹52,000" color="red" />
            <BarRow label="Orders" pct={65} value="66" color="blue" />
            <div className="mt-2 text-[13px] text-[#686864] bg-[#f7f7f5] rounded-lg px-2.5 py-1.5">
              + Google Ads connected: add ₹18–22K on top of forecast
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
