"use client";
import { useEffect, useRef, useState } from "react";
import {
  Lock, TrendingUp, TrendingDown, Target, Wallet, ArrowRight, Check, LoaderCircle, Sparkles,
  ShoppingBag, Repeat, Truck, TriangleAlert, Search, Megaphone, Package, Percent, CircleCheck, Trophy,
} from "lucide-react";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";
import type { XRay } from "@/app/api/onboarding/xray/route";

type Goal = "sales" | "ad_cost" | "profit";
type Ads = "meta" | "google" | "both" | "none";
type Revenue = "lt_1l" | "1_10l" | "gt_10l";
type Answers = { goal?: Goal; ads?: Ads; revenue?: Revenue };
type Flag = "good" | "bad" | "neutral";

const QUESTIONS = [
  {
    key: "goal" as const,
    title: "What matters most to you right now?",
    options: [
      { v: "sales",   label: "Grow my sales",           icon: TrendingUp },
      { v: "ad_cost", label: "Cut wasted ad spend",     icon: Target },
      { v: "profit",  label: "Know my real profit",     icon: Wallet },
    ],
  },
  {
    key: "ads" as const,
    title: "Where do you run ads?",
    options: [
      { v: "meta",   label: "Meta (Facebook / Instagram)", icon: Megaphone },
      { v: "google", label: "Google",                      icon: Search },
      { v: "both",   label: "Both",                        icon: Sparkles },
      { v: "none",   label: "Not running ads yet",         icon: ShoppingBag },
    ],
  },
  {
    key: "revenue" as const,
    title: "Roughly how much do you sell per month?",
    options: [
      { v: "lt_1l",  label: "Under ₹1 lakh",       icon: Package },
      { v: "1_10l",  label: "₹1 – 10 lakh",        icon: Package },
      { v: "gt_10l", label: "Over ₹10 lakh",       icon: Package },
    ],
  },
];

const SCAN_STEPS = ["Reading your orders", "Finding your best & worst weeks", "Checking repeat customers", "Looking for money leaks"];

