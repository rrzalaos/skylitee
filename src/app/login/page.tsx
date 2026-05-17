"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Demo credentials
    if (email === "demo@fabonique.com" && password === "Skylitee") {
      await new Promise(r => setTimeout(r, 800));
      router.push("/dashboard");
    } else {
      await new Promise(r => setTimeout(r, 600));
      setError("Invalid credentials. Use demo@fabonique.com / Skylitee");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f0ed] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-[#17a773] rounded-xl flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <div className="text-base font-semibold text-[#181816]">Skylitee</div>
            <div className="text-[10px] text-[#9e9e9a]">Unified Analytics Platform</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-black/[0.09] rounded-2xl p-7 shadow-sm">
          <h1 className="text-lg font-semibold text-[#181816] mb-1">Welcome back</h1>
          <p className="text-[11px] text-[#686864] mb-6">Sign in to your analytics dashboard</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-[#686864] mb-1 block">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="demo@fabonique.com"
                className="w-full px-3 py-2.5 bg-[#f7f7f5] border border-black/[0.09] rounded-lg text-[12px] text-[#181816] focus:outline-none focus:border-[#17a773] placeholder:text-[#9e9e9a]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#686864] mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Skylitee"
                  className="w-full px-3 py-2.5 bg-[#f7f7f5] border border-black/[0.09] rounded-lg text-[12px] text-[#181816] focus:outline-none focus:border-[#17a773] placeholder:text-[#9e9e9a]"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9e9e9a]">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[10px] text-[#d94040] bg-[#fce8e8] px-2.5 py-2 rounded-lg border border-[#f5a0a0]">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#17a773] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d6b4f] transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-black/[0.06] text-center">
            <div className="text-[10px] text-[#9e9e9a] mb-1.5">Demo credentials</div>
            <div className="text-[11px] font-medium text-[#686864]">demo@fabonique.com</div>
            <div className="text-[11px] font-medium text-[#686864]">Skylitee</div>
          </div>
        </div>

        {/* Platforms */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {["Shopify", "Meta", "GSC", "GA4"].map(p => (
            <div key={p} className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-black/[0.09] text-[9px] text-[#686864]">
              <span className="w-1 h-1 rounded-full bg-[#17a773]" /> {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
