"use client";
import { useEffect, useState } from "react";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardHeader } from "@/components/ui/card";
import { BarRow } from "@/components/ui/bar-row";
import { FileSpreadsheet, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useDateRange } from "@/lib/date-range-context";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface GA4Data {
  property: string;
  period: { startDate: string; endDate: string };
  kpis: { sessions: number; users: number; pageviews: number; bounceRate: number; avgSessionMin: string; newUsers: number };
  channels: { channel: string; sessions: number; users: number }[];
  pages: { page: string; views: number; sessions: number; bounceRate: number }[];
  devices: { device: string; sessions: number; users: number }[];
  countries: { country: string; sessions: number; users: number }[];
  daily: { date: string; sessions: number; users: number }[];
  landingPages: { page: string; sessions: number; bounceRate: number; newUsers: number }[];
}

type Tab = "overview" | "traffic" | "pages" | "audience" | "landing";

export default function GA4Page() {
  const { range } = useDateRange();
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/ga4?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error === "not_connected" || d.error === "no_properties") { setNotConnected(true); return; }
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  if (loading) return <div className="text-[15px] text-[#686864] py-16 text-center">Loading GA4 data…</div>;

  if (notConnected) return (
    <div className="text-center py-20">
      <BarChart3 size={32} className="text-[#9e9e9a] mx-auto mb-3" />
      <h2 className="text-[18px] font-semibold mb-1">Google Analytics 4 not connected</h2>
      <p className="text-[15px] text-[#686864] mb-4">Connect to see sessions, users, traffic sources and top pages.</p>
      <Link href="/api/auth/google?service=ga4" className="px-4 py-2 bg-[#4285F4] text-white rounded-lg text-[15px] font-medium hover:bg-[#3367d6] transition-colors">
        Connect GA4 →
      </Link>
    </div>
  );

  if (!data) return <div className="text-[15px] text-[#d94040] py-8 text-center">Could not load GA4 data.</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "traffic", label: `Traffic (${data.channels.length})` },
    { key: "pages", label: `Pages (${data.pages.length})` },
    { key: "audience", label: "Audience" },
    { key: "landing", label: "Landing Pages" },
  ];

  const maxSessions = Math.max(...data.channels.map(c => c.sessions), 1);
  const maxDeviceSessions = Math.max(...(data.devices ?? []).map(d => d.sessions), 1);
  const maxCountrySessions = Math.max(...(data.countries ?? []).map(c => c.sessions), 1);
  const channelColors: ("green" | "blue" | "amber" | "purple" | "teal")[] = ["green", "blue", "amber", "purple", "teal"];
  const dailyFormatted = (data.daily ?? []).map(d => ({ ...d, label: d.date.slice(4).replace(/(\d{2})(\d{2})/, "$1/$2") }));

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Google Analytics 4</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">
            {data.property} · {data.period.startDate} → {data.period.endDate}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium border border-[#1a7a3a] text-[#1a7a3a] bg-[#f0faf4]">
          <FileSpreadsheet size={13} /> CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <KPICard label="Sessions" value={data.kpis.sessions.toLocaleString("en-IN")} />
        <KPICard label="Users" value={data.kpis.users.toLocaleString("en-IN")} />
        <KPICard label="Bounce Rate" value={`${data.kpis.bounceRate}%`} change={data.kpis.bounceRate < 60 ? 1 : -1} changeLabel={data.kpis.bounceRate < 60 ? "Good" : "High — check mobile"} />
        <KPICard label="Avg. Session" value={data.kpis.avgSessionMin} change={1} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-xl border border-black/[0.09] px-4 py-3 flex items-center gap-3">
          <div>
            <div className="text-[13px] text-[#686864]">Pageviews</div>
            <div className="text-[18px] font-bold">{data.kpis.pageviews.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-black/[0.09] px-4 py-3 flex items-center gap-3">
          <div>
            <div className="text-[13px] text-[#686864]">New Users</div>
            <div className="text-[18px] font-bold">{data.kpis.newUsers.toLocaleString("en-IN")}</div>
          </div>
        </div>
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
              <CardHeader title="Daily sessions" right={`${data.period.startDate} → ${data.period.endDate}`} />
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyFormatted} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 13, border: "1px solid #e8e6e1", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="sessions" stroke="#17a773" strokeWidth={2} dot={false} name="Sessions" />
                    <Line type="monotone" dataKey="users" stroke="#4285F4" strokeWidth={1.5} dot={false} name="Users" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Top channels" right="By sessions" />
            {data.channels.map((c, i) => (
              <BarRow
                key={i}
                label={c.channel}
                pct={Math.round((c.sessions / maxSessions) * 100)}
                value={`${c.sessions.toLocaleString("en-IN")} sess.`}
                color={channelColors[i % channelColors.length]}
              />
            ))}
          </Card>
        </div>
      )}

      {tab === "traffic" && (
        <Card>
          <CardHeader title={`Traffic channels (${data.channels.length})`} right="By sessions" />
          <div className="space-y-2 py-2 mb-3">
            {data.channels.map((c, i) => (
              <BarRow
                key={i}
                label={c.channel}
                pct={Math.round((c.sessions / maxSessions) * 100)}
                value={`${c.sessions.toLocaleString("en-IN")}`}
                color={channelColors[i % channelColors.length]}
              />
            ))}
          </div>
          <table className="w-full text-[15px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.09]">
                {["Channel", "Sessions", "Users", "% Sessions"].map(h => (
                  <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.channels.map((c, i) => (
                <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                  <td className="py-2 px-2">{c.channel}</td>
                  <td className="py-2 px-2 font-semibold">{c.sessions.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-2">{c.users.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-2">{data.kpis.sessions ? `${((c.sessions / data.kpis.sessions) * 100).toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "pages" && (
        <Card>
          <CardHeader title={`Top pages (${data.pages.length})`} right="By pageviews" />
          <div className="overflow-x-auto">
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Page", "Views", "Sessions", "Bounce Rate"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pages.map((p, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                    <td className="py-2 px-2 font-medium text-[#0a3d7a] max-w-[200px] truncate">{p.page}</td>
                    <td className="py-2 px-2 font-semibold">{p.views.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-2">{p.sessions.toLocaleString("en-IN")}</td>
                    <td className={`py-2 px-2 font-medium ${p.bounceRate > 70 ? "text-[#d94040]" : p.bounceRate > 50 ? "text-[#e89820]" : "text-[#0d6b4f]"}`}>
                      {p.bounceRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "audience" && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader title="Devices" right="By sessions" />
            <div className="space-y-2 py-2 mb-3">
              {(data.devices ?? []).map((d, i) => (
                <BarRow
                  key={i}
                  label={d.device.charAt(0).toUpperCase() + d.device.slice(1)}
                  pct={Math.round((d.sessions / maxDeviceSessions) * 100)}
                  value={`${d.sessions.toLocaleString("en-IN")}`}
                  color={i === 0 ? "green" : i === 1 ? "blue" : "amber"}
                />
              ))}
            </div>
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Device", "Sessions", "Users"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.devices ?? []).map((d, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0">
                    <td className="py-2 px-2 capitalize">{d.device}</td>
                    <td className="py-2 px-2 font-semibold">{d.sessions.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-2">{d.users.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <CardHeader title="Countries" right="By sessions" />
            <div className="space-y-1.5 py-2 mb-3">
              {(data.countries ?? []).slice(0, 6).map((c, i) => (
                <BarRow
                  key={i}
                  label={c.country}
                  pct={Math.round((c.sessions / maxCountrySessions) * 100)}
                  value={`${c.sessions.toLocaleString("en-IN")}`}
                  color={i === 0 ? "green" : i === 1 ? "blue" : i === 2 ? "amber" : "teal"}
                />
              ))}
            </div>
            <table className="w-full text-[15px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.09]">
                  {["Country", "Sessions", "Users"].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.countries ?? []).map((c, i) => (
                  <tr key={i} className="border-b border-black/[0.06] last:border-0">
                    <td className="py-2 px-2">{c.country}</td>
                    <td className="py-2 px-2 font-semibold">{c.sessions.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-2">{c.users.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "landing" && (
        <Card>
          <CardHeader title="Landing pages" right="First page in session" />
          {(data.landingPages ?? []).length === 0 ? (
            <div className="text-[15px] text-[#686864] py-6 text-center">No landing page data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.09]">
                    {["Landing Page", "Sessions", "New Users", "Bounce Rate"].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 text-[14px] font-semibold text-[#686864]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.landingPages.map((p, i) => (
                    <tr key={i} className="border-b border-black/[0.06] last:border-0 hover:bg-[#f7f7f5]">
                      <td className="py-2 px-2 font-medium text-[#0a3d7a] max-w-[220px] truncate">{p.page}</td>
                      <td className="py-2 px-2 font-semibold">{p.sessions.toLocaleString("en-IN")}</td>
                      <td className="py-2 px-2">{p.newUsers.toLocaleString("en-IN")}</td>
                      <td className={`py-2 px-2 font-medium ${p.bounceRate > 70 ? "text-[#d94040]" : p.bounceRate > 50 ? "text-[#e89820]" : "text-[#0d6b4f]"}`}>
                        {p.bounceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-[13px] text-[#9e9e9a] bg-[#f7f7f5] rounded-lg p-2.5">
            Data from Google Analytics 4 · {data.property}
          </div>
        </Card>
      )}
    </div>
  );
}
