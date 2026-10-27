"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2, Megaphone, Clock, Sparkles, Lock, ExternalLink, Eye, DollarSign, Globe, Scale, AlertCircle } from "lucide-react";
import { COUNTRIES } from "@/lib/competitor-shared";
import type { XrayResult } from "@/app/api/public/competitor-xray/route";

// A cold lookup scrapes Meta's Ad Library (1-2 min) - rotate plain-English steps so the wait reads as work.
const STEPS = [
  "Finding their page in Meta's Ad Library...",
  "Reading every live ad they're running...",
  "Checking how long each ad has run...",
  "AI is reading their ad copy for offers and hooks...",
  "Almost there - putting your X-Ray together...",
];

const FORMAT_LABEL: Record<string, string> = { video: "Video", image: "Image", carousel: "Carousel", text: "Text" };

const LOCKED = [
  { icon: Eye, title: "Their Google ads", desc: "Live Search, Shopping and YouTube ads." },
  { icon: DollarSign, title: "Estimated ad spend", desc: "Monthly spend and ROAS as honest ranges." },
  { icon: Globe, title: "Their Google traffic", desc: "Free vs paid visits and the keywords they rank for." },
  { icon: Scale, title: "You vs them", desc: "Your real numbers next to theirs - green or red, with the fix." },
];