const FLAG_STYLE: Record<Flag, { border: string; badge: string; text: string; label: string }> = {
  good:    { border: "border-[#22C55E]/30", badge: "bg-[#22C55E]/15 text-[#22C55E]", text: "text-[#22C55E]", label: "Working well" },
  bad:     { border: "border-[#EF4444]/30", badge: "bg-[#EF4444]/15 text-[#EF4444]", text: "text-[#EF4444]", label: "Needs attention" },
  neutral: { border: "border-white/[0.08]", badge: "bg-white/[0.06] text-white/50",   text: "text-white/70",  label: "Not enough data" },
};

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function WelcomePage() {
  const [phase, setPhase] = useState<"loading" | "questions" | "xray">("loading");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [connected, setConnected] = useState({ meta: false, google: false });
  const [hasAccess, setHasAccess] = useState(false);
  const [xray, setXray] = useState<XRay | null>(null);
  const [xrayError, setXrayError] = useState("");
  const [scanStep, setScanStep] = useState(0);
  const [minScanDone, setMinScanDone] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [skipScan, setSkipScan] = useState(false);
  const [metaError, setMetaError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Start the X-Ray right away so it's usually ready by the time the questions are answered.
    fetch("/api/onboarding/xray")
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Could not read your store");
        setXray(d as XRay);
      })
      .catch(e => setXrayError(e instanceof Error ? e.message : "Could not read your store"));

    fetch("/api/billing/status").then(r => r.json()).then(d => setHasAccess(!!d.hasAccess)).catch(() => {});

    // Back from Meta connect (?connected=meta / ?meta_error=…) — skip the scan animation.
    const params = new URLSearchParams(window.location.search);
    const returned = params.get("connected") === "meta" || params.has("meta_error");
    if (params.has("meta_error")) setMetaError(params.get("meta_error") ?? "failed");
    if (returned) {
      setSkipScan(true);
      window.history.replaceState(null, "", "/welcome");
    }

    fetch("/api/onboarding").then(async r => {
      if (r.status === 401) { window.location.href = "/login"; return; }
      const d = await r.json();
      // Not an onboarding store (existing merchant) → straight to the dashboard.
      if (!d.onboarding) { window.location.href = "/dashboard"; return; }
      setConnected(d.connected ?? { meta: false, google: false });
      if (d.onboarding.answers) { setAnswers(d.onboarding.answers); setPhase("xray"); }
      else setPhase("questions");
    }).catch(() => setPhase("questions"));
  }, []);

  // Scanning animation: walk through the steps, at least ~3s so the result feels earned.
  useEffect(() => {
    if (phase !== "xray") return;
    if (skipScan) { setMinScanDone(true); return; }
    setScanStep(0);
    setMinScanDone(false);
    const t = setInterval(() => setScanStep(s => Math.min(s + 1, SCAN_STEPS.length)), 750);
    const done = setTimeout(() => setMinScanDone(true), SCAN_STEPS.length * 750 + 200);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [phase, skipScan]);

  const pick = async (key: keyof Answers, v: string) => {
    const next = { ...answers, [key]: v } as Answers;
    setAnswers(next);
    if (qIndex < QUESTIONS.length - 1) { setQIndex(qIndex + 1); return; }
    setPhase("xray");
    fetch("/api/onboarding", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: next }),
    }).catch(() => {});
  };

  const finish = async (to?: string) => {
    setFinishing(true);
    let next = hasAccess ? "/dashboard" : "/dashboard/pricing";
    try {
      const r = await fetch("/api/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: true }),
      });
      const d = await r.json();
      if (d.next) next = d.next;
    } catch { /* use default */ }
    window.location.href = to ?? next;
  };

  const showResults = phase === "xray" && minScanDone && (xray || xrayError);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-2.5 mb-8">
          <SkyLiteeLogo size={30} />
          <div className="text-[17px] font-black">Sky Litee</div>
        </div>

        {phase === "loading" && (
          <div className="flex justify-center py-24"><LoaderCircle className="animate-spin text-white/40" size={28} /></div>
        )}

        {phase === "questions" && (
          <QuestionStep index={qIndex} answers={answers} onPick={pick} onBack={() => setQIndex(Math.max(0, qIndex - 1))} />
        )}

        {phase === "xray" && !showResults && <Scanning step={scanStep} />}

        {showResults && (
          <div className="space-y-6">
            {metaError && (
              <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-[14px] text-[#EF4444]">
                {metaError === "view_only"
                  ? "Your role on this store can't connect ad accounts — ask the store owner."
                  : "Meta connection didn't finish. Try again from the Meta card below."}
              </div>
            )}
            {connected.meta && <RoasReveal />}
            {xray ? <XRayView x={xray} /> : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 text-[15px] text-white/60">
                We couldn&apos;t read your store orders right now ({xrayError}). Your dashboard will retry automatically.
              </div>
            )}
            <LockedCards answers={answers} connected={connected} disabled={finishing}
              // Meta comes back here for the ROAS reveal; Google lands on Connections to pick a site.
              onConnect={url => url.startsWith("/api/auth/meta") ? (window.location.href = url) : finish(url)} />
            <div className="rounded-2xl border border-[#F97316]/30 bg-[#F97316]/[0.06] p-6 text-center">
              <div className="text-[18px] font-bold mb-1">
                {hasAccess ? "Your full dashboard is ready" : "See everything — free for 14 days"}
              </div>
              <p className="text-[14px] text-white/55 mb-4">
                {goalLine(answers.goal)}
              </p>
              <button onClick={() => finish()} disabled={finishing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F97316] hover:bg-[#EA580C] rounded-xl text-[16px] font-bold shadow-[0_0_24px_rgba(249,115,22,0.35)] disabled:opacity-60 transition-all">
                {finishing ? <LoaderCircle size={16} className="animate-spin" /> : null}
                {hasAccess ? "Open my dashboard" : "Start 14-day free trial"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function goalLine(goal?: Goal) {
  if (goal === "ad_cost") return "Connect your ads to see which campaigns make money and which waste it.";
  if (goal === "profit") return "Add your ad spend and costs to see true profit per order, not just revenue.";
  return "Track sales, ads and customers in one place — and get told what to fix each week.";
}

// ── Step 1: questions ────────────────────────────────────────────────────────
function QuestionStep({ index, answers, onPick, onBack }: {
  index: number; answers: Answers; onPick: (k: keyof Answers, v: string) => void; onBack: () => void;
}) {
  const q = QUESTIONS[index];
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex gap-1.5 mb-6">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-[#F97316]" : "bg-white/[0.08]"}`} />
        ))}
      </div>
      <div className="text-[13px] text-white/40 mb-1">Question {index + 1} of {QUESTIONS.length} · helps us show what matters to you</div>
      <h1 className="text-[24px] font-bold mb-6">{q.title}</h1>
      <div className="space-y-3">
        {q.options.map(o => {
          const Icon = o.icon;
          const selected = answers[q.key] === o.v;
          return (
            <button key={o.v} onClick={() => onPick(q.key, o.v)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left text-[16px] font-semibold transition-all ${
                selected ? "border-[#F97316] bg-[#F97316]/10" : "border-white/[0.08] bg-[#111111] hover:border-white/20"}`}>
              <Icon size={18} className={selected ? "text-[#F97316]" : "text-white/50"} />
              {o.label}
              {selected && <Check size={16} className="ml-auto text-[#F97316]" />}
            </button>
          );
        })}
      </div>
      {index > 0 && (
        <button onClick={onBack} className="mt-5 text-[14px] text-white/40 hover:text-white/70">← Back</button>
      )}
    </div>
  );
}

