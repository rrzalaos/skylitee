"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Search } from "lucide-react";
import Link from "next/link";

interface GSCData {
  site: string;
  period: { startDate: string; endDate: string };
  kpis: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  keywords: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; ctr: number }[];
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\/[^/]+/, "").replace(/^$/, "/") || "/";
}

export default function GSCPage() {
  const [data, setData] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);

  useEffect(() => {
    fetch("/api/gsc")
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-[12px] text-[#686864] py-16 text-center">Loading GSC data...</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <Search size={32} className="text-[#9e9e9a] mx-auto mb-3" />
      <h2 className="text-[15px] font-semibold mb-1">Google Search Console not connected</h2>
      <p className="text-[12px] text-[#686864] mb-4">Connect to see real keyword rankings, clicks and impressions.</p>
      <Link href="/api/auth/google" className="px-4 py-2 bg-[#4285F4] text-white rounded-lg text-[12px] font-medium hover:bg-[#3367d6] transition-colors">
        Connect Google →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[12px] text-[#d94040] py-8 text-center">Could not load GSC data.</div>;

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Search Console</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">
            {data.site} · {data.period.startDate} → {data.period.endDate}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={12} /> CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Total Clicks" value={data.kpis.clicks.toLocaleString("en-IN")} />
        <KPICard label="Impressions" value={data.kpis.impressions >= 1000 ? `${(data.kpis.impressions / 1000).toFixed(1)}K` : data.kpis.impressions.toString()} />
        <KPICard label="Avg. CTR" value={`${data.kpis.ctr}%`} change={data.kpis.ctr >= 3 ? 1 : -1} changeLabel={data.kpis.ctr >= 3 ? "Above avg" : "Below 3% avg"} />
        <KPICard label="Avg. Position" value={data.kpis.avgPosition.toString()} change={data.kpis.avgPosition <= 10 ? 1 : -1} changeLabel={data.kpis.avgPosition <= 10 ? "Page 1" : "Not page 1 yet"} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Top keywords" right="Last 28 days · by clicks" />
          {data.keywords.length === 0 ? (
            <div className="text-[12px] text-[#686864] py-6 text-center">No keyword data yet — site may be new or have very low traffic</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Query", "Clicks", "Impr.", "CTR", "Position"].map(h => (
                      <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.map((k, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 max-w-[160px] truncate">{k.query}</td>
                      <td className="py-1.5 px-1.5 font-semibold">{k.clicks}</td>
                      <td className="py-2 px-2">{k.impressions}</td>
                      <td className="py-2 px-2">{k.ctr}%</td>
                      <td className="py-2 px-2">
                        <Badge variant={k.position <= 5 ? "green" : k.position <= 10 ? "amber" : "red"}>
                          {k.position}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Top pages" right="Last 28 days · by clicks" />
          {data.pages.length === 0 ? (
            <div className="text-[12px] text-[#686864] py-6 text-center">No page data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Page", "Clicks", "Impr.", "CTR"].map(h => (
                      <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((p, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 max-w-[160px] truncate font-medium text-[#0a3d7a]">{shortUrl(p.page)}</td>
                      <td className="py-1.5 px-1.5 font-semibold">{p.clicks}</td>
                      <td className="py-2 px-2">{p.impressions}</td>
                      <td className="py-2 px-2">{p.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-[10px] text-[#9e9e9a] bg-[#f7f7f5] rounded-lg p-2.5">
            Data from Google Search Console · {data.site} · last 28 days
          </div>
        </Card>
      </div>
    </div>
  );
}
