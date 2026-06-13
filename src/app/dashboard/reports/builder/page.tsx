"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FileText, Plus, X, ChevronUp, ChevronDown, Download, Save, Trash2,
  Palette, ImageIcon, RefreshCw, Check,
} from "lucide-react";
import { REPORT_GROUPS, BLOCK_BY_ID, sourcesFor, ReportCtx, ReportSource } from "@/lib/report-blocks";
import { exportToPDF, ExportSection } from "@/lib/export";
import { getPresetRange, DatePreset } from "@/lib/date-range-context";

interface Branding { brandName: string; color: string; clientName: string; logoDataUrl: string; reportTitle: string }
interface Template { id: string; name: string; blocks: string[]; branding: Partial<Branding> }

const SOURCE_ENDPOINT: Record<Exclude<ReportSource, "ai">, string> = {
  shopify:    "/api/shopify/sales",
  dashboard:  "/api/shopify/dashboard",
  customers:  "/api/shopify/customers/period",
  meta:       "/api/meta",
  ga4:        "/api/ga4",
  gsc:        "/api/gsc",
};

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" }, { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" }, { id: "28d", label: "Last 28 days" },
  { id: "this_month", label: "This month" }, { id: "last_month", label: "Last month" },
  { id: "custom", label: "Custom" },
];

