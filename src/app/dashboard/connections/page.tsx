"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { ShoppingBag, Share2, Search, BarChart3, Megaphone, CheckCircle2, XCircle } from "lucide-react";

function ConnectionsContent() {
  const [toastMsg, setToastMsg] = useState("");
  const [shopName, setShopName] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (d.shop) setShopName(d.shop); })
      .catch(() => {});

    // Check Google connection by calling GSC
    fetch("/api/gsc")
      .then(r => r.json())
      .then(d => { if (!d.error || d.error !== "not_connected") setGoogleConnected(true); })
      .catch(() => {});

    // Show success toast if just connected
    const connected = searchParams.get("connected");
    if (connected === "google") setToastMsg("Google (GSC + GA4) connected successfully!");
  }, [searchParams]);

  const platforms = [
    {
      name: "Shopify Store", icon: <ShoppingBag size={17} className="text-white" />, bg: "bg-[#96BF48]",
      status: "connected",
      detail: shopName ? `${shopName} · Live sync` : "Connecting...",
      href: null,
    },
    {
      name: "Google Search Console + GA4", icon: <Search size={17} className="text-white" />, bg: "bg-[#4285F4]",
      status: googleConnected ? "connected" : "disconnected",
      detail: googleConnected ? "Connected · GSC + GA4 active" : "Not connected",
      href: "/api/auth/google",
    },
    {
      name: "Meta Business Suite", icon: <Share2 size={17} className="text-white" />, bg: "bg-[#1877F2]",
      status: "disconnected", detail: "Not connected", href: null,
    },
    {
      name: "Google Ads Manager", icon: <Megaphone size={17} className="text-white" />, bg: "bg-[#34A853]",
      status: "disconnected", detail: "Not connected · Est. ₹40–60K revenue/month missed", href: null,
    },
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
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
              {p.status === "connected" ? (
                <button
                  onClick={() => showToast(`${p.name} is connected`)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#e0f5ee] border border-[#9FE1CB] text-[#064d38]"
                >
                  Connected
                </button>
              ) : p.href ? (
                <a
                  href={p.href}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#17a773] text-white border border-[#17a773] hover:bg-[#0d6b4f] transition-colors whitespace-nowrap"
                >
                  Connect Now
                </a>
              ) : (
                <button
                  onClick={() => showToast("Coming soon")}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#17a773] text-white border border-[#17a773] hover:bg-[#0d6b4f] transition-colors"
                >
                  Connect Now
                </button>
              )}
            </div>
          ))}
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="Sync status" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Shopify", status: !!shopName, detail: "Live orders, products, customers" },
                { label: "GSC + GA4", status: googleConnected, detail: "Search & analytics data" },
                { label: "Meta Ads", status: false, detail: "Ad campaigns & ROAS" },
                { label: "Google Ads", status: false, detail: "Paid search data" },
              ].map((p, i) => (
                <div key={i} className="p-3 bg-[#f7f7f5] rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${p.status ? "bg-[#17a773]" : "bg-[#d94040]"}`} />
                    <span className="text-[11px] font-semibold text-[#181816]">{p.label}</span>
                  </div>
                  <div className="text-[10px] text-[#686864]">{p.detail}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="What connecting Google unlocks" />
            <div className="bg-[#e0f5ee] rounded-lg p-3 text-[10px] text-[#0d6b4f] space-y-1.5">
              {[
                "Real keyword rankings from Search Console",
                "Organic clicks, impressions, CTR, position",
                "GA4 sessions, users, bounce rate",
                "Traffic sources — organic, direct, social",
                "Top pages by views and engagement",
                "AI insights based on your actual web traffic",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-[#17a773] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {!googleConnected && (
              <a
                href="/api/auth/google"
                className="block w-full mt-3 py-2.5 bg-[#4285F4] text-white rounded-lg text-[11px] font-semibold hover:bg-[#3367d6] transition-colors text-center"
              >
                Connect Google (GSC + GA4) Now
              </a>
            )}

            {googleConnected && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-[#0d6b4f] font-medium">
                <CheckCircle2 size={13} /> Google connected — GSC and GA4 data is live
              </div>
            )}

            <div className="mt-3 bg-[#fce8e8] rounded-lg p-3 text-[10px] text-[#6e1c1c] border border-[#f5a0a0]">
              <div className="flex items-center gap-1.5 font-semibold mb-1.5">
                <XCircle size={12} /> Google Ads not connected
              </div>
              <div>Connect Google Ads when you start running paid search campaigns to track ROAS and keyword performance.</div>
            </div>
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

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="text-[12px] text-[#686864] py-8 text-center">Loading...</div>}>
      <ConnectionsContent />
    </Suspense>
  );
}
