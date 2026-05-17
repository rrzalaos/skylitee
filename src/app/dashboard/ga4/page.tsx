"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { BarRow } from "@/components/ui/bar-row";
import { FileSpreadsheet, BarChart3 } from "lucide-react";
import Link from "next/link";

interface GA4Data {
  property: string;
  kpis: { sessions: number; users: number; pageviews: number; bounceRate: number; avgSessionMin: string };
  channels: { channel: string; sessions: number; users: number }[];
  pages: { page: string; views: number; sessions: number; bounceRate: number }[];
}

export default function GA4Page() {
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);

  useEffect(() => {
    fetch("/api/ga4")
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected" || d.error === "no_properties") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-[12px] text-[#686864] py-16 text-center">Loading GA4 data...</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <BarChart3 size={32} className="text-[#9e9e9a] mx-auto mb-3" />
      <h2 className="text-[15px] font-semibold mb-1">Google Analytics 4 not connected</h2>
      <p className="text-[12px] text-[#686864] mb-4">Connect to see sessions, users, traffic sources and top pages.</p>
      <Link href="/api/auth/google" className="px-4 py-2 bg-[#4285F4] text-white rounded-lg text-[12px] font-medium hover:bg-[#3367d6] transition-colors">
        Connect Google →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[12px] text-[#d94040] py-8 text-center">Could not load GA4 data.</div>;

  const maxSessions = Math.max(...data.channels.map(c => c.sessions), 1);
  const maxViews = Math.max(...data.pages.map(p => p.views), 1);
  const channelColors: ("green" | "blue" | "amber" | "purple" | "teal")[] = ["green", "blue", "amber", "purple", "teal"];

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Analytics 4</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">{data.property} · last 28 days</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={12} /> CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Sessions" value={data.kpis.sessions.toLocaleString("en-IN")} />
        <KPICard label="Users" value={data.kpis.users.toLocaleString("en-IN")} />
        <KPICard label="Bounce Rate" value={`${data.kpis.bounceRate}%`} change={data.kpis.bounceRate < 60 ? 1 : -1} changeLabel={data.kpis.bounceRate < 60 ? "Good" : "High — check mobile"} />
        <KPICard label="Avg. Session" value={data.kpis.avgSessionMin} change={1} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Traffic by channel" right="Last 28 days · by sessions" />
          {data.channels.length === 0 ? (
            <div className="text-[12px] text-[#686864] py-6 text-center">No channel data yet</div>
          ) : (
            data.channels.map((c, i) => (
              <BarRow
                key={i}
                label={c.channel}
                pct={Math.round((c.sessions / maxSessions) * 100)}
                value={`${c.sessions.toLocaleString("en-IN")} sessions`}
                color={channelColors[i % channelColors.length]}
              />
            ))
          )}
        </Card>

        <Card>
          <CardHeader title="Top pages" right="By pageviews · last 28 days" />
          {data.pages.length === 0 ? (
            <div className="text-[12px] text-[#686864] py-6 text-center">No page data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Page", "Views", "Sessions", "Bounce"].map(h => (
                      <th key={h} className="text-left py-1.5 px-1.5 text-[11px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((p, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-1.5 px-1.5 font-medium text-[#0a3d7a] max-w-[140px] truncate">{p.page}</td>
                      <td className="py-1.5 px-1.5 font-semibold">{p.views.toLocaleString("en-IN")}</td>
                      <td className="py-1.5 px-1.5">{p.sessions.toLocaleString("en-IN")}</td>
                      <td className={`py-1.5 px-1.5 font-medium ${p.bounceRate > 70 ? "text-[#d94040]" : p.bounceRate > 50 ? "text-[#e89820]" : "text-[#0d6b4f]"}`}>
                        {p.bounceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-[10px] text-[#9e9e9a] bg-[#f7f7f5] rounded-lg p-2.5">
            Data from Google Analytics 4 · {data.property} · last 28 days
          </div>
        </Card>
      </div>
    </div>
  );
}
