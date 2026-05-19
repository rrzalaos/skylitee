"use client";
import { useEffect, useState, useCallback } from "react";
import { NotConnected } from "@/components/ui/not-connected";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDateRange } from "@/lib/date-range-context";
import { formatINR, formatNumber } from "@/lib/utils";
import { Image as ImageIcon, Video, LayoutGrid, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { exportToCSV, exportToPDF } from "@/lib/export";

interface AdCreative {
  id: string;
  name: string;
  status: string;
  thumbnail: string | null;
  objectType: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  purchases: number;
  purchaseValue: number;
  atc: number;
  roas: number;
  cac: number;
  videoViews3s: number;
  thruplay: number;
  thumbStopRatio: number;
  holdRatio: number;
  score: number;
  signal: "scale" | "keep" | "refresh" | "pause";
}

interface AdsData {
  adAccountName: string;
  currency: string;
  period: { from: string; to: string };
  ads: AdCreative[];
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scale: { bg: "bg-[#e0f5ee]", text: "text-[#0d6b4f]", label: "Scale" },
  keep: { bg: "bg-[#e8f0fd]", text: "text-[#1877F2]", label: "Keep" },
  refresh: { bg: "bg-[#fff3e0]", text: "text-[#e89820]", label: "Refresh" },
  pause: { bg: "bg-[#fce8e8]", text: "text-[#d94040]", label: "Pause" },
};

function scoreColor(score: number) {
  if (score >= 75) return "bg-[#17a773]";
  if (score >= 55) return "bg-[#1877F2]";
  if (score >= 35) return "bg-[#e89820]";
  return "bg-[#d94040]";
}

function CreativeCard({ ad, currency }: { ad: AdCreative; currency: string }) {
  const sig = SIGNAL_STYLES[ad.signal];
  const isVideo = ad.objectType?.toLowerCase().includes("video") || ad.videoViews3s > 0;
  const fmt = (n: number) => currency === "INR" ? formatINR(n) : `$${n.toFixed(0)}`;

  return (
    <div className="bg-white border border-black/[0.09] rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-36 bg-[#f0f5ff] flex items-center justify-center">
        {ad.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.thumbnail} alt={ad.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#1877F2] opacity-50">
            {isVideo ? <Video size={32} /> : <ImageIcon size={32} />}
            <span className="text-[13px]">{isVideo ? "Video" : "Image"}</span>
          </div>
        )}
        {/* Signal badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[12px] font-semibold ${sig.bg} ${sig.text}`}>
          {sig.label}
        </div>
        {/* Status badge */}
        {ad.status === "PAUSED" && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[12px] font-medium bg-black/40 text-white">
            Paused
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Ad name */}
        <div className="text-[14px] font-semibold text-[#181816] truncate mb-2" title={ad.name}>
          {ad.name}
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-[#686864]">Creative Score</span>
            <span className="text-[14px] font-semibold text-[#181816]">{ad.score}/100</span>
          </div>
          <div className="h-1.5 bg-[#f0f0ee] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${scoreColor(ad.score)}`} style={{ width: `${ad.score}%` }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { label: "ROAS", value: ad.roas > 0 ? `${ad.roas}×` : "—" },
            { label: "CTR", value: `${ad.ctr.toFixed(1)}%` },
            { label: "Freq", value: ad.frequency > 0 ? ad.frequency.toFixed(1) : "—" },
          ].map(s => (
            <div key={s.label} className="text-center bg-[#f7f7f5] rounded-lg py-1.5">
              <div className="text-[14px] font-semibold text-[#181816]">{s.value}</div>
              <div className="text-[12px] text-[#9e9e9a]">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[13px] text-[#686864] border-t border-black/[0.06] pt-2">
          <span>Spend: <span className="font-medium text-[#181816]">{fmt(ad.spend)}</span></span>
          <span>{ad.purchases} orders</span>
        </div>

        {/* Video metrics if applicable */}
        {isVideo && (ad.thumbStopRatio > 0 || ad.holdRatio > 0) && (
          <div className="flex gap-3 mt-2 text-[12px] text-[#9e9e9a]">
            <span>Thumb stop: <span className="text-[#181816] font-medium">{ad.thumbStopRatio}%</span></span>
            <span>Hold: <span className="text-[#181816] font-medium">{ad.holdRatio}%</span></span>
          </div>
        )}

        {/* Fatigue warning */}
        {ad.frequency >= 2.5 && (
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#d94040] bg-[#fce8e8] rounded-lg px-2 py-1">
            <AlertTriangle size={11} />
            Frequency {ad.frequency.toFixed(1)} — creative fatigue risk
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreativePage() {
  const { range } = useDateRange();
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "scale" | "keep" | "refresh" | "pause">("all");

  useEffect(() => {
    fetch("/api/meta/accounts")
      .then(r => r.json())
      .then(d => setConnected(!d.error))
      .catch(() => setConnected(false))
      .finally(() => setChecking(false));
  }, []);

  const load = useCallback(() => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    fetch(`/api/meta/ads?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load creative data"))
      .finally(() => setLoading(false));
  }, [connected, range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  const ads = data?.ads ?? [];
  const filtered = filter === "all" ? ads : ads.filter(a => a.signal === filter);

  const topRoas = ads.length ? Math.max(...ads.map(a => a.roas)) : 0;
  const avgScore = ads.length ? Math.round(ads.reduce((s, a) => s + a.score, 0) / ads.length) : 0;
  const fatigueCount = ads.filter(a => a.frequency >= 2.5).length;
  const currency = data?.currency ?? "INR";
  const fmtC = (n: number) => `${currency === "INR" ? "₹" : "$"}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const fmtN = (n: number) => n.toLocaleString("en-IN");

  function buildSections() {
    if (!ads.length) return [];
    return [
      {
        title: "Creative Summary",
        headers: ["Metric", "Value"],
        rows: [
          ["Total Creatives", ads.length],
          ["Top ROAS", topRoas > 0 ? `${topRoas}x` : "—"],
          ["Avg Creative Score", `${avgScore}/100`],
          ["Fatigue Risk (Freq ≥ 2.5)", fatigueCount],
          ["Scale Signals", ads.filter(a => a.signal === "scale").length],
          ["Pause Signals", ads.filter(a => a.signal === "pause").length],
        ],
      },
      {
        title: "All Ad Creatives",
        headers: ["Ad Name", "Status", "Type", "Score", "Signal", "Spend", "Impressions", "Clicks", "CTR", "CPC", "CPM", "Freq", "Purchases", "Revenue", "ROAS", "CAC", "ATC", "3s Views", "Thruplay", "Thumb Stop%", "Hold%"],
        rows: ads.map(a => [
          a.name, a.status, a.objectType ?? "Image",
          `${a.score}/100`, SIGNAL_STYLES[a.signal]?.label ?? a.signal,
          fmtC(a.spend), fmtN(a.impressions), fmtN(a.clicks),
          `${a.ctr}%`, fmtC(a.cpc), fmtC(a.cpm),
          a.frequency.toFixed(2), a.purchases, fmtC(a.purchaseValue),
          a.roas > 0 ? `${a.roas}x` : "—", a.cac > 0 ? fmtC(a.cac) : "—",
          a.atc, fmtN(a.videoViews3s), fmtN(a.thruplay),
          a.thumbStopRatio > 0 ? `${a.thumbStopRatio}%` : "—",
          a.holdRatio > 0 ? `${a.holdRatio}%` : "—",
        ]),
      },
    ];
  }

  function handleExportCSV() { exportToCSV(`skylitee-creatives-${range.from}`, buildSections()); }
  async function handleExportPDF() {
    await exportToPDF(
      `skylitee-creatives-${range.from}`,
      "Meta Ad Creatives Report",
      `${data?.adAccountName ?? "Meta Ads"} · ${range.from} → ${range.to}`,
      buildSections()
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Creative Studio</h2>
          <p className="text-[15px] text-[#686864] mt-0.5">AI creative scoring · fatigue detection · performance ranking</p>
        </div>
        {ads.length > 0 && <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      </div>

      {checking ? (
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading…</div>
      ) : !connected ? (
        <NotConnected
          platform="meta"
          label="Meta Business Suite"
          description="Connect Meta to analyse creative fatigue, score your ad creatives 0–100, and get AI-powered recommendations on what to refresh or scale."
        />
      ) : loading ? (
        <div className="text-[15px] text-[#686864] py-16 text-center">Loading creative data…</div>
      ) : error ? (
        <div className="text-[15px] text-[#d94040] py-16 text-center">{error}</div>
      ) : !ads.length ? (
        <Card>
          <div className="py-12 text-center text-[15px] text-[#686864]">
            No ads with spend found in this date range.
          </div>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Total Creatives", value: String(ads.length), icon: <LayoutGrid size={14} /> },
              { label: "Top ROAS", value: topRoas > 0 ? `${topRoas}×` : "—", icon: <TrendingUp size={14} /> },
              { label: "Avg Creative Score", value: `${avgScore}/100`, icon: null },
              {
                label: "Fatigue Risk",
                value: String(fatigueCount),
                icon: <AlertTriangle size={14} />,
                warn: fatigueCount > 0,
              },
            ].map(k => (
              <div key={k.label} className={`bg-white border rounded-xl p-3.5 ${k.warn ? "border-[#d94040]/30" : "border-black/[0.09]"}`}>
                <div className="text-[15px] text-[#686864] mb-1.5 flex items-center gap-1 font-medium">
                  {k.icon} {k.label}
                </div>
                <div className={`text-2xl font-semibold ${k.warn && fatigueCount > 0 ? "text-[#d94040]" : "text-[#181816]"}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 mb-3">
            {(["all", "scale", "keep", "refresh", "pause"] as const).map(f => {
              const count = f === "all" ? ads.length : ads.filter(a => a.signal === f).length;
              const sig = f === "all" ? null : SIGNAL_STYLES[f];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                    filter === f
                      ? (sig ? `${sig.bg} ${sig.text}` : "bg-[#181816] text-white")
                      : "bg-[#f7f7f5] text-[#686864] hover:bg-[#eeeeec]"
                  }`}
                >
                  {f === "all" ? "All" : SIGNAL_STYLES[f].label} ({count})
                </button>
              );
            })}
          </div>

          {/* Creative grid */}
          <div className="grid grid-cols-3 gap-2">
            {filtered.map(ad => (
              <CreativeCard key={ad.id} ad={ad} currency={currency} />
            ))}
          </div>

          {filtered.length === 0 && (
            <Card>
              <div className="py-10 text-center text-[15px] text-[#686864]">
                No creatives in this category.
              </div>
            </Card>
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[13px] text-[#9e9e9a]">
            <span className="font-medium text-[#686864]">Score guide:</span>
            {[
              { color: "bg-[#17a773]", label: "75–100 Scale" },
              { color: "bg-[#1877F2]", label: "55–74 Keep" },
              { color: "bg-[#e89820]", label: "35–54 Refresh" },
              { color: "bg-[#d94040]", label: "0–34 Pause" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
