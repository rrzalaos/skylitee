"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";
import { cn } from "@/lib/utils";
import { UNINSTALL_REASONS } from "@/lib/uninstall-reasons";

function FeedbackForm() {
  const params = useSearchParams();
  const shop = params.get("shop") ?? "";
  const sig = params.get("sig") ?? "";
  const initial = UNINSTALL_REASONS.some(r => r.key === params.get("r")) ? params.get("r")! : "";

  const [reason, setReason] = useState(initial);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // The email link only pre-selects a reason; the merchant confirms with Submit (email link
  // scanners open URLs automatically, so we never record on page load).
  const submit = async () => {
    if (!reason) { setError("Pick a reason"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/feedback/uninstall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, sig, reason, note }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    setDone(true);
  };

  if (!shop || !sig) {
    return <p className="text-[14px] text-[#EF4444] text-center py-4">Invalid feedback link.</p>;
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-[22px]">✓</span>
        </div>
        <h1 className="text-[20px] font-bold text-white mb-2">Thank you!</h1>
        <p className="text-[14px] text-white/50">Your answer goes straight to the team building Skylitee.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[20px] font-bold text-white mb-1">Why did you remove Skylitee?</h1>
      <p className="text-[14px] text-white/50 mb-5">{shop.replace(".myshopify.com", "")} · takes 5 seconds</p>

      <div className="space-y-2">
        {UNINSTALL_REASONS.map(r => (
          <button key={r.key} type="button" onClick={() => setReason(r.key)}
            className={cn(
              "w-full text-left px-3.5 py-2.5 rounded-xl border text-[14px] transition-colors",
              reason === r.key
                ? "border-[#F97316] bg-[#F97316]/10 text-white"
                : "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20"
            )}>
            {r.label}
          </button>
        ))}
      </div>

      <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={3}
        placeholder="Anything else? (optional)"
        className="w-full mt-4 px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-[#F97316] placeholder:text-white/20 resize-none" />

      {error && (
        <div className="mt-3 text-[13px] text-[#EF4444] bg-[#EF4444]/10 px-3 py-2.5 rounded-xl border border-[#EF4444]/20">{error}</div>
      )}

      <button onClick={submit} disabled={loading}
        className="w-full mt-4 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-[15px] font-bold transition-all disabled:opacity-50">
        {loading ? "Sending..." : "Send feedback →"}
      </button>
    </>
  );
}

export default function UninstallFeedbackPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <SkyLiteeLogo size={36} />
          <div>
            <div className="text-[18px] font-black text-white">Sky Litee</div>
            <div className="text-[12px] text-white/50">Unified Analytics Platform</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-7 shadow-xl">
          <Suspense fallback={<div className="text-white/50 text-sm">Loading...</div>}>
            <FeedbackForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