export default function XrayTool() {
  const [pageUrl, setPageUrl] = useState("");
  const [country, setCountry] = useState("IN");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<XrayResult | null>(null);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!pageUrl.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/public/competitor-xray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl, country }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.status !== "ok") setError(data?.message ?? "Something went wrong. Please try again.");
      else setResult(data as XrayResult);
    } catch {
      setError("Couldn't reach Skylitee. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const brand = result?.pageName ?? "This brand";

  return (
    <div>
      <form onSubmit={run} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5">
        <label className="block text-[14px] font-semibold text-[#A1A1AA] mb-2">Competitor&apos;s Facebook page</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={pageUrl}
            onChange={e => setPageUrl(e.target.value)}
            placeholder="facebook.com/brandname"
            className="flex-1 min-w-0 bg-[#18181B] border border-white/10 rounded-xl px-4 py-3.5 text-[16px] text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#F97316]/60"
          />
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            aria-label="Country"
            className="bg-[#18181B] border border-white/10 rounded-xl px-3 py-3.5 text-[15px] text-white focus:outline-none focus:border-[#F97316]/60"
          >
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <button
            type="submit"
            disabled={loading || !pageUrl.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_24px_rgba(249,115,22,0.35)]"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
            {loading ? "Scanning" : "X-Ray them"}
          </button>
        </div>
        <p className="text-[13px] text-[#52525B] mt-2.5">Uses public data from Meta&apos;s Ad Library. Free, no login, no card.</p>
      </form>

      {loading && (
        <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] p-6 text-center">
          <Loader2 size={26} className="animate-spin text-[#F97316] mx-auto mb-3" />
          <div className="text-[16px] font-semibold">{STEPS[Math.min(STEPS.length - 1, Math.floor(elapsed / 15))]}</div>
          <div className="text-[14px] text-[#71717A] mt-1">
            A brand we haven&apos;t scanned before takes 1-2 minutes. Keep this tab open. ({elapsed}s)
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 flex gap-3 items-start">
          <AlertCircle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
          <div className="text-[15px] text-[#FCA5A5]">{error}</div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[22px] sm:text-[26px] font-black">{brand}&apos;s X-Ray</h2>
            <div className="text-[13px] text-[#71717A]">
              Live ads in {result.country} · checked {new Date(result.fetchedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </div>
          </div>

          {result.activity.active === 0 ? (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 text-[16px] text-[#A1A1AA]">
              {brand} has no live Facebook or Instagram ads in {result.country} right now. Try another country, or check the link is their main brand page.
            </div>
          ) : (
            <>
              {/* Finding 1 - activity */}
              <Finding n={1} icon={Megaphone} title="How hard they're advertising">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Stat value={`${result.activity.active}${result.activity.capped ? "+" : ""}`} label="live ads" />
                  <Stat value={String(result.activity.launched30d)} label="launched in 30 days" />
                  <Stat value={String(result.activity.proven)} label="running 30+ days" good />
                </div>
                <p className="text-[15px] text-[#A1A1AA] leading-relaxed">
                  {result.activity.proven > 0
                    ? `${result.activity.proven} of their ads have run for over a month. Brands don't keep paying for ads that lose money - these are the ones working for them.`
                    : "None of their ads have run past 30 days yet - they're still testing and haven't found a clear winner."}
                  {" "}Formats: {Object.entries(result.activity.formats).filter(([, n]) => n > 0).map(([f, n]) => `${n} ${FORMAT_LABEL[f] ?? f}`).join(" · ")}.
                </p>
              </Finding>

              {/* Finding 2 - longest-running ad */}
              {result.longest && (
                <Finding n={2} icon={Clock} title={`Their proven winner: running ${result.longest.days} days`}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {result.longest.imageUrl && (
                      // fbcdn URLs expire - hide the image instead of showing a broken one
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={result.longest.imageUrl} alt="" referrerPolicy="no-referrer"
                        onError={e => { e.currentTarget.style.display = "none"; }}
                        className="w-full sm:w-36 h-36 object-cover rounded-xl border border-white/10 shrink-0" />
                    )}
                    <div className="min-w-0">
                      {result.longest.snippet && (
                        <p className="text-[15px] text-[#D4D4D8] leading-relaxed italic mb-3">&ldquo;{result.longest.snippet}{result.longest.snippet.length >= 240 ? "..." : ""}&rdquo;</p>
                      )}
                      <div className="text-[13px] text-[#71717A] mb-3">
                        {FORMAT_LABEL[result.longest.format] ?? result.longest.format} ad
                        {result.longest.platforms.length > 0 && ` · ${result.longest.platforms.join(", ")}`}
                      </div>
                      <a href={result.longest.libraryUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#F97316] hover:text-[#FB923C]">
                        See the full ad in Meta&apos;s Ad Library <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </Finding>
              )}

              {/* Finding 3 - what their ads say */}
              {result.message && (
                <Finding n={3} icon={Sparkles} title="What their ads are saying">
                  {result.message.summary && <p className="text-[15px] text-[#D4D4D8] leading-relaxed mb-3">{result.message.summary}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.message.offer && <Chip label="Top offer" text={result.message.offer} />}
                    {result.message.hook && <Chip label="Top hook" text={result.message.hook} />}
                  </div>
                  {(result.locked.moreOffers + result.locked.moreHooks + result.locked.angles) > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-[14px] text-[#71717A]">
                      <Lock size={13} />
                      {[
                        result.locked.moreOffers > 0 && `${result.locked.moreOffers} more offers`,
                        result.locked.moreHooks > 0 && `${result.locked.moreHooks} more hooks`,
                        result.locked.angles > 0 && `${result.locked.angles} selling angles`,
                      ].filter(Boolean).join(" · ")} in the full report
                    </div>
                  )}
                </Finding>
              )}
            </>
          )}

          {/* Locked teasers */}
          <div className="rounded-2xl border border-[#F97316]/25 bg-gradient-to-b from-[#F97316]/[0.07] to-transparent p-5 sm:p-6">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#F97316] mb-3">Unlock the full picture</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {LOCKED.map(l => (
                <div key={l.title} className="flex gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-3.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.05]">
                    <l.icon size={16} className="text-[#A1A1AA]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold flex items-center gap-1.5">{l.title} <Lock size={12} className="text-[#71717A]" /></div>
                    <div className="text-[13px] text-[#71717A] leading-relaxed">{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[15px] text-[#A1A1AA] max-w-md">
                Track {brand === "This brand" ? "this brand" : brand} and 4 more competitors every week - next to your own Shopify, Meta and Google numbers.
              </p>
              <Link href="/install"
                className="inline-flex justify-center px-7 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl text-[16px] transition-all shadow-[0_0_24px_rgba(249,115,22,0.4)] shrink-0">
                Install free - 14 days →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Finding({ n, icon: Icon, title, children }: { n: number; icon: typeof Megaphone; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#22C55E]/10 border border-[#22C55E]/20">
          <Icon size={16} className="text-[#22C55E]" />
        </div>
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#22C55E]">Free finding {n}</div>
          <div className="text-[17px] font-bold">{title}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({ value, label, good }: { value: string; label: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
      <div className={`text-[24px] sm:text-[28px] font-black ${good ? "text-[#22C55E]" : "text-white"}`}>{value}</div>
      <div className="text-[13px] text-[#71717A] leading-tight">{label}</div>
    </div>
  );
}

function Chip({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#F97316] mb-1">{label}</div>
      <div className="text-[15px] text-[#E4E4E7]">{text}</div>
    </div>
  );
}
