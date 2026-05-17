"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { FileSpreadsheet, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useDateRange } from "@/lib/date-range-context";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface GSCData {
  site: string;
  period: { startDate: string; endDate: string };
  kpis: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  keywords: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  devices: { device: string; clicks: number; impressions: number; ctr: number }[];
  countries: { country: string; clicks: number; impressions: number; ctr: number }[];
  daily: { date: string; clicks: number; impressions: number }[];
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\/[^/]+/, "").replace(/^$/, "/") || "/";
}

type Tab = "overview" | "keywords" | "pages" | "devices" | "countries";

export default function GSCPage() {
  const { range } = useDateRange();
  const [data, setData] = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/gsc?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  if (loading) return <div className="text-[15px] text-[#686864] py-16 text-center">Loading GSC data…</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <Search size={32} className="text-[#9e9e9a] mx-auto mb-3" />
      <h2 className="text-[18px] font-semibold mb-1">Google Search Console not connected</h2>
      <p className="text-[15px] text-[#686864] mb-4">Connect to see real keyword rankings, clicks and impressions.</p>
      <Link href="/api/auth/google?service=gsc" className="px-4 py-2 bg-[#4285F4] text-white rounded-lg text-[15px] font-medium hover:bg-[#3367d6] transition-colors">
        Connect GSC →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[15px] text-[#d94040] py-8 text-center">Could not load GSC data.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "keywords", label: `Keywords (${data.keywords.length})` },
    { key: "pages", label: `Pages (${data.pages.length})` },
    { key: "devices", label: "Devices" },
    { key: "countries", label: "Countries" },
  ];

  const maxClicks = Math.max(...(data.devices ?? []).map(d => d.clicks), 1);
  const maxCountryClicks = Math.max(...(data.countries ?? []).map(c => c.clicks), 1);
  const dailyFormatted = (data.daily ?? []).map(d => ({ ...d, label: d.date.slice(5) }));

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Search Console</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">
            {data.site} · {data.period.startDate} → {data.period.endDate}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={13} /> CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Total Clicks" value={data.kpis.clicks.toLocaleString("en-IN")} />
        <KPICard label="Impressions" value={data.kpis.impressions >= 1000 ? `${(data.kpis.impressions / 1000).toFixed(1)}K` : data.kpis.impressions.toString()} />
        <KPICard label="Avg. CTR" value={`${data.kpis.ctr}%`} change={data.kpis.ctr >= 3 ? 1 : -1} changeLabel={data.kpis.ctr >= 3 ? "Above avg" : "Below 3% avg"} />
        <KPICard label="Avg. Position" value={data.kpis.avgPosition.toString()} change={data.kpis.avgPosition <= 10 ? 1 : -1} changeLabel={data.kpis.avgPosition <= 10 ? "Page 1" : "Not page 1 yet"} />
      </div>

      <div className="flex gap-0 border-b border-black/[0.09] mb-3">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-1.5 text-[14px] font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-[#17a773] text-[#0d6b4f]"
                : "border-transparent text-[#686864] hover:text-[#181816]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          {dailyFormatted.length > 0 && (
            <Card>
              <CardHeader title="Daily clicks & impressions" right={`${data.period.startDate} → ${data.period.endDate}`} />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyFormatted} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 13, border: "1px solid #e8e6e1", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#17a773" strokeWidth={2} dot={false} name="Clicks" />
                    <Line type="monotone" dataKey="impressions" stroke="#4285F4" strokeWidth={1.5} dot={false} name="Impressions" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Top keywords" right="Top 10 by clicks — see Keywords tab for all" />
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Query", "Clicks", "Impr.", "CTR", "Position"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.slice(0, 10).map((k, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 max-w-[200px] truncate">{k.query}</td>
                      <td className="py-2 px-2 font-semibold">{k.clicks}</td>
                      <td className="py-2 px-2">{k.impressions}</td>
                      <td className="py-2 px-2">{k.ctr}%</td>
                      <td className="py-2 px-2">
                        <Badge variant={k.position <= 5 ? "green" : k.position <= 10 ? "amber" : "red"}>{k.position}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === "keywords" && (
        <Card>
          <CardHeader title={`All keywords (${data.keywords.length})`} right="By clicks from Search Console" />
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Query", "Clicks", "Impressions", "CTR", "Position"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.keywords.map((k, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2 max-w-[260px] truncate">{k.query}</td>
                    <td className="py-2 px-2 font-semibold">{k.clicks}</td>
                    <td className="py-2 px-2">{k.impressions}</td>
                    <td className="py-2 px-2">{k.ctr}%</td>
                    <td className="py-2 px-2">
                      <Badge variant={k.position <= 5 ? "green" : k.position <= 10 ? "amber" : "red"}>{k.position}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.keywords.filter(k => k.impressions > 50 && k.ctr < 3).length > 0 && (
            <div className="mt-4 border-t border-black/[0.09] pt-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-[#e89820]" />
                <span className="text-[15px] font-semibold text-[#5c3608]">CTR opportunities</span>
                <span className="text-[14px] text-[#9e9e9a]">High impressions · low clicks</span>
              </div>
              <table className="w-full text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Query", "Impressions", "CTR now", "Potential gain (at 3% CTR)"].map(h => (
                      <th key={h} className="text-left py-1 px-2 text-[13px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.filter(k => k.impressions > 50 && k.ctr < 3).slice(0, 8).map((k, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0">
                      <td className="py-1.5 px-2 max-w-[220px] truncate">{k.query}</td>
                      <td className="py-1.5 px-2">{k.impressions}</td>
                      <td className="py-1.5 px-2 text-[#d94040]">{k.ctr}%</td>
                      <td className="py-1.5 px-2 text-[#686864]">~{Math.round(k.impressions * (3 - k.ctr) / 100)} extra clicks/period</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "pages" && (
        <Card>
          <CardHeader title={`Top pages (${data.pages.length})`} right="By clicks from Search Console" />
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Page", "Clicks", "Impressions", "CTR", "Position"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2 max-w-[220px] truncate font-medium text-[#0a3d7a]">{shortUrl(p.page)}</td>
                    <td className="py-2 px-2 font-semibold">{p.clicks}</td>
                    <td className="py-2 px-2">{p.impressions}</td>
                    <td className="py-2 px-2">{p.ctr}%</td>
                    <td className="py-2 px-2">
                      <Badge variant={p.position <= 5 ? "green" : p.position <= 10 ? "amber" : "red"}>{p.position}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "devices" && (
        <Card>
          <CardHeader title="Device breakdown" right="By clicks from Search Console" />
          {(data.devices ?? []).length === 0 ? (
            <div className="text-[15px] text-[#686864] py-6 text-center">No device data available</div>
          ) : (
            <div>
              <div className="space-y-2 py-2 mb-3">
                {data.devices.map((d, i) => (
                  <BarRow
                    key={i}
                    label={d.device.charAt(0).toUpperCase() + d.device.slice(1)}
                    pct={Math.round((d.clicks / maxClicks) * 100)}
                    value={`${d.clicks} clicks`}
                    color={i === 0 ? "green" : i === 1 ? "blue" : "amber"}
                  />
                ))}
              </div>
              <table className="w-full text-[15px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Device", "Clicks", "Impressions", "CTR"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.devices.map((d, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0">
                      <td className="py-2 px-2 capitalize">{d.device}</td>
                      <td className="py-2 px-2 font-semibold">{d.clicks}</td>
                      <td className="py-2 px-2">{d.impressions}</td>
                      <td className="py-2 px-2">{d.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === "countries" && (
        <Card>
          <CardHeader title="Country breakdown" right="By clicks from Search Console" />
          {(data.countries ?? []).length === 0 ? (
            <div className="text-[15px] text-[#686864] py-6 text-center">No country data available</div>
          ) : (
            <div>
              <div className="space-y-1.5 py-2 mb-3">
                {data.countries.slice(0, 8).map((c, i) => (
                  <BarRow
                    key={i}
                    label={c.country}
                    pct={Math.round((c.clicks / maxCountryClicks) * 100)}
                    value={`${c.clicks} clicks`}
                    color={i === 0 ? "green" : i === 1 ? "blue" : i === 2 ? "amber" : "teal"}
                  />
                ))}
              </div>
              <table className="w-full text-[15px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Country", "Clicks", "Impressions", "CTR"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.countries.map((c, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0">
                      <td className="py-2 px-2">{c.country}</td>
                      <td className="py-2 px-2 font-semibold">{c.clicks}</td>
                      <td className="py-2 px-2">{c.impressions}</td>
                      <td className="py-2 px-2">{c.ctr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <div className="mt-3 text-[13px] text-[#9e9e9a] bg-[#f7f7f5] rounded-lg p-2.5">
        Data from Google Search Console · {data.site}
      </div>
    </div>
  );
}