// ── Step 2: X-Ray ────────────────────────────────────────────────────────────
function Scanning({ step }: { step: number }) {
  return (
    <div className="max-w-md mx-auto py-10">
      <div className="flex justify-center mb-6">
        <div className="relative w-20 h-20 rounded-full border-2 border-[#F97316]/30 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-t-[#F97316] border-transparent animate-spin" />
          <Sparkles className="text-[#F97316]" size={26} />
        </div>
      </div>
      <h1 className="text-[22px] font-bold text-center mb-6">Running your Store X-Ray…</h1>
      <div className="space-y-3">
        {SCAN_STEPS.map((s, i) => (
          <div key={s} className={`flex items-center gap-3 text-[15px] transition-opacity ${i <= step ? "opacity-100" : "opacity-30"}`}>
            {i < step ? <CircleCheck size={17} className="text-[#22C55E]" />
              : i === step ? <LoaderCircle size={17} className="animate-spin text-[#F97316]" />
              : <div className="w-[17px] h-[17px] rounded-full border border-white/20" />}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function XRayView({ x }: { x: XRay }) {
  const money = (n: number) => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: x.currency, maximumFractionDigits: 0 }).format(n); }
    catch { return `${x.currency} ${Math.round(n).toLocaleString("en-IN")}`; }
  };

  if (x.orders === 0) {
    return (
      <div>
        <Header x={x} />
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 text-[15px] text-white/60">
          No orders in the last {x.days} days yet. As soon as orders come in, Skylitee will show your best weeks,
          repeat customers and money leaks here — connect your ads below so tracking starts from day one.
        </div>
      </div>
    );
  }

  const maxWeek = Math.max(...x.weekly.map(w => w.revenue), 1);
  const insights: { key: string; flag: Flag; icon: typeof Repeat; title: string; value: string; why: string }[] = [
    {
      key: "growth", flag: x.flags.growth, icon: x.growthPct !== null && x.growthPct < 0 ? TrendingDown : TrendingUp,
      title: "Last 30 days vs the 30 before",
      value: x.growthPct === null ? money(x.last30.revenue) : `${x.growthPct >= 0 ? "+" : ""}${x.growthPct}%`,
      why: x.growthPct === null ? "Not enough history to compare yet."
        : x.growthPct >= 0 ? `${money(x.last30.revenue)} vs ${money(x.prev30.revenue)} — sales are growing.`
        : `${money(x.last30.revenue)} vs ${money(x.prev30.revenue)}. Connect your ads to see which campaign slowed down.`,
    },
    {
      key: "repeat", flag: x.flags.repeat, icon: Repeat, title: "Repeat customers",
      value: x.repeatPct === null ? "—" : `${x.repeatPct}%`,
      why: x.repeatPct === null ? "No customer data on these orders."
        : x.repeatPct >= 25 ? `Healthy — D2C benchmark is 25%+. Returning buyers cost nothing to acquire.`
        : `Below the 25% D2C benchmark. A post-purchase WhatsApp/email offer usually lifts this fastest.`,
    },
    {
      key: "cod", flag: x.flags.cod, icon: Truck, title: "Cash-on-delivery orders",
      value: x.codPct === null ? "—" : `${x.codPct}%`,
      why: x.codPct === null ? "" : x.codPct > 50
        ? "Over half your orders are COD — higher return-to-origin risk and slower cash. Try a small prepaid discount."
        : "Most buyers pay upfront — good for cash flow and fewer returns.",
    },
    {
      key: "leak", flag: x.flags.leak, icon: TriangleAlert, title: "Refunds & cancellations",
      value: money(x.leak.total),
      why: x.leak.pct > 5
        ? `${x.leak.pct}% of booked sales lost (${x.leak.cancelledOrders} cancelled orders + refunds). Above 5% is worth fixing.`
        : `Only ${x.leak.pct}% of booked sales lost — within a healthy range (under 5%).`,
    },
    {
      key: "discounts", flag: x.flags.discounts, icon: Percent, title: "Discounts given",
      value: money(x.discounts.total),
      why: x.discounts.pctOfRevenue > 15
        ? `${x.discounts.pctOfRevenue}% of sales given away as discounts — check which codes actually bring new buyers.`
        : `${x.discounts.pctOfRevenue}% of sales — discounts are under control.`,
    },
  ];

  return (
    <div className="space-y-5">
      <Header x={x} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Sales", value: money(x.revenue) },
          { label: "Orders", value: x.orders.toLocaleString("en-IN") },
          { label: "Avg order value", value: money(x.aov) },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/[0.08] bg-[#111111] p-4">
            <div className="text-[13px] text-white/45">{k.label}</div>
            <div className="text-[24px] font-black mt-0.5">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="text-[15px] font-bold">Weekly sales</div>
          <div className="flex gap-3 text-[13px]">
            {x.bestWeek && <span className="text-[#22C55E]">Best: {fmtDay(x.bestWeek.start)} · {money(x.bestWeek.revenue)}</span>}
            {x.worstWeek && <span className="text-[#EF4444]">Weakest: {fmtDay(x.worstWeek.start)} · {money(x.worstWeek.revenue)}</span>}
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {x.weekly.map(w => {
            const color = w.start === x.bestWeek?.start ? "bg-[#22C55E]" : w.start === x.worstWeek?.start ? "bg-[#EF4444]" : "bg-[#F97316]/60";
            return (
              <div key={w.start} className="flex-1 h-full flex items-end" title={`Week of ${fmtDay(w.start)}: ${money(w.revenue)} · ${w.orders} orders`}>
                <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.max(2, (w.revenue / maxWeek) * 100)}%` }} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {x.topProduct && (
          <div className="rounded-2xl border border-[#22C55E]/30 bg-[#111111] p-4">
            <div className="flex items-center gap-2 text-[13px] text-white/45"><Trophy size={14} className="text-[#22C55E]" /> Top product</div>
            <div className="text-[16px] font-bold mt-1 line-clamp-2">{x.topProduct.title}</div>
            <div className="text-[14px] text-white/55 mt-1">{money(x.topProduct.revenue)} · {x.topProduct.units} sold · {x.topProduct.sharePct}% of product sales</div>
          </div>
        )}
        {x.slowingProduct ? (
          <div className="rounded-2xl border border-[#EF4444]/30 bg-[#111111] p-4">
            <div className="flex items-center gap-2 text-[13px] text-white/45"><TrendingDown size={14} className="text-[#EF4444]" /> Slowing down</div>
            <div className="text-[16px] font-bold mt-1 line-clamp-2">{x.slowingProduct.title}</div>
            <div className="text-[14px] text-white/55 mt-1">
              {x.slowingProduct.last30Units} sold in the last 30 days vs {x.slowingProduct.prev30Units} before (−{x.slowingProduct.dropPct}%)
            </div>
          </div>
        ) : x.topProduct && (
          <div className="rounded-2xl border border-[#22C55E]/30 bg-[#111111] p-4">
            <div className="flex items-center gap-2 text-[13px] text-white/45"><Check size={14} className="text-[#22C55E]" /> Product trend</div>
            <div className="text-[15px] font-semibold mt-1">No product dropped sharply in the last 30 days.</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map(i => {
          const s = FLAG_STYLE[i.flag];
          const Icon = i.icon;
          return (
            <div key={i.key} className={`rounded-2xl border ${s.border} bg-[#111111] p-4`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[13px] text-white/45"><Icon size={14} className={s.text} /> {i.title}</div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
              </div>
              <div className={`text-[22px] font-black mt-1 ${s.text}`}>{i.value}</div>
              {i.why && <div className="text-[14px] text-white/55 mt-1">{i.why}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Header({ x }: { x: XRay }) {
  return (
    <div className="mb-4">
      <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#F97316] mb-2">
        <Sparkles size={13} /> Store X-Ray
      </div>
      <h1 className="text-[24px] sm:text-[28px] font-bold">{x.shopName} — last {x.days} days</h1>
      <p className="text-[14px] text-white/45">From your Shopify orders only. Refunds, test and cancelled orders are handled like Shopify does.</p>
    </div>
  );
}

// ── Step 4: real-ROAS reveal (after Meta connects) ───────────────────────────
interface RoasData {
  period: { from: string; to: string };
  adAccountName: string;
  metaCurrency: string;
  shopCurrency: string | null;
  currencyMismatch: boolean;
  spend: number;
  metaPurchaseValue: number;
  metaPurchases: number;
  leads: number;
  shopRevenue: number;
  shopOrders: number;
  metaRoas: number | null;
  realRoas: number | null;
  metaClaimPct: number | null;
}

function RoasReveal() {
  const [data, setData] = useState<RoasData | null>(null);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/onboarding/roas");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error === "no_ad_account" ? "No ad account found on this Meta login." : "Couldn't read your Meta ads right now.");
      setData(d as RoasData);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch("/api/meta/accounts").then(r => r.json()).then(d => {
      setAccounts(d.accounts ?? []);
      setAccountId(d.selectedAccountId ?? "");
    }).catch(() => {});
  }, []);

  const switchAccount = async (id: string) => {
    setAccountId(id);
    await fetch("/api/meta/accounts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adAccount: id }),
    }).catch(() => {});
    load();
  };

  const money = (n: number, cur: string | null) => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur ?? "INR", maximumFractionDigits: 0 }).format(n); }
    catch { return `${cur ?? ""} ${Math.round(n).toLocaleString("en-IN")}`; }
  };

  const picker = accounts.length > 1 && (
    <select value={accountId} onChange={e => switchAccount(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-[13px] text-white max-w-full">
      {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#111111]">{a.name}</option>)}
    </select>
  );

  let body: React.ReactNode;
  if (loading) {
    body = <div className="flex items-center gap-2 text-[15px] text-white/50 py-6"><LoaderCircle size={16} className="animate-spin" /> Comparing Meta with your real Shopify sales…</div>;
  } else if (error || !data) {
    body = <div className="text-[15px] text-white/60 py-4">{error || "Couldn't load."}</div>;
  } else if (data.spend === 0) {
    body = <div className="text-[15px] text-white/60 py-4">No Meta ad spend in <b className="text-white">{data.adAccountName}</b> in the last 30 days.{accounts.length > 1 ? " Pick another ad account above." : ""}</div>;
  } else {
    const realGood = (data.realRoas ?? 0) >= 3;
    const claim = data.metaClaimPct;
    const overClaim = claim !== null && claim > 100;
    const leadAds = data.metaPurchaseValue === 0 && data.leads > 0;
    body = (
      <div className="space-y-4">
        {data.currencyMismatch && (
          <div className="text-[13px] text-white/50">Note: your ad account is in {data.metaCurrency} and your store in {data.shopCurrency}, so the two numbers aren&apos;t directly comparable.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="text-[13px] text-white/45">What Meta says</div>
            <div className="text-[32px] font-black">{leadAds ? "—" : `${data.metaRoas?.toFixed(2)}×`}</div>
            <div className="text-[13px] text-white/50">
              {leadAds ? `${data.leads} leads · ${money(data.spend / data.leads, data.metaCurrency)} per lead`
                : `${money(data.metaPurchaseValue, data.metaCurrency)} sales from ${data.metaPurchases} purchases`}
            </div>
          </div>
          <div className={`rounded-xl border p-4 ${realGood ? "border-[#22C55E]/40 bg-[#22C55E]/[0.06]" : "border-[#EF4444]/40 bg-[#EF4444]/[0.06]"}`}>
            <div className="text-[13px] text-white/45">Your real ROAS (Shopify sales ÷ Meta spend)</div>
            <div className={`text-[32px] font-black ${realGood ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{data.realRoas?.toFixed(2)}×</div>
            <div className="text-[13px] text-white/50">{money(data.shopRevenue, data.shopCurrency)} real sales · {data.shopOrders} orders · {money(data.spend, data.metaCurrency)} spent</div>
          </div>
        </div>
        <div className="space-y-2 text-[14px]">
          <div className={realGood ? "text-[#22C55E]" : "text-[#EF4444]"}>
            {realGood
              ? `Healthy — every 1 spent on Meta comes back as ${data.realRoas?.toFixed(1)} in store sales (D2C benchmark: 3× or more).`
              : `Below the 3× D2C benchmark — every 1 spent on Meta brings back ${data.realRoas?.toFixed(1)} in store sales. The dashboard shows which campaigns to cut.`}
          </div>
          {!leadAds && claim !== null && (
            <div className={overClaim || claim > 80 ? "text-[#EF4444]" : "text-[#22C55E]"}>
              {overClaim
                ? `Meta claims ${money(data.metaPurchaseValue, data.metaCurrency)} in sales — more than your whole store made. Meta is over-counting, so don't scale on its ROAS alone.`
                : claim > 80
                  ? `Meta takes credit for ${claim}% of all your sales — likely counting repeat and organic buyers too. Real ROAS is the safer number.`
                  : `Meta takes credit for ${claim}% of your sales — its numbers look believable.`}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F97316]/40 bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#F97316] mb-1">
            <CircleCheck size={13} /> Meta connected
          </div>
          <div className="text-[18px] font-bold">Your real ROAS — last 30 days</div>
        </div>
        {picker}
      </div>
      {body}
    </div>
  );
}

// ── Step 3: locked cards ─────────────────────────────────────────────────────
function LockedCards({ answers, connected, onConnect, disabled }: {
  answers: Answers; connected: { meta: boolean; google: boolean }; onConnect: (url: string) => void; disabled: boolean;
}) {
  const cards = [
    {
      key: "meta" as const, icon: Megaphone, title: "Your real ROAS",
      text: "Meta says one number, Shopify says another. See which ads actually bring paying orders.",
      cta: "Connect Meta Ads", url: "/api/auth/meta?return=welcome",
    },
    {
      key: "google" as const, icon: Search, title: "Keywords that bring buyers",
      text: "See which Google searches find your store — and which ones turn into sales. Free traffic you can grow.",
      cta: "Connect Google", url: "/api/auth/google?service=gsc",
    },
  ];
  // Recommend the channel they said they use; SEO for stores not running ads yet.
  const first = answers.ads === "google" || answers.ads === "none" ? "google" : "meta";
  const ordered = [...cards].sort((a, b) => (a.key === first ? -1 : b.key === first ? 1 : 0));

  return (
    <div>
      <div className="text-[17px] font-bold mb-1">Unlock the rest of your picture</div>
      <p className="text-[14px] text-white/45 mb-3">Connect in one click — read-only, we never change your ads or store.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ordered.map(c => {
          const Icon = c.icon;
          const isConnected = connected[c.key];
          return (
            <div key={c.key} className={`relative rounded-2xl border bg-[#111111] p-5 overflow-hidden ${c.key === first && !isConnected ? "border-[#F97316]/50" : "border-white/[0.08]"}`}>
              {c.key === first && !isConnected && (
                <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F97316] text-white">Recommended</span>
              )}
              <div className="flex items-center gap-2 text-[15px] font-bold mb-3"><Icon size={16} className="text-[#F97316]" /> {c.title}</div>
              {/* Blurred placeholder — shape only, no numbers. */}
              <div className="relative mb-3">
                <div className="space-y-2 blur-[3px] select-none" aria-hidden>
                  {[80, 55, 68].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2.5 rounded bg-white/10" style={{ width: `${w}%` }} />
                      <div className="h-2.5 w-8 rounded bg-white/10" />
                    </div>
                  ))}
                </div>
                {!isConnected && <Lock size={18} className="absolute inset-0 m-auto text-white/60" />}
              </div>
              <p className="text-[14px] text-white/55 mb-4">{c.text}</p>
              {isConnected ? (
                <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#22C55E]"><CircleCheck size={15} /> Connected</div>
              ) : (
                <button onClick={() => onConnect(c.url)} disabled={disabled}
                  className={`w-full py-2.5 rounded-xl text-[15px] font-bold transition-all disabled:opacity-60 ${
                    c.key === first ? "bg-[#F97316] hover:bg-[#EA580C]" : "bg-white/[0.06] hover:bg-white/[0.1]"}`}>
                  {c.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
