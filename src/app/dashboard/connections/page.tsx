"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { ShoppingBag, Share2, Search, Megaphone, CheckCircle2, XCircle, BarChart2 } from "lucide-react";

interface GoogleSite { url: string; }
interface GA4Property { id: string; name: string; account: string; }

function ConnectionsContent() {
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState("");

  const [shopName, setShopName] = useState<string | null>(null);

  // GSC — independent connection (can use different Google account from GA4)
  const [gscConnected, setGscConnected] = useState(false);
  const [gscSites, setGscSites] = useState<GoogleSite[]>([]);
  const [selectedGsc, setSelectedGsc] = useState("");
  const [gscSaved, setGscSaved] = useState(false);

  // GA4 — independent connection
  const [ga4Connected, setGa4Connected] = useState(false);
  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([]);
  const [selectedGa4, setSelectedGa4] = useState("");
  const [ga4Saved, setGa4Saved] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/shopify/dashboard")
      .then(r => r.json())
      .then(d => { if (d.shop) setShopName(d.shop); })
      .catch(() => {});

    fetch("/api/google/sites")
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setGscConnected(!!d.gscConnected);
        setGa4Connected(!!d.ga4Connected);
        setGscSites(d.gscSites ?? []);
        setGa4Properties(d.ga4Properties ?? []);
        setSelectedGsc(d.savedGscSite ?? d.gscSites?.[0]?.url ?? "");
        setSelectedGa4(d.savedGa4Property ?? d.ga4Properties?.[0]?.id ?? "");
        setGscSaved(!!d.savedGscSite);
        setGa4Saved(!!d.savedGa4Property);
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const disconnectShopify = async () => {
    if (!confirm("Disconnect Shopify? The dashboard will lose access to your store data.")) return;
    await fetch("/api/auth/shopify/disconnect", { method: "POST" });
    setShopName(null);
    showToast("Shopify disconnected — redirecting to install page");
    setTimeout(() => router.push("/install"), 1500);
  };

  const disconnectGsc = async () => {
    if (!confirm("Disconnect Search Console? GSC keyword data will be removed from your dashboard.")) return;
    await fetch("/api/auth/google/disconnect?service=gsc", { method: "POST" });
    setGscConnected(false);
    setGscSites([]);
    setGscSaved(false);
    showToast("Search Console disconnected");
  };

  const disconnectGa4 = async () => {
    if (!confirm("Disconnect Google Analytics 4? GA4 session and traffic data will be removed.")) return;
    await fetch("/api/auth/google/disconnect?service=ga4", { method: "POST" });
    setGa4Connected(false);
    setGa4Properties([]);
    setGa4Saved(false);
    showToast("Google Analytics 4 disconnected");
  };

  const saveGscSite = async () => {
    setSaving(true);
    await fetch("/api/google/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gscSite: selectedGsc }),
    });
    setSaving(false);
    setGscSaved(true);
    showToast("Search Console site saved!");
  };

  const saveGa4Property = async () => {
    setSaving(true);
    await fetch("/api/google/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ga4Property: selectedGa4 }),
    });
    setSaving(false);
    setGa4Saved(true);
    showToast("GA4 property saved!");
  };

  const platforms = [
    {
      name: "Shopify Store",
      icon: <ShoppingBag size={17} className="text-white" />,
      bg: "bg-[#96BF48]",
      status: shopName ? "connected" : "disconnected",
      detail: shopName ? `${shopName} · Live sync` : "Not connected",
      href: "/install",
      disconnectFn: shopName ? disconnectShopify : null,
    },
    {
      name: "Google Search Console",
      icon: <Search size={17} className="text-white" />,
      bg: "bg-[#4285F4]",
      status: gscConnected ? "connected" : "disconnected",
      detail: gscConnected
        ? `Connected · ${gscSaved ? "site selected" : "select site below"}`
        : "Not connected — can use a different Google account than GA4",
      href: "/api/auth/google?service=gsc",
      disconnectFn: gscConnected ? disconnectGsc : null,
    },
    {
      name: "Google Analytics 4",
      icon: <BarChart2 size={17} className="text-white" />,
      bg: "bg-[#E37400]",
      status: ga4Connected ? "connected" : "disconnected",
      detail: ga4Connected
        ? `Connected · ${ga4Saved ? "property selected" : "select property below"}`
        : "Not connected — can use a different Google account than GSC",
      href: "/api/auth/google?service=ga4",
      disconnectFn: ga4Connected ? disconnectGa4 : null,
    },
    {
      name: "Meta Business Suite",
      icon: <Share2 size={17} className="text-white" />,
      bg: "bg-[#1877F2]",
      status: "disconnected",
      detail: "Not connected",
      href: null,
      disconnectFn: null,
    },
    {
      name: "Google Ads Manager",
      icon: <Megaphone size={17} className="text-white" />,
      bg: "bg-[#34A853]",
      status: "disconnected",
      detail: "Not connected · Est. ₹40–60K revenue/month missed",
      href: null,
      disconnectFn: null,
    },
  ];

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Platform Connections</h2>
        <p className="text-[15px] text-[#686864] mt-0.5">Manage integrations · GSC and GA4 can be on different Google accounts</p>
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
                <div className="text-[14px] font-semibold text-[#181816]">{p.name}</div>
                <div className={`text-[13px] mt-0.5 ${p.status === "connected" ? "text-[#0d6b4f]" : "text-[#686864]"}`}>
                  {p.status === "connected" ? "✓" : "○"} {p.detail}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {p.status === "connected" ? (
                  <>
                    <span className="px-3 py-1.5 rounded-lg text-[14px] font-medium bg-[#e0f5ee] border border-[#9FE1CB] text-[#064d38]">
                      Connected
                    </span>
                    {p.disconnectFn && (
                      <button
                        onClick={p.disconnectFn}
                        className="px-2.5 py-1.5 rounded-lg text-[14px] font-medium bg-[#fce8e8] border border-[#f5a0a0] text-[#d94040] hover:bg-[#fbd5d5] transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                  </>
                ) : p.href ? (
                  <a
                    href={p.href}
                    className="px-3 py-1.5 rounded-lg text-[14px] font-medium bg-[#17a773] text-white border border-[#17a773] hover:bg-[#0d6b4f] transition-colors whitespace-nowrap"
                  >
                    Connect Now
                  </a>
                ) : (
                  <button
                    onClick={() => showToast("Coming soon")}
                    className="px-3 py-1.5 rounded-lg text-[14px] font-medium bg-[#17a773] text-white border border-[#17a773] hover:bg-[#0d6b4f] transition-colors"
                  >
                    Connect Now
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* GSC site picker */}
          {gscConnected && gscSites.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[14px] font-semibold text-[#181816] flex items-center gap-1.5">
                  <Search size={11} className="text-[#4285F4]" /> Search Console — select site
                </div>
                {gscSaved && <span className="text-[13px] text-[#0d6b4f]">✓ Saved</span>}
              </div>
              <select
                value={selectedGsc}
                onChange={e => { setSelectedGsc(e.target.value); setGscSaved(false); }}
                className="w-full text-[15px] border border-black/[0.12] rounded-lg px-2.5 py-1.5 bg-white mb-2"
              >
                {gscSites.map(s => (
                  <option key={s.url} value={s.url}>{s.url}</option>
                ))}
              </select>
              <button
                onClick={saveGscSite}
                disabled={saving || gscSaved}
                className="w-full py-2 bg-[#4285F4] text-white rounded-lg text-[14px] font-semibold hover:bg-[#3367d6] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : gscSaved ? "✓ Saved — change dropdown to update" : "Save GSC Site"}
              </button>
            </div>
          )}

          {/* GA4 property picker */}
          {ga4Connected && ga4Properties.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[14px] font-semibold text-[#181816] flex items-center gap-1.5">
                  <BarChart2 size={11} className="text-[#E37400]" /> Analytics GA4 — select property
                </div>
                {ga4Saved && <span className="text-[13px] text-[#0d6b4f]">✓ Saved</span>}
              </div>
              <select
                value={selectedGa4}
                onChange={e => { setSelectedGa4(e.target.value); setGa4Saved(false); }}
                className="w-full text-[15px] border border-black/[0.12] rounded-lg px-2.5 py-1.5 bg-white mb-2"
              >
                {ga4Properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.account}</option>
                ))}
              </select>
              <button
                onClick={saveGa4Property}
                disabled={saving || ga4Saved}
                className="w-full py-2 bg-[#E37400] text-white rounded-lg text-[14px] font-semibold hover:bg-[#c85f00] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : ga4Saved ? "✓ Saved — change dropdown to update" : "Save GA4 Property"}
              </button>
            </div>
          )}
        </Card>

        <div>
          <Card className="mb-2">
            <CardHeader title="Sync status" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Shopify", status: !!shopName, detail: "Orders, products, customers" },
                { label: "Search Console", status: gscConnected && gscSaved, detail: "Keyword rankings & clicks" },
                { label: "Analytics GA4", status: ga4Connected && ga4Saved, detail: "Sessions, users, bounce rate" },
                { label: "Meta Ads", status: false, detail: "Ad campaigns & ROAS" },
                { label: "Google Ads", status: false, detail: "Paid search data" },
              ].map((p, i) => (
                <div key={i} className="p-3 bg-[#f7f7f5] rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${p.status ? "bg-[#17a773]" : "bg-[#d94040]"}`} />
                    <span className="text-[14px] font-semibold text-[#181816]">{p.label}</span>
                  </div>
                  <div className="text-[13px] text-[#686864]">{p.detail}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Multi-account Google support" />
            <div className="bg-[#e4eef9] rounded-lg p-3 text-[13px] text-[#0a3d7a] space-y-1.5 mb-2">
              {[
                "Search Console and GA4 connect independently",
                "Each can use a completely different Google account",
                "Skylitee stores a separate token per service — no conflicts",
                "Disconnect and reconnect each service individually at any time",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="text-[#3478d4] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#fce8e8] rounded-lg p-3 text-[13px] text-[#6e1c1c] border border-[#f5a0a0]">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <XCircle size={12} /> Meta &amp; Google Ads not connected
              </div>
              <div>Connect when ready to track ad spend and ROAS across channels.</div>
            </div>
          </Card>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-[#18181e] text-white px-3.5 py-2 rounded-lg text-[14px] font-medium z-50 shadow-lg">
          ✓ {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<div className="text-[15px] text-[#686864] py-8 text-center">Loading...</div>}>
      <ConnectionsContent />
    </Suspense>
  );
}
