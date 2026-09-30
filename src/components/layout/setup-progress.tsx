"use client";
import { useEffect, useState } from "react";
import { ShoppingBag, Megaphone, Search, ChartColumn, CreditCard, X, ChevronDown, ChevronUp, CircleCheck, Circle, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Setup checklist bar on top of the dashboard. Shown ONLY to stores that came through the
// /welcome onboarding (new installs) and only to owners/admins who can connect things.
// Disappears once every step is done; can be hidden per browser.

interface OnboardingInfo {
  shop: string;
  role: string;
  onboarding: { answers?: { ads?: string } } | null;
  connected: { meta: boolean; gsc: boolean; ga4: boolean };
}

const dismissKey = (shop: string) => `skylitee-setup-hidden:${shop}`;

export function SetupProgress({ hasAccess }: { hasAccess: boolean }) {
  const [info, setInfo] = useState<OnboardingInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then(r => (r.ok ? r.json() : null))
      .then((d: OnboardingInfo | null) => {
        if (!d) return;
        try { if (localStorage.getItem(dismissKey(d.shop)) === "1") setHidden(true); } catch { /* ignore */ }
        setInfo(d);
      })
      .catch(() => {});
  }, []);

  if (!info?.onboarding || hidden || !["owner", "admin"].includes(info.role)) return null;

  // Not running Meta ads → Meta is optional and doesn't count toward the percentage.
  const metaOptional = info.onboarding.answers?.ads === "google" || info.onboarding.answers?.ads === "none";
  const steps = [
    { key: "shopify", label: "Shopify store",           why: "Sales, orders, customers",        done: true,                  href: null,                              icon: ShoppingBag, optional: false },
    { key: "meta",    label: "Meta Ads",                why: "Real ROAS & winning creatives",   done: info.connected.meta,   href: "/api/auth/meta",                  icon: Megaphone,   optional: metaOptional },
    { key: "gsc",     label: "Google Search Console",   why: "Keywords that bring buyers",      done: info.connected.gsc,    href: "/api/auth/google?service=gsc",    icon: Search,      optional: false },
    { key: "ga4",     label: "Google Analytics (GA4)",  why: "Where visitors drop off",         done: info.connected.ga4,    href: "/api/auth/google?service=ga4",    icon: ChartColumn, optional: false },
    { key: "plan",    label: "Start free trial",        why: "14 days, full dashboard",         done: hasAccess,             href: "/dashboard/pricing",              icon: CreditCard,  optional: false },
  ];
  const counted = steps.filter(s => !s.optional);
  const doneCount = counted.filter(s => s.done).length;
  if (doneCount === counted.length) return null;

  const pct = Math.round((doneCount / counted.length) * 100);
  const next = steps.find(s => !s.done && !s.optional) ?? steps.find(s => !s.done);

  const hide = () => {
    try { localStorage.setItem(dismissKey(info.shop), "1"); } catch { /* ignore */ }
    setHidden(true);
  };

  return (
    <div className="mb-4 rounded-2xl border border-[#F97316]/25 bg-white dark:bg-[#111111] shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <Rocket size={16} className="text-[#F97316] shrink-0" />
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[15px] font-bold dark:text-[#F4F4F5]">Setup {pct}% done</span>
            <span className="text-[13px] text-[#A1A1AA]">{doneCount} of {counted.length} steps</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F5F5F4] dark:bg-[#262626] overflow-hidden">
            <div className="h-full rounded-full bg-[#F97316] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {next?.href && (
          <a href={next.href}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-[14px] font-bold shrink-0">
            {next.key === "plan" ? "Start free trial" : `Connect ${next.label}`} <ArrowRight size={13} />
          </a>
        )}
        <button onClick={() => setOpen(v => !v)} aria-label={open ? "Hide steps" : "Show steps"}
          className="p-1.5 rounded-lg text-[#71717A] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button onClick={hide} aria-label="Hide setup bar"
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] shrink-0">
          <X size={15} />
        </button>
      </div>

      {open && (
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {steps.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.key} className={cn("rounded-xl border p-3",
                s.done ? "border-[#22C55E]/30 bg-[#22C55E]/[0.05]" : "border-black/[0.06] dark:border-white/[0.08]")}>
                <div className="flex items-center gap-1.5 text-[14px] font-semibold dark:text-[#F4F4F5]">
                  {s.done ? <CircleCheck size={15} className="text-[#22C55E]" /> : <Circle size={15} className="text-[#A1A1AA]" />}
                  <Icon size={13} className="text-[#A1A1AA]" /> {s.label}
                </div>
                <div className="text-[13px] text-[#A1A1AA] mt-0.5">{s.why}{s.optional && !s.done ? " · optional" : ""}</div>
                {!s.done && s.href && (
                  <a href={s.href} className="inline-block mt-1.5 text-[13px] font-bold text-[#F97316] hover:text-[#EA580C]">
                    {s.key === "plan" ? "Start trial →" : "Connect →"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
