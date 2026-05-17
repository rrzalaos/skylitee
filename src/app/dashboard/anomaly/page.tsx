"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw, Package, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Alert { title: string; desc: string; }
interface AnomalyData {
  critical: Alert[];
  warnings: Alert[];
  positive: Alert[];
  summary: { totalOrders: number; codPct: number; repeatRate: number; projectedMonthly: number; days: number; grossSales: number };
}

export default function AnomalyPage() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/shopify/anomalies")
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const totalAlerts = (data?.critical.length ?? 0) + (data?.warnings.length ?? 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Anomaly Feed</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">Real-time signals from your Shopify store</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Critical", value: data?.critical.length ?? 0, color: "text-[#d94040]" },
              { label: "Warnings", value: data?.warnings.length ?? 0, color: "text-[#e89820]" },
              { label: "Positive", value: data?.positive.length ?? 0, color: "text-[#0d6b4f]" },
            ].map(s => (
              <div key={s.label} className="text-center px-3 py-2 bg-white border border-black/[0.09] rounded-xl">
                <div className={`text-xl font-bold ${s.color}`}>{loading ? "—" : s.value}</div>
                <div className="text-[11px] text-[#686864] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg border border-black/[0.09] hover:bg-[#f7f7f5] transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[12px] text-[#686864] py-16 text-center">Analysing your store data...</div>
      ) : !data ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-[#686864] mb-3">Could not load — check Shopify connection</p>
          <Link href="/dashboard/connections" className="text-[12px] text-[#17a773] font-medium underline">Go to Connections →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            {/* Critical */}
            {data.critical.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3">
                  Critical — action needed now
                </div>
                {data.critical.map((a, i) => (
                  <div key={i} className="border border-[#fca5a5] rounded-xl p-3.5 mb-2.5 flex items-start gap-3 bg-[#fff5f5]">
                    <div className="w-9 h-9 rounded-lg bg-[#fce8e8] flex items-center justify-center shrink-0">
                      <AlertCircle size={14} className="text-[#d94040]" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#181816]">{a.title}</div>
                      <div className="text-[12px] text-[#686864] mt-1 leading-relaxed">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Warnings */}
            {data.warnings.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3 mt-4">
                  Warnings — monitor closely
                </div>
                {data.warnings.map((a, i) => (
                  <div key={i} className="border border-[#fde68a] rounded-xl p-3.5 mb-2.5 flex items-start gap-3 bg-[#fffdf0]">
                    <div className="w-9 h-9 rounded-lg bg-[#faecd7] flex items-center justify-center shrink-0">
                      <AlertTriangle size={14} className="text-[#e89820]" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#181816]">{a.title}</div>
                      <div className="text-[12px] text-[#686864] mt-1 leading-relaxed">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {totalAlerts === 0 && (
              <div className="border border-[#e0f5ee] rounded-xl p-6 text-center bg-[#f7fdf9]">
                <CheckCircle2 size={24} className="text-[#17a773] mx-auto mb-2" />
                <div className="text-[13px] font-semibold text-[#064d38]">All clear!</div>
                <div className="text-[12px] text-[#686864] mt-1">No critical issues or warnings detected in your store.</div>
              </div>
            )}
          </div>

          <div>
            {/* Positive signals */}
            {data.positive.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3">
                  Positive signals
                </div>
                {data.positive.map((a, i) => (
                  <div key={i} className={`border rounded-xl p-3.5 mb-2.5 flex items-start gap-3 ${i === 0 ? "border-[#e0f5ee] bg-[#f7fdf9]" : "border-[#e4eef9] bg-[#f5f8fd]"}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? "bg-[#e0f5ee]" : "bg-[#e4eef9]"}`}>
                      {i === 0 ? <TrendingUp size={14} className="text-[#064d38]" /> : <CheckCircle2 size={14} className="text-[#0a3d7a]" />}
                    </div>
                    <div>
                      <div className={`text-[13px] font-semibold ${i === 0 ? "text-[#064d38]" : "text-[#0a3d7a]"}`}>{a.title}</div>
                      <div className="text-[12px] text-[#686864] mt-1 leading-relaxed">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Store summary */}
            <Card className="mt-3">
              <CardHeader title="Store summary" right="This month" />
              <div className="space-y-2.5">
                {[
                  { label: "Total orders", value: data.summary.totalOrders.toString() },
                  { label: "COD ratio", value: `${data.summary.codPct}%`, warn: data.summary.codPct > 50 },
                  { label: "Repeat rate", value: `${data.summary.repeatRate}%`, warn: data.summary.repeatRate < 20 },
                  { label: "Projected monthly", value: `₹${data.summary.projectedMonthly.toLocaleString("en-IN")}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-[12px]">
                    <span className="text-[#686864]">{row.label}</span>
                    <span className={`font-semibold ${row.warn ? "text-[#d94040]" : "text-[#181816]"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-3 text-[11px] text-[#9e9e9a] leading-relaxed bg-[#f7f7f5] rounded-xl p-3">
              <strong className="text-[#686864]">About anomaly detection:</strong> Signals are computed from your live Shopify data — stock levels, order patterns, COD ratio, and customer repeat behaviour. Connect Meta Ads and GA4 to unlock ROAS anomalies and traffic drop alerts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
