"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WarnBanner } from "@/components/ui/warn-banner";
import { formatINR } from "@/lib/utils";
import Link from "next/link";

const plannedCampaigns = [
  { name: "Search · Brand", keywords: "your brand, your domain", budget: 500, roas: "3.2+", roasV: "green" as const, priority: "P1", pV: "red" as const },
  { name: "Search · Category", keywords: "buy ethnic wear, fabric sets online", budget: 1200, roas: "2.1", roasV: "amber" as const, priority: "P1", pV: "red" as const },
  { name: "Shopping · PMax", keywords: "All products feed", budget: 1500, roas: "1.8", roasV: "amber" as const, priority: "P2", pV: "amber" as const },
  { name: "Display · Remarketing", keywords: "Shopify visitors + cart abandoners", budget: 600, roas: "2.6", roasV: "green" as const, priority: "P3", pV: "blue" as const },
];

const gscKeywords = [
  { query: "fabric sets online", position: 3.2, clicks: 840, pV: "green" as const },
  { query: "buy embroidery dress", position: 7.1, clicks: 620, pV: "amber" as const },
  { query: "cotton print fabric", position: 9.4, clicks: 490, pV: "amber" as const },
  { query: "ethnic combo set", position: 14, clicks: 310, pV: "red" as const },
  { query: "position print dress", position: 5.8, clicks: 280, pV: "amber" as const },
];

export default function GAdsPage() {
  return (
    <div>
      <WarnBanner type="red">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div>
            <div className="font-semibold text-[14px]">Google Ads not connected</div>
            <div>Below is your AI-planned campaign structure based on GSC keyword data and category patterns.</div>
          </div>
          <Link href="/dashboard/connections">
            <button className="px-3 py-1.5 bg-[#d94040] text-white rounded-lg text-[14px] font-semibold whitespace-nowrap">
              Connect Now
            </button>
          </Link>
        </div>
      </WarnBanner>

      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Ads</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">AI-recommended campaign plan · based on your GSC data</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="AI campaign structure" right={<Badge variant="purple">Planned — not live</Badge>} />
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Campaign", "Keywords", "Budget/day", "Est. ROAS", "Priority"].map(h => (
                    <th key={h} className="text-left py-1.5 px-1.5 text-[14px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plannedCampaigns.map((c, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-1.5 px-1.5 font-medium">{c.name}</td>
                    <td className="py-1.5 px-1.5 text-[13px] text-[#686864]">{c.keywords}</td>
                    <td className="py-2 px-2">{formatINR(c.budget)}</td>
                    <td className="py-2 px-2"><Badge variant={c.roasV}>{c.roas}</Badge></td>
                    <td className="py-2 px-2"><Badge variant={c.pV}>{c.priority}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[13px] text-[#064d38] bg-[#e0f5ee] rounded-lg px-2.5 py-2">
            Est. ₹3,800/day · ₹1,14,000/month · Revenue ₹2,05,200 · ROAS 1.80 (AI estimate, not live)
          </div>
        </Card>

        <Card>
          <CardHeader title="GSC keyword opportunities" right="Connect GSC for live data" />
          {gscKeywords.map((k, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-black/[0.06] last:border-0">
              <span className="text-[14px] text-[#181816]">{k.query}</span>
              <div className="flex items-center gap-2">
                <Badge variant={k.pV}>Pos {k.position}</Badge>
                <span className="text-[13px] text-[#686864]">{k.clicks} clicks</span>
              </div>
            </div>
          ))}
          <div className="mt-2 text-[13px] text-[#686864] bg-[#f7f7f5] rounded-lg px-2.5 py-1.5">
            Connect Search Console in Connections to see your real keyword rankings.
          </div>
        </Card>
      </div>
    </div>
  );
}
