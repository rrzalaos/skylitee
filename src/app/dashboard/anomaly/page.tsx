"use client";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { anomalies } from "@/lib/mock-data";
import { TrendingDown, Package, Zap, TrendingUp, RefreshCw, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

const weekHistory = [
  { day: "Aug 13", count: 2 },
  { day: "Aug 14", count: 3 },
  { day: "Aug 15", count: 1.5 },
  { day: "Aug 16", count: 4 },
  { day: "Aug 17", count: 2.5 },
  { day: "Aug 18", count: 3.5 },
  { day: "Aug 19", count: 4.5 },
];

const criticalIcons: Record<number, { icon: React.ReactNode; bg: string }> = {
  0: { icon: <TrendingDown size={14} className="text-[#6e1c1c]" />, bg: "bg-[#fce8e8]" },
  1: { icon: <Package size={14} className="text-[#6e1c1c]" />, bg: "bg-[#fce8e8]" },
  2: { icon: <Zap size={14} className="text-[#5c3608]" />, bg: "bg-[#faecd7]" },
};

const positiveIcons: Record<number, { icon: React.ReactNode; bg: string }> = {
  0: { icon: <TrendingUp size={14} className="text-[#064d38]" />, bg: "bg-[#e0f5ee]" },
  1: { icon: <RefreshCw size={14} className="text-[#0a3d7a]" />, bg: "bg-[#e4eef9]" },
};

export default function AnomalyPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Anomaly Feed</h2>
          <p className="text-[12px] text-[#686864] mt-0.5">AI-detected patterns · real-time</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Critical", value: "3", color: "text-[#d94040]" },
            { label: "Warnings", value: "5", color: "text-[#e89820]" },
            { label: "Positive", value: "2", color: "text-[#0d6b4f]" },
            { label: "Confidence", value: "94%", color: "text-[#181816]" },
          ].map((s) => (
            <div key={s.label} className="text-center px-3 py-2 bg-white border border-black/[0.09] rounded-xl">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[12px] text-[#686864] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3">Critical anomalies</div>

          {anomalies.critical.map((a, i) => {
            const ic = criticalIcons[i] || criticalIcons[0];
            return (
              <div key={i} className="border border-black/[0.09] rounded-xl p-3 mb-2.5 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ic.bg}`}>
                  {ic.icon}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#181816]">{a.title}</div>
                  <div className="text-[12px] text-[#686864] mt-1 leading-relaxed">{a.desc}</div>
                </div>
              </div>
            );
          })}

          <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider pb-1.5 border-b border-black/[0.09] mb-3 mt-4">Positive signals</div>

          {anomalies.positive.map((a, i) => {
            const ic = positiveIcons[i] || positiveIcons[0];
            return (
              <div key={i} className={`border rounded-xl p-3 mb-2.5 flex items-start gap-3 ${i === 0 ? "border-[#e0f5ee]" : "border-[#e4eef9]"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ic.bg}`}>
                  {ic.icon}
                </div>
                <div>
                  <div className={`text-[13px] font-semibold ${i === 0 ? "text-[#064d38]" : "text-[#0a3d7a]"}`}>{a.title}</div>
                  <div className="text-[12px] text-[#686864] mt-1 leading-relaxed">{a.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <Card className="mb-3">
            <CardHeader title="Anomaly history (7 days)" />
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={weekHistory} barSize={16}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9e9e9a" }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {weekHistory.map((_, i) => <Cell key={i} fill="#F4ADAD" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardHeader title="What to do" />
            <InsightCard type="danger" title="ROAS crash → creative fatigue" body="Check ad frequency (>2.0) and audience saturation first. Refresh creatives." action="Go to Creative Studio" />
            <InsightCard type="warning" title="Bounce spike → page speed issue" body="New images likely causing slowdown. Run PageSpeed Insights." action="Check Google GSC" />
            <InsightCard title="Stock selling fast → scale ad + reorder" body="Scale the winning campaign AND reorder inventory simultaneously." action="Go to Products" />
          </Card>
        </div>
      </div>
    </div>
  );
}
