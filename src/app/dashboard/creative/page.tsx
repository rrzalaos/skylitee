"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { creatives } from "@/lib/mock-data";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Video, Image, Grid3x3 } from "lucide-react";

const actionConfig: Record<string, { label: string; variant: "green" | "blue" | "amber" | "red" }> = {
  scale: { label: "Scale", variant: "green" },
  keep: { label: "Keep", variant: "blue" },
  refresh: { label: "Refresh", variant: "amber" },
  pause: { label: "Pause now", variant: "red" },
};

const scoreColors = [
  { min: 80, bg: "bg-[#e0f5ee]", text: "text-[#064d38]" },
  { min: 60, bg: "bg-[#e4eef9]", text: "text-[#0a3d7a]" },
  { min: 40, bg: "bg-[#faecd7]", text: "text-[#5c3608]" },
  { min: 0, bg: "bg-[#fce8e8]", text: "text-[#6e1c1c]" },
];

function getScoreStyle(score: number) {
  return scoreColors.find(s => score >= s.min) || scoreColors[scoreColors.length - 1];
}

const typeIcons: Record<string, React.ReactNode> = {
  video: <Video size={14} />,
  image: <Image size={14} />,
  carousel: <Grid3x3 size={14} />,
};

const typeBg = ["bg-[#e0f5ee]", "bg-[#e4eef9]", "bg-[#faecd7]", "bg-[#fce8e8]"];

export default function CreativePage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Creative Studio</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">AI creative scoring · fatigue detection · performance ranking</p>
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

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Active creatives" value="8" sub="Across 2 active campaigns" />
        <KPICard label="Fatigue risk" value="2" sub="Embroidery static · CBO COMBO" />
        <KPICard label="Best creative ROAS" value="1.82" sub="CBO67 Reels · Position Print" />
        <KPICard label="Avg creative lifespan" value="18 days" sub="Before frequency >2.5" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Creative performance ranking" right="AI scored 0–100" />
          {creatives.map((c, i) => {
            const scoreStyle = getScoreStyle(c.score);
            const ac = actionConfig[c.action];
            return (
              <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-black/[0.06] last:border-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeBg[i]}`}>
                  {typeIcons[c.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-[#181816] truncate">{c.name}</div>
                  <div className="text-[12px] text-[#686864] mt-0.5">
                    {c.days} days · Freq {c.freq} · CTR {c.ctr}% · ROAS {c.roas}
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${scoreStyle.bg} ${scoreStyle.text}`}>
                  {c.score}
                </div>
                <Badge variant={ac.variant}>{ac.label}</Badge>
              </div>
            );
          })}
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="AI creative recommendations" />
            <InsightCard title="What's working: short Reels (8–15s) with product demo" body="CBO67 Reels outperforms all static creatives. Shoot 3 new Reels: unboxing, fabric close-up, and styling video. Budget: ₹8,000 production. Est. ROAS: 1.6–2.0." />
            <InsightCard type="info" title="Test UGC (user-generated content) style creatives" body="Your 35–44 female audience responds to authenticity. A handheld, non-polished 'honest review' style video typically outperforms studio shots by 40% CTR in this demographic." />
            <InsightCard type="warning" title="Prepare 2 new creatives before Aug 25 (fatigue date)" body="At current frequency growth rate, CBO67 hits 2.5 frequency around Aug 25. Have 2 fresh creatives ready to swap in immediately to avoid ROAS drop." />
          </Card>

          <Card>
            <CardHeader title="Frequency heatmap by creative" />
            {creatives.map((c, i) => (
              <BarRow
                key={i}
                label={c.name.split("·")[0].trim().substring(0, 16)}
                pct={Math.round((c.freq / 3) * 100)}
                value={`Freq ${c.freq}`}
                color={c.freq >= 2.5 ? "red" : c.freq >= 1.8 ? "amber" : c.freq >= 1.5 ? "blue" : "green"}
              />
            ))}
            <div className="mt-2 text-[10px] text-[#686864] bg-[#f7f7f5] rounded-lg px-2.5 py-1.5">
              Danger zone: Frequency &gt;2.5 → pause immediately. Optimal: 1.0–1.8
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
