"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { PLANS } from "@/lib/billing";

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS[0];
  const errorParam = searchParams.get("error");
  const subscribed = searchParams.get("subscribed");

  useEffect(() => {
    fetch("/api/billing/status")
      .then(r => r.json())
      .then(d => setCurrentPlan(d.plan ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (errorParam === "declined") setError("Subscription was declined. You can try again anytime.");
    if (errorParam === "failed") setError("Something went wrong. Please try again.");
  }, [errorParam]);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json() as { confirmationUrl?: string; error?: string };
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        setError("Could not create subscription. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const isActive = currentPlan === plan.id;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C] text-[12px] font-bold px-3 py-1 rounded-full mb-3">
          <Zap size={11} />
          14-day free trial — no credit card needed
        </div>
        <h1 className="text-[32px] font-black text-[#18181B] dark:text-[#F4F4F5]">
          Everything you need to grow
        </h1>
        <p className="text-[14px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
          One plan. All features. Cancel anytime.
        </p>
      </div>

      {/* Success banner */}
      {subscribed && (
        <div className="w-full max-w-md mb-6 bg-[#F0FDF4] dark:bg-[#0A1F0E] border border-[#22C55E]/30 rounded-2xl px-4 py-3 text-[13px] text-[#15803D] dark:text-[#4ADE80] font-semibold flex items-center gap-2">
          <Check size={14} />
          Trial started! Welcome to Skylitee Pro.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="w-full max-w-md mb-6 bg-[#FEF2F2] dark:bg-[#2D0A0A] border border-[#EF4444]/30 rounded-2xl px-4 py-3 text-[13px] text-[#991B1B] dark:text-[#FCA5A5] font-semibold">
          {error}
        </div>
      )}

      {/* Single plan card */}
      <div className="w-full max-w-md bg-white dark:bg-[#171717] rounded-2xl border border-[#F97316] shadow-[0_0_0_1px_#F97316,0_8px_32px_rgba(249,115,22,0.12)] p-8">

        {/* Plan name + price */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">{plan.name}</div>
            <div className="text-[12px] text-[#22C55E] font-semibold mt-0.5">14-day free trial included</div>
          </div>
          <div className="text-right">
            <div className="text-[32px] font-black text-[#18181B] dark:text-[#F4F4F5] leading-none">${plan.price}</div>
            <div className="text-[12px] text-[#A1A1AA]">/month after trial</div>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#52525B] dark:text-[#A1A1AA]">
              <Check size={13} className="text-[#22C55E] shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isActive ? (
          <div className="w-full py-3 rounded-xl text-[13px] font-bold text-center bg-[#F5F5F4] dark:bg-[#262626] text-[#A1A1AA]">
            ✓ Plan Active
          </div>
        ) : (
          <button
            onClick={subscribe}
            disabled={loading}
            className="w-full py-3 rounded-xl text-[13px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition-all shadow-sm disabled:opacity-60"
          >
            {loading ? "Redirecting to Shopify…" : "Start 14-day free trial"}
          </button>
        )}
      </div>

      <p className="text-center text-[12px] text-[#A1A1AA] mt-6">
        Billing is handled securely by Shopify. Cancel anytime from your Shopify admin.
      </p>
    </div>
  );
}
