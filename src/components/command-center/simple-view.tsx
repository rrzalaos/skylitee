"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, AlertCircle, CircleDashed, Check, Clock, ExternalLink,
  Megaphone, Store, Users, Search, Sparkles, Send, ArrowRight, ChevronDown, Trophy, MessageCircle, Mail,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { formatINR, cn } from "@/lib/utils";
import { reportText, type PlainReport, type PlainAction, type Status, type HealthTile } from "@/lib/plain-insights";

type ActionState = { status: "done" | "snoozed"; at: number; impact: number; title: string };

const STATUS_STYLE: Record<Status, { box: string; icon: typeof CheckCircle2; iconColor: string; word: string }> = {
  good: { box: "bg-[#F0FDF4] dark:bg-[#052E16] border-[#BBF7D0] dark:border-[#14532D]", icon: CheckCircle2, iconColor: "text-[#16A34A]", word: "Good" },
  warn: { box: "bg-[#FFFBEB] dark:bg-[#2D1C00] border-[#FDE68A] dark:border-[#78350F]", icon: AlertTriangle, iconColor: "text-[#CA8A04]", word: "Needs a look" },
  bad:  { box: "bg-[#FEF2F2] dark:bg-[#2D0A0A] border-[#FECACA] dark:border-[#7F1D1D]", icon: AlertCircle, iconColor: "text-[#DC2626]", word: "Fix this" },
  off:  { box: "bg-[#F5F5F4] dark:bg-[#1C1C1C] border-black/[0.06] dark:border-white/[0.06]", icon: CircleDashed, iconColor: "text-[#A1A1AA]", word: "No data" },
};
const AREA_ICON: Record<HealthTile["area"], typeof Store> = { Ads: Megaphone, Store, Customers: Users, Google: Search };
const FLAG_DOT = { good: "bg-[#22C55E]", warn: "bg-[#EAB308]", bad: "bg-[#EF4444]", info: "bg-[#A1A1AA]" } as const;

