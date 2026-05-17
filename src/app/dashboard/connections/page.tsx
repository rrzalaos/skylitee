"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { ShoppingBag, Share2, Search, BarChart3, Megaphone, CheckCircle2, XCircle } from "lucide-react";

export default function ConnectionsPage() {
  const [toastMsg, setToastMsg] = useState("");
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (d.shop) setShopName(d.shop); })
      .catch(() => {});
  }, []);

  const platforms = [
    {
      name: "Shopify Store", icon: <ShoppingBag size={17} className="text-white" />, bg: "bg-[#96BF48]",
      status: "connected",
      detail: shopName ? `${shopName} · Live sync` : "Connecting...",
      sync: "Live",
    },
    {
      name: "Meta Business Suite", icon: <Share2 size={17} className="text-white" />, bg: "bg-[#1877F2]",
      status: "disconnected", detail: "Not connected", sync: "—",
    },
    {
      name: "Google Search Console", icon: <Search size={17} className="text-white" />, bg: "bg-[#4285F4]",
      status: "disconnected", detail: "Not connected", sync: "—",
    },
    {
      name: "Google Analytics 4", icon: <BarChart3 size={17} className="text-white" />, bg: "bg-[#E37400]",
      status: "disconnected", detail: "Not connected", sync: "—",
    },
    {
      name: "Google Ads Manager", icon: <Megaphone size={17} className="text-white" />, bg: "bg-[#4285F4]",
      status: "disconnected", detail: "Not connected · Est. ₹40–60K revenue/month missed", sync: "—",
    },
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Platform Connections</h2>
        <p className="text-[12px] text-[#686864] mt-0.5">Manage integrations and sync status</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader title="Connected platforms" />
          {platforms.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-black/[0.06] last:border-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${p.bg}`}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-[#181816]">{p.name}</div>
                <div className={`text-[10px] mt-0.5 ${p.status === "connected" ? "text-[#0d6b4f]" : "text-[#d94040]"}`}>
                  {p.status === "connected" ? "✓" : "✗"} {p.detail}
                </div>
              </div>
              <button
                onClick={() => showToast(p.status === "connected" ? `${p.name} is connected` : "Coming soon — integration in progress")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                  p.status === "connected"
                    ? "bg-[#e0f5ee] border border-[#9FE1CB] text-[#064d38]"
                    : "bg-[#17a773] text-white border border-[#17a773] hover:bg-[#0d6b4f]"
                } transition-colors`}
              >
                {p.status === "connected" ? "Connected" : "Connect Now"}
              </button>
            </div>
          ))}
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="Sync status" />
            <div className="grid grid-cols-3 gap-2">
              {platforms.map((p, i) => (
                <div key={i} className="text-center p-2.5 bg-[#f7f7f5] rounded-lg">
                  <div className={`text-lg font-semibold ${p.status === "connected" ? "text-[#0d6b4f]" : "text-[#d94040]"}`}>
                    {p.sync}
                  </div>
                  <div className="text-[9px] text-[#686864] mt-0.5 truncate">{p.name.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="What Google Ads unlocks" />
            <div className="bg-[#e0f5ee] rounded-lg p-3 text-[10px] text-[#0d6b4f] space-y-1.5">
              {[
                "Search campaign data — keywords, quality score, impression share",
                "Shopping — product ROAS by SKU",
                "Remarketing — GA4 + Shopify custom audiences",
                "Full cross-channel attribution (Meta vs Google vs Organic)",
                "AI budget optimiser across all paid channels combined",
                "Keyword + GSC data cross-referenced automatically",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-[#17a773] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 bg-[#fce8e8] rounded-lg p-3 text-[10px] text-[#6e1c1c] border border-[#f5a0a0]">
              <div className="flex items-center gap-1.5 font-semibold mb-1.5">
                <XCircle size={12} /> Without Google Ads connection
              </div>
              <div>Est. ₹40–60K in monthly revenue is currently uncaptured. High-intent search traffic converts 2.4× better than social.</div>
            </div>

            <button
              onClick={() => showToast("Coming soon — Google Ads integration in progress")}
              className="w-full mt-3 py-2.5 bg-[#17a773] text-white rounded-lg text-[11px] font-semibold hover:bg-[#0d6b4f] transition-colors"
            >
              Connect Google Ads Now
            </button>
          </Card>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-[#18181e] text-white px-3.5 py-2 rounded-lg text-[11px] font-medium z-50 shadow-lg">
          ✓ {toastMsg}
        </div>
      )}
    </div>
  );
}