export default function ReportBuilderPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [branding, setBranding] = useState<Branding>({ brandName: "", color: "#F97316", clientName: "", logoDataUrl: "", reportTitle: "Performance Report" });
  const [showBranding, setShowBranding] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { loadTemplates(); }, []);
  const flash = (kind: "ok" | "err", text: string) => { setMsg({ kind, text }); setTimeout(() => setMsg(null), 3500); };

  async function loadTemplates() {
    try {
      const res = await fetch("/api/reports/templates");
      if (res.ok) { const d = await res.json() as { templates: Template[] }; setTemplates(d.templates ?? []); }
    } catch { /* ignore */ }
  }

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const move = (id: string, dir: -1 | 1) =>
    setSelected(prev => {
      const i = prev.indexOf(id); const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next;
    });

  function resolveRange() {
    if (preset === "custom") {
      if (!customFrom || !customTo) return null;
      return { from: customFrom, to: customTo, label: "Custom" };
    }
    return getPresetRange(preset);
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBranding(b => ({ ...b, logoDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function generate() {
    if (selected.length === 0) { flash("err", "Select at least one block."); return; }
    const range = resolveRange();
    if (!range) { flash("err", "Pick custom start and end dates."); return; }

    setGenerating(true);
    try {
      const needed = sourcesFor(selected);
      const dataSources = needed.filter(s => s !== "ai") as Exclude<ReportSource, "ai">[];
      const qs = `?from=${range.from}&to=${range.to}`;

      const entries = await Promise.all(dataSources.map(async (s) => {
        try {
          const res = await fetch(`${SOURCE_ENDPOINT[s]}${qs}`);
          return [s, res.ok ? await res.json() : null] as const;
        } catch { return [s, null] as const; }
      }));
      const ctx: ReportCtx = Object.fromEntries(entries);

      if (needed.includes("ai")) {
        try {
          const res = await fetch("/api/ai/report", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shopify: ctx.shopify ?? null, meta: ctx.meta ?? null,
              gsc: ctx.gsc ?? null, ga4: ctx.ga4 ?? null,
              period: { from: range.from, to: range.to },
            }),
          });
          if (res.ok) { const d = await res.json() as { report?: unknown }; ctx.ai = d.report ?? null; }
        } catch { /* AI optional */ }
      }

      const sections: ExportSection[] = [];
      for (const id of selected) {
        const block = BLOCK_BY_ID[id];
        if (block) sections.push(...block.build(ctx));
      }

      if (sections.length === 0) {
        flash("err", "No data for the selected blocks in this period (is the platform connected?).");
        setGenerating(false); return;
      }

      const title = branding.reportTitle.trim() || "Performance Report";
      const subtitle = `${branding.clientName ? branding.clientName + " · " : ""}${range.label} (${range.from} → ${range.to})`;
      const fileBase = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${range.from}`;
      await exportToPDF(fileBase, title, subtitle, sections, {
        brandName: branding.brandName, color: branding.color, logoDataUrl: branding.logoDataUrl || undefined,
      });
      flash("ok", "Report generated.");
    } catch {
      flash("err", "Could not generate the report. Please try again.");
    }
    setGenerating(false);
  }

  async function saveTemplate() {
    if (!templateName.trim()) { flash("err", "Name your template first."); return; }
    if (selected.length === 0) { flash("err", "Select at least one block."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/reports/templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateName.trim(), blocks: selected, branding }),
      });
      if (res.ok) { setTemplateName(""); await loadTemplates(); flash("ok", "Template saved."); }
      else { const d = await res.json(); flash("err", d.error ?? "Could not save."); }
    } catch { flash("err", "Could not save template."); }
    setSaving(false);
  }

  function loadTemplate(t: Template) {
    setSelected(t.blocks.filter(b => BLOCK_BY_ID[b]));
    setBranding(b => ({ ...b, ...t.branding }));
    flash("ok", `Loaded "${t.name}".`);
  }

  async function deleteTemplate(id: string) {
    try { await fetch(`/api/reports/templates?id=${id}`, { method: "DELETE" }); await loadTemplates(); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-2">
            <FileText size={18} className="text-[#F97316]" /> Custom Report Builder
          </h2>
          <p className="text-[15px] text-[#A1A1AA] mt-0.5">Pick blocks, set a date range, brand it, and generate a PDF.</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[15px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors disabled:opacity-60"
        >
          {generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          {generating ? "Generating…" : "Generate PDF"}
        </button>
      </div>

      {msg && (
        <div className={cn("rounded-xl px-4 py-2.5 text-[15px] font-semibold flex items-center gap-2",
          msg.kind === "ok" ? "bg-[#F0FDF4] text-[#15803D]" : "bg-[#FEF2F2] text-[#991B1B]")}>
          {msg.kind === "ok" ? <Check size={14} /> : <X size={14} />}{msg.text}
        </div>
      )}

      {/* Toolbar: title + date + templates */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide block mb-1">Report title</label>
            <input value={branding.reportTitle} onChange={e => setBranding(b => ({ ...b, reportTitle: e.target.value }))}
              placeholder="Performance Report"
              className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide block mb-1">Date range</label>
            <select value={preset} onChange={e => setPreset(e.target.value as DatePreset)}
              className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]">
              {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            {preset === "custom" ? (
              <>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="flex-1 bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-2 py-2 text-[14px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="flex-1 bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-2 py-2 text-[14px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
              </>
            ) : (
              <button onClick={() => setShowBranding(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[15px] font-semibold bg-[#F5F5F4] dark:bg-[#262626] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#F97316] transition-colors w-full justify-center">
                <Palette size={13} /> White-label branding
              </button>
            )}
          </div>
        </div>

        {/* Branding panel */}
        {(showBranding || preset === "custom") && (
          <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide block mb-1">Brand name</label>
              <input value={branding.brandName} onChange={e => setBranding(b => ({ ...b, brandName: e.target.value }))}
                placeholder="Skylitee"
                className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide block mb-1">Client name</label>
              <input value={branding.clientName} onChange={e => setBranding(b => ({ ...b, clientName: e.target.value }))}
                placeholder="Client / store name"
                className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide block mb-1">Accent color</label>
              <input type="color" value={branding.color} onChange={e => setBranding(b => ({ ...b, color: e.target.value }))}
                className="w-full h-[38px] bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-1 cursor-pointer" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide block mb-1">Logo</label>
              {branding.logoDataUrl ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding.logoDataUrl} alt="logo" className="h-[38px] w-auto max-w-[80px] object-contain rounded-lg border border-black/[0.06]" />
                  <button onClick={() => setBranding(b => ({ ...b, logoDataUrl: "" }))} className="text-[14px] text-[#EF4444] font-semibold">Remove</button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[15px] font-semibold bg-[#F5F5F4] dark:bg-[#262626] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#F97316] transition-colors cursor-pointer">
                  <ImageIcon size={13} /> Upload
                  <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Templates */}
        {templates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-[#A1A1AA]">Templates:</span>
            {templates.map(t => (
              <span key={t.id} className="inline-flex items-center gap-1 bg-[#F5F5F4] dark:bg-[#262626] rounded-lg pl-2.5 pr-1 py-1 text-[14px]">
                <button onClick={() => loadTemplate(t)} className="font-semibold text-[#18181B] dark:text-[#F4F4F5] hover:text-[#F97316]">{t.name}</button>
                <button onClick={() => deleteTemplate(t.id)} className="text-[#A1A1AA] hover:text-[#EF4444] p-0.5"><Trash2 size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Builder: left categories, right selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — add blocks */}
        <Card>
          <div className="text-[16px] font-bold dark:text-[#F4F4F5] mb-3">Add blocks</div>
          <div className="space-y-4">
            {REPORT_GROUPS.map(g => (
              <div key={g.id}>
                <div className="text-[13px] font-bold text-[#A1A1AA] uppercase tracking-wide mb-1.5">{g.label}</div>
                <div className="space-y-1">
                  {g.blocks.map(b => {
                    const on = selected.includes(b.id);
                    return (
                      <button key={b.id} onClick={() => toggle(b.id)}
                        className={cn("w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-[15px] transition-colors",
                          on ? "bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C]" : "hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] text-[#52525B] dark:text-[#A1A1AA]")}>
                        <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          on ? "bg-[#F97316] border-[#F97316]" : "border-black/20 dark:border-white/20")}>
                          {on && <Check size={11} className="text-white" />}
                        </span>
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT — your report */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[16px] font-bold dark:text-[#F4F4F5]">Your report ({selected.length})</div>
            <div className="flex items-center gap-1.5">
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name"
                className="bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[14px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] w-32" />
              <button onClick={saveTemplate} disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[14px] font-bold bg-[#F5F5F4] dark:bg-[#262626] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#F97316] transition-colors disabled:opacity-50">
                <Save size={12} /> Save
              </button>
            </div>
          </div>
          {selected.length === 0 ? (
            <div className="py-12 text-center text-[15px] text-[#A1A1AA]">
              <Plus size={20} className="mx-auto mb-2 opacity-40" />
              Select blocks on the left — they&apos;ll appear here in order.
            </div>
          ) : (
            <div className="space-y-1.5">
              {selected.map((id, i) => (
                <div key={id} className="flex items-center gap-2 bg-[#FAFAF9] dark:bg-[#1C1C1C] rounded-lg px-2.5 py-2">
                  <span className="text-[13px] font-bold text-[#A1A1AA] w-5">{i + 1}</span>
                  <span className="flex-1 text-[15px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">{BLOCK_BY_ID[id]?.label ?? id}</span>
                  <button onClick={() => move(id, -1)} disabled={i === 0} className="text-[#A1A1AA] hover:text-[#F97316] disabled:opacity-30"><ChevronUp size={15} /></button>
                  <button onClick={() => move(id, 1)} disabled={i === selected.length - 1} className="text-[#A1A1AA] hover:text-[#F97316] disabled:opacity-30"><ChevronDown size={15} /></button>
                  <button onClick={() => toggle(id)} className="text-[#A1A1AA] hover:text-[#EF4444]"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