export function SimpleView({ report, loading, onAsk, storeName, periodTitle }: {
  report: PlainReport; loading: boolean; onAsk: (q: string) => void; storeName: string; periodTitle: string;
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
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [stats, setStats] = useState({ fixedThisMonth: 0, savedThisMonth: 0 });

  useEffect(() => {
    fetch("/api/actions").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.actions) setStates(d.actions);
      if (d) setStats({ fixedThisMonth: d.fixedThisMonth ?? 0, savedThisMonth: d.savedThisMonth ?? 0 });
    }).catch(() => {});
  }, []);

  const open = report.actions.filter(a => !states[a.id]);
  const today = open.slice(0, 3);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const doneRecently = Object.entries(states)
    .filter(([, s]) => s.status === "done" && s.at >= monthStart)
    .sort((a, b) => b[1].at - a[1].at);

  async function mark(a: Pick<PlainAction, "id" | "impact" | "title">, status: "done" | "snoozed" | "clear") {
    setBusy(a.id); setNote("");
    try {
      const r = await fetch("/api/actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, status, impact: a.impact, title: a.title }),
      });
      if (!r.ok) { setNote(r.status === 403 ? "Your role can view but not update this list." : "Couldn't save — please try again."); return; }
      const d = await r.json().catch(() => null);
      if (d) setStats({ fixedThisMonth: d.fixedThisMonth ?? 0, savedThisMonth: d.savedThisMonth ?? 0 });
      setStates(s => {
        const next = { ...s };
        if (status === "clear") delete next[a.id];
        else next[a.id] = { status, at: Date.now(), impact: a.impact, title: a.title };
        return next;
      });
    } catch { setNote("Couldn't save — please try again."); }
    finally { setBusy(null); }
  }

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

      {/* ── Results this month ── */}
      {stats.fixedThisMonth > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-[#F0FDF4] dark:bg-[#052E16] border border-[#BBF7D0] dark:border-[#14532D] px-3 py-2.5">
          <Trophy size={18} className="text-[#16A34A] shrink-0" />
          <span className="text-[15px] text-[#14532D] dark:text-[#BBF7D0]">
            You fixed <b>{stats.fixedThisMonth} {stats.fixedThisMonth === 1 ? "issue" : "issues"}</b> this month
            {stats.savedThisMonth > 0 && <> — worth about <b>{formatINR(stats.savedThisMonth)}</b></>}. Nice work.
          </span>
        </div>
      )}

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

      {/* ── Do these today ── */}
      <Card>
        <CardHeader
          title="Do these 3 things today"
          right={open.length > 3 ? <span className="text-[13px] text-[#A1A1AA]">{open.length - 3} more after these</span> : undefined}
        />
        {loading ? <div className="text-[15px] text-[#A1A1AA] py-6 text-center">Working out what matters most…</div>
          : today.length === 0 ? (
            <div className="flex items-center gap-2 text-[15px] text-[#15803D] py-4 justify-center"><CheckCircle2 size={16} /> Nothing urgent right now — you&apos;re on top of it.</div>
          ) : (
            <div className="space-y-2.5">
              {today.map((a, i) => (
                <div key={a.id} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C] text-[14px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-bold text-[#18181B] dark:text-[#F4F4F5] leading-snug">{a.title}</div>
                      <div className="text-[14px] text-[#52525B] dark:text-[#A1A1AA] mt-1 leading-relaxed">{a.why}</div>
                      {a.impact > 0 && (
                        <div className="inline-block mt-2 text-[13px] font-bold text-[#15803D] bg-[#F0FDF4] dark:bg-[#052E16] px-2 py-0.5 rounded-full">
                          ≈ {formatINR(a.impact)} {a.impactKind === "save" ? "you could save" : "you could earn"}
                        </div>
                      )}
                      {a.steps.length > 0 && (
                        <div className="mt-2">
                          <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="inline-flex items-center gap-1 text-[14px] font-bold text-[#EA580C] hover:underline">
                            <ChevronDown size={14} className={cn("transition-transform", expanded === a.id && "rotate-180")} /> How to fix
                          </button>
                          {expanded === a.id && (
                            <ol className="mt-2 space-y-1.5 pl-1">
                              {a.steps.map((step, n) => (
                                <li key={n} className="flex items-start gap-2 text-[14px] text-[#3F3F46] dark:text-[#D4D4D8] leading-snug">
                                  <span className="w-5 h-5 rounded-full bg-[#F5F5F4] dark:bg-[#262626] text-[12px] font-bold flex items-center justify-center shrink-0">{n + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {a.link && (a.link.external ? (
                          <a href={a.link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white">
                            {a.link.label} <ExternalLink size={13} />
                          </a>
                        ) : (
                          <Link href={a.link.href} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white">
                            {a.link.label} <ArrowRight size={13} />
                          </Link>
                        ))}
                        <button disabled={busy === a.id} onClick={() => mark(a, "done")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-bold border border-[#BBF7D0] text-[#15803D] hover:bg-[#F0FDF4] dark:hover:bg-[#052E16] disabled:opacity-50">
                          <Check size={13} /> Done
                        </button>
                        <button disabled={busy === a.id} onClick={() => mark(a, "snoozed")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-semibold text-[#71717A] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] disabled:opacity-50">
                          <Clock size={13} /> Not now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        {note && <div className="text-[13px] text-[#DC2626] mt-2">{note}</div>}
        {doneRecently.length > 0 && (
          <details className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
            <summary className="text-[14px] font-semibold text-[#71717A] cursor-pointer">Done this month ({doneRecently.length})</summary>
            <div className="mt-2 space-y-1.5">
              {doneRecently.map(([id, s]) => (
                <div key={id} className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="flex items-center gap-1.5 text-[#52525B] dark:text-[#A1A1AA] min-w-0"><Check size={13} className="text-[#16A34A] shrink-0" /><span className="truncate">{s.title}</span></span>
                  <button disabled={busy === id} onClick={() => mark({ id, impact: s.impact, title: s.title }, "clear")} className="text-[13px] text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] shrink-0">Undo</button>
                </div>
              ))}
            </div>
          </details>
        )}
      </Card>

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
