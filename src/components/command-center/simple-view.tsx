"use client";
import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, AlertCircle, CircleDashed,
  Megaphone, Store, Users, Search, Sparkles, Send, MessageCircle, Mail,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { reportText, type PlainReport, type Status, type HealthTile } from "@/lib/plain-insights";
import { Glance, type GlanceData } from "@/components/command-center/glance";

const STATUS_STYLE: Record<Status, { box: string; icon: typeof CheckCircle2; iconColor: string; word: string }> = {
  good: { box: "bg-[#F0FDF4] dark:bg-[#052E16] border-[#BBF7D0] dark:border-[#14532D]", icon: CheckCircle2, iconColor: "text-[#16A34A]", word: "Good" },
  warn: { box: "bg-[#FFFBEB] dark:bg-[#2D1C00] border-[#FDE68A] dark:border-[#78350F]", icon: AlertTriangle, iconColor: "text-[#CA8A04]", word: "Needs a look" },
  bad:  { box: "bg-[#FEF2F2] dark:bg-[#2D0A0A] border-[#FECACA] dark:border-[#7F1D1D]", icon: AlertCircle, iconColor: "text-[#DC2626]", word: "Fix this" },
  off:  { box: "bg-[#F5F5F4] dark:bg-[#1C1C1C] border-black/[0.06] dark:border-white/[0.06]", icon: CircleDashed, iconColor: "text-[#A1A1AA]", word: "No data" },
};
const AREA_ICON: Record<HealthTile["area"], typeof Store> = { Ads: Megaphone, Store, Customers: Users, Google: Search };
const FLAG_DOT = { good: "bg-[#22C55E]", warn: "bg-[#EAB308]", bad: "bg-[#EF4444]", info: "bg-[#A1A1AA]" } as const;

export function SimpleView({ report, glance, loading, onAsk, storeName, periodTitle }: {
  report: PlainReport; glance: GlanceData; loading: boolean; onAsk: (q: string) => void; storeName: string; periodTitle: string;
}) {
  const [mailState, setMailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [mailMsg, setMailMsg] = useState("");
  async function emailMe() {
    setMailState("sending"); setMailMsg("");
    try {
      const r = await fetch("/api/weekly-summary", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMailState("error"); setMailMsg(d.error ?? "Couldn't send"); return; }
      setMailState("sent"); setMailMsg(`Sent to ${d.to}. It also arrives every Monday.`);
    } catch { setMailState("error"); setMailMsg("Couldn't send"); }
  }
  const [q, setQ] = useState("");

  return (
    <div className="space-y-3">
      {/* ── Summary ── */}
      <Card className="border-l-[3px] border-l-[#F97316]">
        <div className="flex items-start gap-2.5">
          <Sparkles size={18} className="text-[#F97316] shrink-0 mt-0.5" />
          <p className="text-[16px] leading-relaxed text-[#18181B] dark:text-[#F4F4F5]">
            {loading ? "Reading your store, ads and Google data…" : report.summary}
          </p>
        </div>
        {!loading && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pl-[28px]">
            <a href={`https://wa.me/?text=${encodeURIComponent(reportText(report, `${storeName || "My store"} — ${periodTitle}`))}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold border border-[#BBF7D0] text-[#15803D] hover:bg-[#F0FDF4] dark:hover:bg-[#052E16]">
              <MessageCircle size={13} /> Share on WhatsApp
            </a>
            <button onClick={emailMe} disabled={mailState === "sending"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] disabled:opacity-50">
              <Mail size={13} /> {mailState === "sending" ? "Sending…" : "Email me the weekly summary"}
            </button>
            {mailMsg && <span className={cn("text-[13px]", mailState === "error" ? "text-[#DC2626]" : "text-[#15803D]")}>{mailMsg}</span>}
          </div>
        )}
      </Card>

      {/* ── Health tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {report.health.map(h => {
          const st = STATUS_STYLE[h.status];
          const AreaIcon = AREA_ICON[h.area];
          return (
            <div key={h.area} className={cn("rounded-2xl border p-3", st.box)}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#52525B] dark:text-[#A1A1AA]"><AreaIcon size={14} /> {h.area}</span>
                <span className={cn("flex items-center gap-1 text-[12px] font-bold", st.iconColor)}><st.icon size={13} /> {st.word}</span>
              </div>
              <div className="text-[17px] font-black text-[#18181B] dark:text-[#F4F4F5] mt-1.5 leading-tight">{loading ? "…" : h.headline}</div>
              <div className="text-[13px] text-[#52525B] dark:text-[#A1A1AA] mt-1 leading-snug">{loading ? "" : h.line}</div>
            </div>
          );
        })}
      </div>

      {/* ── At a glance: one simple chart per question ── */}
      <Glance d={glance} loading={loading} />

      {/* ── Every number, explained ── */}
      {report.explained.length > 0 && (
        <Card>
          <CardHeader title="Your numbers, explained" right={<span className="text-[13px] text-[#A1A1AA]">green = good · red = fix</span>} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {report.explained.map(m => (
              <div key={m.label} className="flex items-start gap-3 py-2.5 border-b border-black/[0.05] dark:border-white/[0.05]">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-1.5", FLAG_DOT[m.flag])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{m.label}</span>
                    <span className="text-[15px] font-black text-[#18181B] dark:text-[#F4F4F5] tabular-nums shrink-0">{m.value}</span>
                  </div>
                  <div className="text-[13px] text-[#52525B] dark:text-[#A1A1AA] mt-0.5 leading-relaxed">{m.sentence}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Ask in your own words ── */}
      <Card>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#F97316] shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && onAsk(q)}
            placeholder="Ask in your own words — &quot;why did sales drop this week?&quot;"
            className="flex-1 min-w-0 bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
          <button onClick={() => onAsk(q)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[15px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white shrink-0"><Send size={13} /> Ask</button>
        </div>
      </Card>
    </div>
  );
}
