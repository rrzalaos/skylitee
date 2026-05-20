"use client";
import { useState } from "react";
import { Store } from "lucide-react";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";

export default function ConnectPage() {
  const [shop, setShop] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let domain = shop.trim().toLowerCase();
    if (!domain.includes(".myshopify.com")) {
      domain = `${domain}.myshopify.com`;
    }
    if (!domain.match(/^[a-z0-9-]+\.myshopify\.com$/)) {
      setError("Enter a valid Shopify store URL");
      setLoading(false);
      return;
    }

    window.location.href = `/api/auth?shop=${domain}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <SkyLiteeLogo size={36} />
          <div>
            <div className="text-[18px] font-black text-white">Sky Litee</div>
            <div className="text-[12px] text-white/50">Unified Analytics Platform</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-7 shadow-xl">
          <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-4">
            <Store size={20} className="text-[#F97316]" />
          </div>
          <h1 className="text-[20px] font-bold text-white mb-1">Connect your store</h1>
          <p className="text-[14px] text-white/50 mb-6">
            Link your Shopify store to start seeing your analytics.
          </p>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="text-[13px] font-semibold text-white/60 mb-1.5 block uppercase tracking-[0.08em]">Shopify Store URL</label>
              <input
                type="text" value={shop} onChange={e => setShop(e.target.value)}
                placeholder="your-store.myshopify.com"
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
              className="w-full py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-[15px] font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_28px_rgba(249,115,22,0.45)] disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect Shopify Store →"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => window.location.href = "/dashboard"}
            className="w-full py-2 text-[13px] text-white/30 hover:text-white/50 transition-colors text-center mt-3"
          >
            Skip for now — explore dashboard →
          </button>

          <div className="mt-3 pt-4 border-t border-white/[0.06]">
            <p className="text-[12px] text-white/30 text-center">
              Read-only access. Your data is private and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
