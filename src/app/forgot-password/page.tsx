"use client";
import { useState } from "react";
import Link from "next/link";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
    }
    setLoading(false);
  };

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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[22px]">✓</span>
              </div>
              <h1 className="text-[20px] font-bold text-white mb-2">Check your email</h1>
              <p className="text-[14px] text-white/50 mb-6">
                We sent a reset link to <span className="text-white/80">{email}</span>. It expires in 1 hour.
              </p>
              <Link href="/login" className="text-[14px] text-[#F97316] font-semibold hover:text-[#EA580C] transition-colors">
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-[20px] font-bold text-white mb-1">Forgot password?</h1>
              <p className="text-[14px] text-white/50 mb-6">Enter your email and we&apos;ll send a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-white/60 mb-1.5 block uppercase tracking-[0.08em]">Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[15px] text-white focus:outline-none focus:border-[#F97316] placeholder:text-white/20 transition-colors"
                    required
                  />
                </div>

                {error && (
                  <div className="text-[13px] text-[#EF4444] bg-[#EF4444]/10 px-3 py-2.5 rounded-xl border border-[#EF4444]/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-[15px] font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link →"}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
                <Link href="/login" className="text-[14px] text-white/40 hover:text-white/60 transition-colors">← Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
