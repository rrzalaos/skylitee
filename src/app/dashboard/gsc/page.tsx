"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarRow } from "@/components/ui/bar-row";
import { FileSpreadsheet, Search, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Map } from "lucide-react";
import Link from "next/link";
import { useDateRange } from "@/lib/date-range-context";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface Sitemap {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  errors: number;
  warnings: number;
  submitted: number;
  indexed: number;
}

interface Achievement {
  icon: string;
  label: string;
  type: "good" | "warn" | "bad";
}

interface GSCData {
  site: string;
  period: { startDate: string; endDate: string };
  kpis: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  keywords: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  devices: { device: string; clicks: number; impressions: number; ctr: number }[];
  countries: { country: string; clicks: number; impressions: number; ctr: number }[];
  daily: { date: string; clicks: number; impressions: number }[];
  sitemaps: Sitemap[];
  achievements: Achievement[];
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\/[^/]+/, "").replace(/^$/, "/") || "/";
}

type Tab = "overview" | "keywords" | "pages" | "devices" | "countries" | "sitemap";

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

  if (loading) return <div className="text-[14px] text-[#A1A1AA] dark:text-[#71717A] py-16 text-center">Loading Search Console data…</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <Search size={32} className="text-[#A1A1AA] mx-auto mb-3" />
      <h2 className="text-[16px] font-bold mb-1 dark:text-[#F4F4F5]">Google Search Console not connected</h2>
      <p className="text-[13px] text-[#71717A] mb-4">Connect to see keyword rankings, clicks, impressions and sitemap status.</p>
      <Link href="/api/auth/google?service=gsc" className="px-5 py-2.5 bg-[#4285F4] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3367d6] transition-colors">
        Connect Search Console →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[14px] text-[#EF4444] py-8 text-center">Could not load GSC data.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "keywords", label: `Keywords (${data.keywords.length})` },
    { key: "pages", label: `Pages (${data.pages.length})` },
    { key: "devices", label: "Devices" },
    { key: "countries", label: "Countries" },
    { key: "sitemap", label: `Sitemap${data.sitemaps.length > 0 ? ` (${data.sitemaps.length})` : ""}` },
  ];

  const maxClicks = Math.max(...(data.devices ?? []).map(d => d.clicks), 1);
  const maxCountryClicks = Math.max(...(data.countries ?? []).map(c => c.clicks), 1);
  const dailyFormatted = (data.daily ?? []).map(d => ({ ...d, label: d.date.slice(5) }));
  const good = data.achievements.filter(a => a.type === "good");
  const warns = data.achievements.filter(a => a.type === "warn");
  const bad = data.achievements.filter(a => a.type === "bad");

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold dark:text-[#F4F4F5]">Google Search Console</h2>
          <p className="text-[13px] text-[#A1A1AA] mt-0.5">{data.site} · {data.period.startDate} → {data.period.endDate}</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border border-[#22C55E]/40 text-[#15803D] dark:text-[#86EFAC] bg-[#F0FDF4] dark:bg-[#052E16]">
          <FileSpreadsheet size={12} /> CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        <KPICard label="Total Clicks" value={data.kpis.clicks.toLocaleString("en-IN")} />
        <KPICard
          label="Impressions"
          value={data.kpis.impressions >= 1000 ? `${(data.kpis.impressions / 1000).toFixed(1)}K` : data.kpis.impressions.toString()}
        />
        <KPICard
          label="Avg. CTR"
          value={`${data.kpis.ctr}%`}
          change={data.kpis.ctr >= 3 ? 1 : -1}
          changeLabel={data.kpis.ctr >= 5 ? "Excellent" : data.kpis.ctr >= 3 ? "Above avg · Avg: 3%" : "Below avg · Avg: 3%"}
        />
        <KPICard
          label="Avg. Position"
          value={data.kpis.avgPosition.toString()}
          change={data.kpis.avgPosition > 0 && data.kpis.avgPosition <= 10 ? 1 : -1}
          changeLabel={data.kpis.avgPosition <= 3 ? "Top 3!" : data.kpis.avgPosition <= 10 ? "Page 1" : "Not on page 1 yet"}
        />
      </div>

      {/* Achievements + Health */}
      {data.achievements.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {good.length > 0 && (
            <Card>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={14} className="text-[#22C55E]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D] dark:text-[#86EFAC]">What&apos;s Working</span>
              </div>
              <div className="space-y-1">
                {good.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-[#18181B] dark:text-[#F4F4F5]">
                    <span>{a.icon}</span><span>{a.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {warns.length > 0 && (
            <Card>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} className="text-[#EAB308]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#92400E] dark:text-[#FCD34D]">Opportunities</span>
              </div>
              <div className="space-y-1">
                {warns.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-[#18181B] dark:text-[#F4F4F5]">
                    <span>{a.icon}</span><span>{a.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {bad.length > 0 && (
            <Card>
              <div className="flex items-center gap-1.5 mb-2">
                <XCircle size={14} className="text-[#EF4444]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#991B1B] dark:text-[#FCA5A5]">Issues to Fix</span>
              </div>
              <div className="space-y-1">
                {bad.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-[#18181B] dark:text-[#F4F4F5]">
                    <span>{a.icon}</span><span>{a.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-black/[0.06] dark:border-white/[0.06] mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-[#4285F4] text-[#4285F4]"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            )}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E5E5", borderRadius: 10 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#4285F4" strokeWidth={2.5} dot={false} name="Clicks" />
                    <Line type="monotone" dataKey="impressions" stroke="#A1A1AA" strokeWidth={1.5} dot={false} name="Impressions" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Top keywords" right="Top 10 by clicks — see Keywords tab for all" />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["Query", "Clicks", "Impr.", "CTR", "Position"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.slice(0, 10).map((k, i) => (
                    <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C]">
                      <td className="py-2 px-2 max-w-[200px] truncate dark:text-[#F4F4F5]">{k.query}</td>
                      <td className="py-2 px-2 font-semibold dark:text-[#F4F4F5]">{k.clicks}</td>
                      <td className="py-2 px-2 text-[#71717A]">{k.impressions}</td>
                      <td className="py-2 px-2 text-[#71717A]">{k.ctr}%</td>
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
          <CardHeader title={`All keywords (${data.keywords.length})`} right="By clicks" />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                  {["Query", "Clicks", "Impressions", "CTR", "Position"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.keywords.map((k, i) => (
                  <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C]">
                    <td className="py-2 px-2 max-w-[260px] truncate dark:text-[#F4F4F5]">{k.query}</td>
                    <td className="py-2 px-2 font-semibold dark:text-[#F4F4F5]">{k.clicks}</td>
                    <td className="py-2 px-2 text-[#71717A]">{k.impressions}</td>
                    <td className="py-2 px-2 text-[#71717A]">{k.ctr}%</td>
                    <td className="py-2 px-2">
                      <Badge variant={k.position <= 5 ? "green" : k.position <= 10 ? "amber" : "red"}>{k.position}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.keywords.filter(k => k.impressions > 50 && k.ctr < 3).length > 0 && (
            <div className="mt-4 border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} className="text-[#EAB308]" />
                <span className="text-[12px] font-bold text-[#92400E] dark:text-[#FCD34D]">CTR Opportunities</span>
                <span className="text-[12px] text-[#A1A1AA]">High impressions, low clicks — fix title/description</span>
              </div>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["Query", "Impressions", "CTR now", "Potential extra clicks (at 3% CTR)"].map(h => (
                      <th key={h} className="text-left py-1 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.keywords.filter(k => k.impressions > 50 && k.ctr < 3).slice(0, 8).map((k, i) => (
                    <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                      <td className="py-1.5 px-2 max-w-[220px] truncate dark:text-[#F4F4F5]">{k.query}</td>
                      <td className="py-1.5 px-2 text-[#71717A]">{k.impressions}</td>
                      <td className="py-1.5 px-2 text-[#EF4444]">{k.ctr}%</td>
                      <td className="py-1.5 px-2 text-[#F97316]">+{Math.round(k.impressions * (3 - k.ctr) / 100)} clicks/period</td>
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
          <CardHeader title={`Top pages (${data.pages.length})`} right="By clicks" />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                  {["Page", "Clicks", "Impressions", "CTR", "Position"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p, i) => (
                  <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C]">
                    <td className="py-2 px-2 max-w-[220px] truncate font-medium text-[#4285F4]">{shortUrl(p.page)}</td>
                    <td className="py-2 px-2 font-semibold dark:text-[#F4F4F5]">{p.clicks}</td>
                    <td className="py-2 px-2 text-[#71717A]">{p.impressions}</td>
                    <td className="py-2 px-2 text-[#71717A]">{p.ctr}%</td>
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
          <CardHeader title="Device breakdown" right="By clicks" />
          <div className="space-y-2 py-2 mb-3">
            {data.devices.map((d, i) => (
              <BarRow key={i}
                label={d.device.charAt(0).toUpperCase() + d.device.slice(1)}
                pct={Math.round((d.clicks / maxClicks) * 100)}
                value={`${d.clicks} clicks · CTR ${d.ctr}%`}
                color={(["green", "blue", "amber"] as const)[i] ?? "teal"}
              />
            ))}
          </div>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                {["Device", "Clicks", "Impressions", "CTR"].map(h => (
                  <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.devices.map((d, i) => (
                <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                  <td className="py-2 px-2 capitalize dark:text-[#F4F4F5]">{d.device}</td>
                  <td className="py-2 px-2 font-semibold dark:text-[#F4F4F5]">{d.clicks}</td>
                  <td className="py-2 px-2 text-[#71717A]">{d.impressions}</td>
                  <td className="py-2 px-2 text-[#71717A]">{d.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "countries" && (
        <Card>
          <CardHeader title="Country breakdown" right="By clicks" />
          <div className="space-y-1.5 py-2 mb-3">
            {data.countries.slice(0, 8).map((c, i) => (
              <BarRow key={i} label={c.country}
                pct={Math.round((c.clicks / maxCountryClicks) * 100)}
                value={`${c.clicks} clicks`}
                color={(["green", "blue", "amber", "teal", "purple"] as const)[i % 5]}
              />
            ))}
          </div>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                {["Country", "Clicks", "Impressions", "CTR"].map(h => (
                  <th key={h} className="text-left py-1.5 px-2 text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.countries.map((c, i) => (
                <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                  <td className="py-2 px-2 dark:text-[#F4F4F5]">{c.country}</td>
                  <td className="py-2 px-2 font-semibold dark:text-[#F4F4F5]">{c.clicks}</td>
                  <td className="py-2 px-2 text-[#71717A]">{c.impressions}</td>
                  <td className="py-2 px-2 text-[#71717A]">{c.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "sitemap" && (
        <div className="space-y-3">
          {data.sitemaps.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-10 gap-2">
                <Map size={28} className="text-[#A1A1AA]" />
                <div className="text-[13px] text-[#71717A]">No sitemaps submitted to Search Console.</div>
                <div className="text-[12px] text-[#A1A1AA]">Submit your sitemap at search.google.com/search-console → Sitemaps.</div>
              </div>
            </Card>
          ) : (
            data.sitemaps.map((sm, i) => {
              const indexRatio = sm.submitted > 0 ? Math.round((sm.indexed / sm.submitted) * 100) : 0;
              const hasIssues = sm.errors > 0 || sm.warnings > 0;
              return (
                <Card key={i}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[13px] font-semibold dark:text-[#F4F4F5] truncate max-w-[380px]">{sm.path}</div>
                      {sm.lastSubmitted && (
                        <div className="text-[11px] text-[#A1A1AA] mt-0.5">
                          Submitted: {new Date(sm.lastSubmitted).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {sm.lastDownloaded && ` · Last crawled: ${new Date(sm.lastDownloaded).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[11px] font-bold px-2.5 py-1 rounded-full",
                      sm.isPending ? "bg-[#FFFBEB] text-[#92400E] dark:bg-[#2D1C00] dark:text-[#FCD34D]"
                        : hasIssues ? "bg-[#FEF2F2] text-[#DC2626] dark:bg-[#2D0A0A] dark:text-[#FCA5A5]"
                        : "bg-[#F0FDF4] text-[#15803D] dark:bg-[#052E16] dark:text-[#86EFAC]"
                    )}>
                      {sm.isPending ? "Pending" : hasIssues ? "Has Issues" : "OK"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-3 text-center">
                      <div className="text-[11px] text-[#A1A1AA] mb-1">Submitted</div>
                      <div className="text-[22px] font-black dark:text-[#F4F4F5]">{sm.submitted.toLocaleString()}</div>
                      <div className="text-[11px] text-[#A1A1AA]">URLs</div>
                    </div>
                    <div className="bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-3 text-center">
                      <div className="text-[11px] text-[#A1A1AA] mb-1">Indexed</div>
                      <div className={cn("text-[22px] font-black", indexRatio >= 80 ? "text-[#22C55E]" : indexRatio >= 50 ? "text-[#EAB308]" : "text-[#EF4444]")}>
                        {sm.indexed.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#A1A1AA]">{indexRatio}% indexed</div>
                    </div>
                    <div className={cn("rounded-xl p-3 text-center", sm.errors > 0 ? "bg-[#FEF2F2] dark:bg-[#2D0A0A]" : "bg-[#F5F5F4] dark:bg-[#1C1C1C]")}>
                      <div className="text-[11px] text-[#A1A1AA] mb-1">Errors</div>
                      <div className={cn("text-[22px] font-black", sm.errors > 0 ? "text-[#EF4444]" : "text-[#22C55E]")}>
                        {sm.errors}
                      </div>
                      <div className="text-[11px] text-[#A1A1AA]">{sm.errors > 0 ? "Fix required" : "No errors"}</div>
                    </div>
                    <div className={cn("rounded-xl p-3 text-center", sm.warnings > 0 ? "bg-[#FFFBEB] dark:bg-[#2D1C00]" : "bg-[#F5F5F4] dark:bg-[#1C1C1C]")}>
                      <div className="text-[11px] text-[#A1A1AA] mb-1">Warnings</div>
                      <div className={cn("text-[22px] font-black", sm.warnings > 0 ? "text-[#EAB308]" : "text-[#22C55E]")}>
                        {sm.warnings}
                      </div>
                      <div className="text-[11px] text-[#A1A1AA]">{sm.warnings > 0 ? "Review needed" : "All clear"}</div>
                    </div>
                  </div>
                  {sm.submitted > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-[#A1A1AA] mb-1">
                        <span>Indexed</span><span>{indexRatio}%</span>
                      </div>
                      <div className="h-2 bg-[#F5F5F4] dark:bg-[#262626] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", indexRatio >= 80 ? "bg-[#22C55E]" : indexRatio >= 50 ? "bg-[#EAB308]" : "bg-[#EF4444]")}
                          style={{ width: `${indexRatio}%` }}
                        />
                      </div>
                      {indexRatio < 80 && (
                        <div className="text-[11px] text-[#A1A1AA] mt-1.5">
                          {sm.submitted - sm.indexed} URL{sm.submitted - sm.indexed > 1 ? "s" : ""} not indexed — check Google Search Console for coverage errors.
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
          <div className="text-[12px] text-[#A1A1AA] bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl p-3">
            Note: For broken links (404s) and detailed crawl errors, visit{" "}
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] underline">
              Google Search Console → Pages → Not Found (404)
            </a>. The GSC API does not expose crawl error lists.
          </div>
        </div>
      )}
    </div>
  );
}
