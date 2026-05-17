"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, ShoppingBag, ArrowRight, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

function InstallForm() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error");
  const [shop, setShop] = useState("rrahi-print-shop.myshopify.com");

  const handleConnect = () => {
    const cleanShop = shop.replace("https://", "").replace(/\/$/, "");
    window.location.href = `/api/auth?shop=${cleanShop}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f0ed] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-[#17a773] rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#181816]">Skylitee</div>
            <div className="text-[11px] text-[#9e9e9a]">Unified Analytics for D2C Brands</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-black/[0.09] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={18} className="text-[#17a773]" />
            <h1 className="text-[16px] font-semibold text-[#181816]">Connect your Shopify store</h1>
          </div>
          <p className="text-[12px] text-[#686864] mb-5">
            Skylitee will read your orders, products, and customer data to power your analytics dashboard.
          </p>

          {hasError && (
            <div className="bg-[#fce8e8] border border-[#f5a0a0] rounded-lg px-3 py-2.5 mb-4 text-[12px] text-[#6e1c1c]">
              Connection failed. Please try again.
            </div>
          )}

          <div className="mb-4">
            <label className="text-[12px] font-medium text-[#181816] block mb-1.5">
              Your Shopify store URL
            </label>
            <input
              type="text"
              value={shop}
              onChange={e => setShop(e.target.value)}
              className="w-full px-3 py-2.5 border border-black/[0.15] rounded-lg text-[13px] text-[#181816] bg-white focus:outline-none focus:border-[#17a773] transition-colors"
              placeholder="yourstore.myshopify.com"
            />
          </div>

          <button
            onClick={handleConnect}
            className="w-full py-3 bg-[#17a773] text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#0d6b4f] transition-colors"
          >
            <ShoppingBag size={15} /> Connect Shopify Store <ArrowRight size={15} />
          </button>

          {/* What we access */}
          <div className="mt-5 pt-4 border-t border-black/[0.07]">
            <div className="text-[11px] font-semibold text-[#9e9e9a] uppercase tracking-wider mb-2.5">What Skylitee will access</div>
            {[
              "Orders — revenue, AOV, payment methods",
              "Products — sales, inventory, stock levels",
              "Customers — segments, LTV, location",
              "Analytics — traffic and conversion data",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 size={13} className="text-[#17a773] shrink-0" />
                <span className="text-[12px] text-[#686864]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#9e9e9a] mt-4">
          Your data is private and never shared. Read-only access.
        </p>
      </div>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense>
      <InstallForm />
    </Suspense>
  );
}
