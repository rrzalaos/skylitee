"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, Rocket, Gift } from "lucide-react";
import { PLANS, Plan, PlanId } from "@/lib/billing";
import { cn } from "@/lib/utils";

const planIcons: Record<PlanId, React.ElementType> = {
  free: Gift,
  growth: Zap,
  scale: Rocket,
};

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const subscribed = searchParams.get("subscribed");

  useEffect(() => {
    fetch("/api/billing/status")
      .then(r => r.json())
      .then(d => setCurrentPlan(d.plan ?? "free"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (errorParam === "declined") setError("Subscription was declined. You can try again anytime.");
    if (errorParam === "failed") setError("Something went wrong. Please try again.");
  }, [errorParam]);

  async function subscribe(plan: Plan) {
    if (plan.id === "free") return;
    setLoading(plan.id);
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
        setLoading(null);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-2">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C] text-[12px] font-bold px-3 py-1 rounded-full mb-3">
          <Zap size={11} />
          Simple, transparent pricing
        </div>
        <h1 className="text-[28px] font-black text-[#18181B] dark:text-[#F4F4F5]">
          Choose your plan
        </h1>
        <p className="text-[14px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
          All paid plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>

      {/* Success banner */}
      {subscribed && (
        <div className="mb-6 bg-[#F0FDF4] dark:bg-[#0A1F0E] border border-[#22C55E]/30 rounded-2xl px-4 py-3 text-[13px] text-[#15803D] dark:text-[#4ADE80] font-semibold flex items-center gap-2">
          <Check size={14} />
          Subscription activated! Welcome to Skylitee {currentPlan}.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-[#FEF2F2] dark:bg-[#2D0A0A] border border-[#EF4444]/30 rounded-2xl px-4 py-3 text-[13px] text-[#991B1B] dark:text-[#FCA5A5] font-semibold">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const Icon = planIcons[plan.id];
          const isActive = currentPlan === plan.id;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col bg-white dark:bg-[#171717] transition-all",
                plan.highlight
                  ? "border-[#F97316] shadow-[0_0_0_1px_#F97316,0_8px_32px_rgba(249,115,22,0.12)]"
                  : "border-black/[0.06] dark:border-white/[0.06] shadow-sm",
                isActive && "ring-2 ring-[#22C55E]"
              )}
            >
              {/* Most popular badge */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-[11px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}

              {/* Current plan badge */}
              {isActive && (
                <div className="absolute -top-3 right-4 bg-[#22C55E] text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                  Current Plan
                </div>
              )}

              {/* Icon + name */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                plan.highlight ? "bg-[#FFF7ED] dark:bg-[#2A1A0E]" : "bg-[#F5F5F4] dark:bg-[#262626]"
              )}>
                <Icon size={18} className={plan.highlight ? "text-[#F97316]" : "text-[#71717A]"} />
              </div>

              <div className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">
                {plan.name}
              </div>

              {/* Price */}
              <div className="flex items-end gap-1 mb-1">
                <span className="text-[32px] font-black text-[#18181B] dark:text-[#F4F4F5]">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-[13px] text-[#A1A1AA] mb-1.5">/month</span>
                )}
              </div>

              {plan.trialDays > 0 && (
                <div className="text-[12px] text-[#22C55E] font-semibold mb-4">
                  {plan.trialDays}-day free trial
                </div>
              )}
              {plan.price === 0 && (
                <div className="text-[12px] text-[#A1A1AA] mb-4">No credit card required</div>
              )}

              {/* Features */}
              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-[#52525B] dark:text-[#A1A1AA]">
                    <Check size={13} className="text-[#22C55E] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.id === "free" ? (
                <div className={cn(
                  "w-full py-2.5 rounded-xl text-[13px] font-bold text-center",
                  isActive
                    ? "bg-[#F5F5F4] dark:bg-[#262626] text-[#A1A1AA]"
                    : "bg-[#F5F5F4] dark:bg-[#262626] text-[#71717A]"
                )}>
                  {isActive ? "Current plan" : "Get started free"}
                </div>
              ) : (
                <button
                  onClick={() => subscribe(plan)}
                  disabled={isActive || isLoading}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-[13px] font-bold transition-all",
                    isActive
                      ? "bg-[#F5F5F4] dark:bg-[#262626] text-[#A1A1AA] cursor-default"
                      : plan.highlight
                        ? "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-sm"
                        : "bg-[#18181B] dark:bg-[#F4F4F5] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-white dark:text-[#18181B]"
                  )}
                >
                  {isLoading ? "Redirecting…" : isActive ? "Current plan" : `Start ${plan.trialDays}-day trial`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ note */}
      <p className="text-center text-[12px] text-[#A1A1AA] mt-8">
        Billing is handled securely by Shopify. You can cancel or change your plan anytime from this page.
      </p>
    </div>
  );
}
