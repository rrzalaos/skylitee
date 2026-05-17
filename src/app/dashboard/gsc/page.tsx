"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { Badge } from "@/components/ui/badge";
import { gscKeywords, gscKpis } from "@/lib/mock-data";
import { FileSpreadsheet, FileText } from "lucide-react";

const trendIcon = (t: string) => t === "up" ? "↑" : t === "flat" ? "→" : "↓";
const trendColor = (t: string) => t === "up" ? "text-[#0d6b4f]" : "text-[#686864]";

export default function GSCPage() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Search Console</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Organic search · fabonique.com · Aug 1–19, 2025</p>
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
        <KPICard label="Total Clicks" value={gscKpis.clicks.toLocaleString("en-IN")} change={gscKpis.clicksChange} />
        <KPICard label="Impressions" value={`${(gscKpis.impressions / 1000).toFixed(0)}K`} change={gscKpis.impressionsChange} />
        <KPICard label="Avg. CTR" value={`${gscKpis.ctr}%`} change={gscKpis.ctrChange} changeLabel={`+${gscKpis.ctrChange}pts MoM`} />
        <KPICard label="Avg. Position" value={gscKpis.avgPosition.toString()} change={1} changeLabel="Improved from 10.1" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Top keywords" />
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Query", "Clicks", "Impr.", "CTR", "Pos.", "Trend"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gscKeywords.map((k, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2">{k.query}</td>
                    <td className="py-1.5 px-1.5 font-medium">{k.clicks.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-2">{k.impressions.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-2">{k.ctr}%</td>
                    <td className="py-2 px-2">
                      <Badge variant={k.position <= 5 ? "green" : k.position <= 10 ? "amber" : "red"}>{k.position}</Badge>
                    </td>
                    <td className={`py-1.5 px-1.5 font-medium ${trendColor(k.trend)}`}>{trendIcon(k.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="SEO AI insights" />
          <InsightCard type="info" title="3 keywords at pos. 6–10: one more step from page 1" body="Run paid ads on 'buy embroidery dress', 'cotton print fabric', 'embroidery salwar' while organically improving. Own page 1 both paid and organic simultaneously." />
          <InsightCard title="Organic AOV ₹2,476 = 2.6× paid — SEO is your best ROI" body="Organic buyers are your most valuable segment at zero acquisition cost. Invest ₹15,000/month in SEO content and earn ₹80–100K in organic revenue in 90 days." />
          <InsightCard type="warning" title="'Ethnic combo set' at pos. 14 — 60-day fix plan" body="1. Update title tag · 2. Rewrite meta description with CTA · 3. Add FAQ schema · 4. Build 3 internal links. Expected: pos. 5–7 in 60 days, +400 clicks/month." />
          <InsightCard type="purple" title="Festive season signal: +34% impression growth" body="GSC impressions growing for ethnic wear queries. Navratri/Diwali season (Oct–Nov) could 3× your organic traffic. Start content creation now — publish by Sep 15." />
        </Card>
      </div>
    </div>
  );
}
