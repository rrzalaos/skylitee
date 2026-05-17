"use client";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { ga4Kpis, ga4Funnel } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function GA4Page() {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Analytics 4</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Website behaviour · user journeys · Aug 1–19, 2025</p>
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
        <KPICard label="Total Sessions" value={formatNumber(ga4Kpis.sessions)} change={ga4Kpis.sessionsChange} />
        <KPICard label="Users" value={formatNumber(ga4Kpis.users)} sub="New 68% · Returning 32%" />
        <KPICard label="Avg. Session" value={ga4Kpis.avgSession} changeLabel="Below 3m benchmark" change={-1} />
        <KPICard label="Bounce Rate" value={`${ga4Kpis.bounceRate}%`} changeLabel="High on mobile paid" change={-1} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="GA4 purchase funnel" />
          {ga4Funnel.map((f, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${
                i === ga4Funnel.length - 1 ? "bg-[#e0f5ee]" : "bg-[#f7f7f5]"
              }`}
            >
              <div className={`text-[10px] ${i === ga4Funnel.length - 1 ? "text-[#0d6b4f]" : "text-[#686864]"}`}>{f.stage}</div>
              <div className={`text-[12px] font-semibold ${i === ga4Funnel.length - 1 ? "text-[#0d6b4f]" : "text-[#181816]"}`}>
                {formatNumber(f.value)}
              </div>
            </div>
          ))}
          <InsightCard type="warning" title="Checkout → Payment: 39% drop is your biggest leak" body="284 users started checkout but didn't enter payment. Fix: add trust badges (SSL, returns policy), UPI one-tap, and EMI options. Est. recovery: +32 orders/month." />
        </Card>

        <Card>
          <CardHeader title="GA4 behaviour insights" />
          <InsightCard type="danger" title="68% mobile bounce on paid landing pages" body="Meta sends 97% mobile traffic. Your paid pages have 68% bounce vs 54% on organic. Optimise: WebP images, sticky ATC button, reduce above-fold elements. Est. CVR gain: +0.6%." />
          <InsightCard type="info" title="Returning users convert 3.8× more than new" body="32% of users are returning — driving outsized revenue. A 3-touch email nurture for first-time visitors who viewed a product but didn't convert can boost return rate to 40%." />
          <InsightCard type="purple" title="1m 42s avg session — 31% lower purchase rate vs 3m" body="Users who spend 3+ minutes convert 31% more. Add: size guide modal, product video, fabric detail zoom, and 'Complete the look' cross-sells to increase dwell time." />
          <InsightCard type="teal" title="Zero paid search sessions — Google Ads gap" body="GA4 shows 0 sessions from paid search. High-intent Google searchers convert 2.4× more than social traffic. Connecting Google Ads would fill this funnel gap immediately." />
        </Card>
      </div>
    </div>
  );
}
