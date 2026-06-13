"use client";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Users, BarChart2, LayoutDashboard,
  Search, UserX, UserCheck, ShieldCheck,
  Eye, EyeOff, Lock, RefreshCw, LogIn, TrendingUp,
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, KeyRound,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  name: string;
  email: string;
  shops: string[];
  createdAt: string;
  disabled: boolean;
  profile: { brandName: string; niche: string; businessType: string; phone: string; country: string; city: string } | null;
  connections: { shopify: boolean; meta: boolean; ga4: boolean; gsc: boolean };
  plan: string;
}

interface StoreStats {
  revenue: number;
  orders: number;
  aov: number;
  codPct: number;
  hasMetaToken: boolean;
  loading: boolean;
  error: boolean;
}

interface Coupon {
  code: string;
  discountPct: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  active: boolean;
  redemptions: string[];
}

const ADMIN_PIN = "TempPwd@#2026";

function PlatformDots({ c }: { c: AdminUser["connections"] }) {
  const dots = [
    { key: "shopify", label: "Shopify", color: "#96BF48", on: c.shopify },
    { key: "meta",    label: "Meta",    color: "#1877F2", on: c.meta    },
    { key: "ga4",     label: "GA4",     color: "#E37400", on: c.ga4     },
    { key: "gsc",     label: "GSC",     color: "#34A853", on: c.gsc     },
  ];
  return (
    <div className="flex items-center gap-1">
      {dots.map(d => (
        <span key={d.key} title={`${d.label}: ${d.on ? "connected" : "not connected"}`}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: d.on ? d.color : "#D4D4D4" }} />
      ))}
    </div>
  );
}

function PasswordGate({ pin, setPin, onLogin, error }: {
  pin: string; setPin: (v: string) => void; onLogin: () => void; error: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-xl p-8 w-full max-w-sm border border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[20px] font-bold dark:text-[#F4F4F5]">Admin Panel</div>
            <div className="text-[20px] text-[#A1A1AA]">Skylitee · Owner access only</div>
          </div>
        </div>
        <label className="text-[20px] font-semibold dark:text-[#F4F4F5] block mb-1">Admin Password</label>
        <div className="relative mb-3">
          <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            type={show ? "text" : "password"}
            value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onLogin()}
            placeholder="Enter admin password"
            className={cn(
              "w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border rounded-xl pl-9 pr-10 py-2.5 text-[17px] dark:text-[#F4F4F5] outline-none transition-all",
              error ? "border-[#EF4444] ring-1 ring-[#EF4444]/30" : "border-black/[0.06] dark:border-white/[0.06] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30"
            )}
          />
          <button onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        {error && <div className="text-[15px] text-[#EF4444] mb-2">Incorrect password.</div>}
        <button onClick={onLogin}
          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl py-2.5 text-[17px] font-bold transition-colors">
          Enter Admin Panel
        </button>
        <div className="mt-4 text-center text-[15px] text-[#A1A1AA]">Authorised access only. All actions are logged.</div>
      </div>
    </div>
  );
}

type AdminTab = "overview" | "users" | "analytics" | "coupons";

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [pin, setPin]             = useState("");
  const [pinError, setPinError]   = useState(false);
  const [tab, setTab]             = useState<AdminTab>("overview");
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast]         = useState("");
  const [loginAsLoading, setLoginAsLoading] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null); // email of user being reset
  const [resetPassword, setResetPassword] = useState("");
  const [storeStats, setStoreStats] = useState<Record<string, StoreStats>>({});

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(100);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newExpiry, setNewExpiry] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json() as { users: AdminUser[] };
        setUsers(data.users ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Load store stats for all Shopify-connected stores
  const loadStoreStats = useCallback(async (userList: AdminUser[]) => {
    const shopifyUsers = userList.filter(u => u.connections.shopify && u.shops[0]);
    for (const u of shopifyUsers) {
      const shop = u.shops[0];
      setStoreStats(prev => ({ ...prev, [shop]: { revenue: 0, orders: 0, aov: 0, codPct: 0, hasMetaToken: false, loading: true, error: false } }));
      fetch(`/api/admin/store-stats?shop=${encodeURIComponent(shop)}`)
        .then(r => r.json())
        .then(d => {
          if (d.error) {
            setStoreStats(prev => ({ ...prev, [shop]: { ...prev[shop], loading: false, error: true } }));
          } else {
            setStoreStats(prev => ({ ...prev, [shop]: { revenue: d.revenue, orders: d.orders, aov: d.aov, codPct: d.codPct, hasMetaToken: d.hasMetaToken, loading: false, error: false } }));
          }
        })
        .catch(() => setStoreStats(prev => ({ ...prev, [shop]: { ...prev[shop], loading: false, error: true } })));
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("skylitee-admin-auth") === "1") {
      setAuthed(true);
      loadUsers().then(() => {});
    }
  }, [loadUsers]);

  useEffect(() => {
    if (users.length > 0 && tab === "users") {
      loadStoreStats(users);
    }
  }, [users, tab, loadStoreStats]);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json() as { coupons: Coupon[] };
        setCoupons(data.coupons ?? []);
      }
    } catch { /* ignore */ }
    setCouponsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "coupons") loadCoupons();
  }, [tab, loadCoupons]);

  const doLogin = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("skylitee-admin-auth", "1");
      setAuthed(true);
      loadUsers();
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const lockAdmin = () => {
    sessionStorage.removeItem("skylitee-admin-auth");
    setAuthed(false);
  };

  const toggleDisabled = async (email: string, currentlyDisabled: boolean) => {
    const action = currentlyDisabled ? "enable" : "disable";
    const res = await fetch("/api/admin/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, action }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.email === email ? { ...u, disabled: !currentlyDisabled } : u));
      showToast(`User ${action}d.`);
    }
  };

  const doResetPassword = async () => {
    if (!resetTarget || resetPassword.length < 6) return;
    const res = await fetch("/api/admin/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetTarget, action: "reset-password", newPassword: resetPassword }),
    });
    if (res.ok) {
      showToast(`Password reset for ${resetTarget}.`);
      setResetTarget(null);
      setResetPassword("");
    } else {
      showToast("Failed to reset password.");
    }
  };

  const loginAs = async (email: string) => {
    setLoginAsLoading(email);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        showToast(`Logging in as ${email}…`);
        setTimeout(() => { window.location.href = "/dashboard"; }, 600);
      } else {
        showToast("Could not impersonate user.");
        setLoginAsLoading(null);
      }
    } catch {
      showToast("Network error.");
      setLoginAsLoading(null);
    }
  };

  if (!authed) return <PasswordGate pin={pin} setPin={setPin} onLogin={doLogin} error={pinError} />;

  const activeUsers  = users.filter(u => !u.disabled).length;
  const shopifyCount = users.filter(u => u.connections.shopify).length;
  const metaCount    = users.filter(u => u.connections.meta).length;
  const ga4Count     = users.filter(u => u.connections.ga4).length;

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !search
      || u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.profile?.brandName ?? "").toLowerCase().includes(q)
      || (u.shops[0] ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all"
      || (filterStatus === "active"   && !u.disabled)
      || (filterStatus === "disabled" &&  u.disabled);
    return matchQ && matchStatus;
  });

  const createCoupon = async () => {
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          discountPct: newDiscount,
          maxUses: newMaxUses,
          expiresAt: newExpiry || null,
        }),
      });
      const data = await res.json() as { coupon?: Coupon; error?: string };
      if (data.coupon) {
        setCoupons(prev => [data.coupon!, ...prev]);
        setShowCreateForm(false);
        setNewCode("");
        setNewDiscount(100);
        setNewMaxUses(1);
        setNewExpiry("");
        showToast("Coupon created.");
      } else {
        setCreateError(data.error ?? "Failed to create coupon");
      }
    } catch {
      setCreateError("Network error.");
    }
    setCreateLoading(false);
  };

  const deleteCoupon = async (code: string) => {
    const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, { method: "DELETE" });
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.code !== code));
      showToast("Coupon deleted.");
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon.code, active: !coupon.active }),
    });
    if (res.ok) {
      setCoupons(prev => prev.map(c => c.code === coupon.code ? { ...c, active: !c.active } : c));
      showToast(`Coupon ${coupon.active ? "deactivated" : "activated"}.`);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setNewCode(code);
  };

  const couponStatus = (c: Coupon) => {
    if (!c.active) return { label: "Inactive", color: "text-[#A1A1AA]" };
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { label: "Expired", color: "text-[#EF4444]" };
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { label: "Exhausted", color: "text-[#EAB308]" };
    return { label: "Active", color: "text-[#22C55E]" };
  };

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: "overview",  label: "Overview",            icon: LayoutDashboard },
    { key: "users",     label: `Users (${users.length})`, icon: Users       },
    { key: "analytics", label: "Analytics",           icon: BarChart2       },
    { key: "coupons",   label: `Coupons (${coupons.length})`, icon: Tag     },
  ];

  return (
    <div className="space-y-4 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#F97316] rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold dark:text-[#F4F4F5]">Admin Panel</h2>
            <p className="text-[15px] text-[#A1A1AA]">Skylitee platform management · Owner only · Live data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[20px] font-semibold text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.06] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50">
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={lockAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[20px] font-semibold text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.06] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
            <Lock size={11} /> Lock
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Registered",  value: users.length,  sub: "all time",          color: "text-[#F97316]"  },
          { label: "Active Stores",     value: activeUsers,   sub: `${users.length - activeUsers} suspended`, color: "text-[#22C55E]" },
          { label: "Shopify Connected", value: shopifyCount,  sub: `${users.length - shopifyCount} not connected`, color: "text-[#96BF48]" },
          { label: "Meta Connected",    value: metaCount,     sub: `GA4: ${ga4Count}`,   color: "text-[#1877F2]"  },
        ].map(k => (
          <Card key={k.label}>
            <div className="text-[15px] font-bold text-[#A1A1AA] uppercase tracking-wide">{k.label}</div>
            <div className={cn("text-[30px] font-black mt-1", k.color)}>{k.value}</div>
            <div className="text-[15px] text-[#A1A1AA] mt-0.5">{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-black/[0.06] dark:border-white/[0.06] overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-[17px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors",
                tab === t.key
                  ? "border-[#F97316] text-[#F97316]"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
              )}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Platform Connections" right={`${users.length} stores total`} />
            <div className="space-y-3 mt-3">
              {[
                { label: "Shopify",  count: shopifyCount,                              color: "#96BF48" },
                { label: "Meta Ads", count: metaCount,                                 color: "#1877F2" },
                { label: "GA4",      count: ga4Count,                                  color: "#E37400" },
                { label: "GSC",      count: users.filter(u => u.connections.gsc).length, color: "#34A853" },
              ].map(p => {
                const pct = users.length ? Math.round((p.count / users.length) * 100) : 0;
                return (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[17px] font-semibold dark:text-[#F4F4F5]">{p.label}</span>
                      <span className="text-[20px] font-bold" style={{ color: p.color }}>{p.count} / {users.length}</span>
                    </div>
                    <div className="w-full h-2 bg-[#F5F5F4] dark:bg-[#262626] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent registrations */}
          <Card>
            <CardHeader title="Recent Registrations" right="Last 10 stores" />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-[17px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["User", "Brand", "Shopify Store", "Platforms", "Registered", "Status"].map(h => (
                      <th key={h} className="text-left text-[14px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map(u => (
                    <tr key={u.email} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-semibold dark:text-[#F4F4F5] text-[17px]">{u.name}</div>
                        <div className="text-[15px] text-[#A1A1AA] truncate max-w-[160px]">{u.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-[20px] dark:text-[#F4F4F5]">
                        {u.profile?.brandName || <span className="text-[#A1A1AA] italic">not set</span>}
                      </td>
                      <td className="py-3 pr-4 text-[20px] text-[#71717A] dark:text-[#A1A1AA]">
                        {u.shops[0] ? u.shops[0].replace(".myshopify.com", "") : <span className="italic">none</span>}
                      </td>
                      <td className="py-3 pr-4"><PlatformDots c={u.connections} /></td>
                      <td className="py-3 pr-4 text-[20px] text-[#A1A1AA] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="py-3">
                        <span className={cn("text-[15px] font-bold flex items-center gap-1",
                          u.disabled ? "text-[#EF4444]" : "text-[#22C55E]")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                            u.disabled ? "bg-[#EF4444]" : "bg-[#22C55E]")} />
                          {u.disabled ? "suspended" : "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div className="space-y-3">
          {/* Filters — only search + status */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, brand, store…"
                className="w-full bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-[17px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[17px] dark:text-[#F4F4F5] outline-none appearance-none">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="disabled">Suspended</option>
            </select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[17px] min-w-[900px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["User / Email", "Brand", "Phone", "Shopify Store", "Platforms", "This Month", "Status", "Access", "Reset Pwd", "Login As"].map(h => (
                      <th key={h} className="text-left text-[14px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2.5 pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const shop = u.shops[0] ?? "";
                    const stats = shop ? storeStats[shop] : null;
                    return (
                      <tr key={u.email} className={cn(
                        "border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#FAFAF9] dark:hover:bg-[#1C1C1C] transition-colors",
                        u.disabled && "opacity-60"
                      )}>
                        <td className="py-3 pr-3">
                          <div className="font-semibold dark:text-[#F4F4F5] leading-tight">{u.name}</div>
                          <div className="text-[15px] text-[#A1A1AA] truncate max-w-[170px]">{u.email}</div>
                        </td>
                        <td className="py-3 pr-3 text-[20px] dark:text-[#F4F4F5]">
                          {u.profile?.brandName || <span className="text-[#A1A1AA] italic">—</span>}
                        </td>
                        <td className="py-3 pr-3 text-[20px] text-[#71717A] dark:text-[#A1A1AA]">
                          {u.profile?.phone || "—"}
                        </td>
                        <td className="py-3 pr-3 text-[20px] text-[#71717A] dark:text-[#A1A1AA]">
                          {u.shops[0] ? u.shops[0].replace(".myshopify.com", "") : <span className="italic">none</span>}
                        </td>
                        <td className="py-3 pr-3"><PlatformDots c={u.connections} /></td>
                        {/* Monthly stats */}
                        <td className="py-3 pr-3">
                          {!u.connections.shopify ? (
                            <span className="text-[15px] text-[#A1A1AA] italic">No Shopify</span>
                          ) : stats?.loading ? (
                            <span className="text-[15px] text-[#A1A1AA]">Loading…</span>
                          ) : stats?.error ? (
                            <span className="text-[15px] text-[#EF4444]">Error</span>
                          ) : stats ? (
                            <div>
                              <div className="flex items-center gap-1 text-[20px] font-bold text-[#22C55E]">
                                <TrendingUp size={10} />
                                {formatINR(stats.revenue)}
                              </div>
                              <div className="text-[15px] text-[#A1A1AA]">{stats.orders} orders · AOV {formatINR(stats.aov)}</div>
                              {stats.codPct > 0 && <div className="text-[15px] text-[#EAB308]">COD {stats.codPct}%</div>}
                            </div>
                          ) : (
                            <span className="text-[15px] text-[#A1A1AA]">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={cn("text-[15px] font-bold flex items-center gap-1 whitespace-nowrap",
                            u.disabled ? "text-[#EF4444]" : "text-[#22C55E]")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                              u.disabled ? "bg-[#EF4444]" : "bg-[#22C55E]")} />
                            {u.disabled ? "suspended" : "active"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            onClick={() => toggleDisabled(u.email, u.disabled)}
                            title={u.disabled ? "Restore access" : "Suspend access"}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1 rounded-xl text-[15px] font-bold transition-colors",
                              u.disabled
                                ? "bg-[#F0FDF4] text-[#16A34A] dark:bg-[#052E16] hover:bg-[#DCFCE7]"
                                : "bg-[#FEF2F2] text-[#DC2626] dark:bg-[#2D0A0A] hover:bg-[#FEE2E2]"
                            )}>
                            {u.disabled ? <><UserCheck size={10} /> Restore</> : <><UserX size={10} /> Suspend</>}
                          </button>
                        </td>
                        {/* Reset Password */}
                        <td className="py-3 pr-3">
                          <button
                            onClick={() => { setResetTarget(u.email); setResetPassword(""); }}
                            title={`Reset password for ${u.name}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[15px] font-bold bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] hover:bg-[#FFEDD5] transition-colors">
                            <KeyRound size={10} /> Reset
                          </button>
                        </td>
                        {/* Login As */}
                        <td className="py-3">
                          <button
                            onClick={() => loginAs(u.email)}
                            disabled={u.disabled || loginAsLoading === u.email}
                            title={`Login as ${u.name}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[15px] font-bold bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[#1E3A5F] hover:bg-[#DBEAFE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {loginAsLoading === u.email
                              ? <RefreshCw size={10} className="animate-spin" />
                              : <LogIn size={10} />}
                            Login
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={9} className="py-10 text-center text-[17px] text-[#A1A1AA]">
                      {loading ? "Loading…" : "No users found"}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "analytics" && (
        <div className="space-y-4">
          {/* Platform adoption */}
          <Card>
            <CardHeader title="Platform Adoption Rate" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              {[
                { label: "Shopify",  count: shopifyCount,                                 color: "#96BF48" },
                { label: "Meta Ads", count: metaCount,                                    color: "#1877F2" },
                { label: "GA4",      count: ga4Count,                                     color: "#E37400" },
                { label: "GSC",      count: users.filter(u => u.connections.gsc).length, color: "#34A853" },
              ].map(p => {
                const pct = users.length ? Math.round((p.count / users.length) * 100) : 0;
                return (
                  <div key={p.label} className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 text-center">
                    <div className="text-[32px] font-black" style={{ color: p.color }}>{pct}%</div>
                    <div className="text-[17px] font-semibold dark:text-[#F4F4F5]">{p.label}</div>
                    <div className="text-[15px] text-[#A1A1AA]">{p.count} of {users.length} stores</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Full user list */}
          <Card>
            <CardHeader title="All Stores — Full Details" right="Newest first" />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-[20px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["#", "Name", "Email", "Brand", "Phone", "City", "Shopify Store", "Connections", "Joined"].map(h => (
                      <th key={h} className="text-left text-[14px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2 pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.email} className={cn(
                      "border-b border-black/[0.04] dark:border-white/[0.04] last:border-0",
                      u.disabled && "opacity-50"
                    )}>
                      <td className="py-2.5 pr-3 text-[#A1A1AA] font-bold">{i + 1}</td>
                      <td className="py-2.5 pr-3 font-semibold dark:text-[#F4F4F5]">{u.name}</td>
                      <td className="py-2.5 pr-3 text-[#71717A] dark:text-[#A1A1AA] max-w-[160px] truncate">{u.email}</td>
                      <td className="py-2.5 pr-3 dark:text-[#F4F4F5]">{u.profile?.brandName || "—"}</td>
                      <td className="py-2.5 pr-3 text-[#71717A] dark:text-[#A1A1AA]">{u.profile?.phone || "—"}</td>
                      <td className="py-2.5 pr-3 text-[#71717A] dark:text-[#A1A1AA]">{u.profile?.city || "—"}</td>
                      <td className="py-2.5 pr-3 text-[#71717A] dark:text-[#A1A1AA]">{u.shops[0]?.replace(".myshopify.com", "") || "—"}</td>
                      <td className="py-2.5 pr-3"><PlatformDots c={u.connections} /></td>
                      <td className="py-2.5 pr-3 text-[#A1A1AA] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── COUPONS ── */}
      {tab === "coupons" && (
        <div className="space-y-4">
          {/* Header + Create button */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-[15px] font-bold dark:text-[#F4F4F5]">Coupon Codes</h3>
              <p className="text-[13px] text-[#A1A1AA]">Generate discount codes for clients</p>
            </div>
            <button
              onClick={() => setShowCreateForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors"
            >
              <Plus size={12} /> Generate Coupon
            </button>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <Card>
              <div className="text-[14px] font-bold dark:text-[#F4F4F5] mb-4">New Coupon</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wide block mb-1">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      value={newCode}
                      onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      placeholder="e.g. RRAHI2025"
                      maxLength={20}
                      className="flex-1 bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] font-mono uppercase"
                    />
                    <button
                      onClick={generateRandomCode}
                      className="px-3 py-2 rounded-xl text-[12px] font-bold bg-[#F5F5F4] dark:bg-[#262626] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors whitespace-nowrap"
                    >
                      Random
                    </button>
                  </div>
                </div>

                {/* Discount % */}
                <div>
                  <label className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wide block mb-1">
                    Discount — {newDiscount}% off
                    {newDiscount === 100 && <span className="ml-1 text-[#22C55E]">(Free access)</span>}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={newDiscount}
                    onChange={e => setNewDiscount(Number(e.target.value))}
                    className="w-full accent-[#F97316]"
                  />
                  <div className="flex justify-between text-[11px] text-[#A1A1AA] mt-0.5">
                    <span>1%</span>
                    <span className="text-[#F97316] font-bold">
                      ${((29 * (1 - newDiscount / 100))).toFixed(2)}/mo
                      {newDiscount === 100 && " · FREE"}
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Max uses */}
                <div>
                  <label className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wide block mb-1">Max Uses (0 = unlimited)</label>
                  <input
                    type="number"
                    min={0}
                    value={newMaxUses}
                    onChange={e => setNewMaxUses(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wide block mb-1">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={e => setNewExpiry(e.target.value)}
                    className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              {createError && (
                <p className="text-[12px] text-[#EF4444] font-semibold mt-3">{createError}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={createCoupon}
                  disabled={createLoading || !newCode.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors disabled:opacity-50"
                >
                  {createLoading ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
                  Create Coupon
                </button>
                <button
                  onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Card>
          )}

          {/* Coupons table */}
          <Card>
            {couponsLoading ? (
              <div className="py-10 text-center text-[13px] text-[#A1A1AA]">Loading coupons…</div>
            ) : coupons.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#A1A1AA]">No coupons yet. Generate your first one above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[700px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                      {["Code", "Discount", "Uses", "Expires", "Status", "Actions"].map(h => (
                        <th key={h} className="text-left text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2.5 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => {
                      const status = couponStatus(c);
                      return (
                        <tr key={c.code} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#FAFAF9] dark:hover:bg-[#1C1C1C] transition-colors">
                          <td className="py-3 pr-4">
                            <span className="font-mono font-bold text-[#F97316] bg-[#FFF7ED] dark:bg-[#2A1A0E] px-2 py-0.5 rounded-lg text-[12px]">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-bold dark:text-[#F4F4F5]">
                            {c.discountPct}% off
                            {c.discountPct === 100 && (
                              <span className="ml-1 text-[#22C55E] font-semibold text-[11px]">FREE</span>
                            )}
                            {c.discountPct < 100 && (
                              <div className="text-[11px] text-[#A1A1AA] font-normal">
                                ${(29 * (1 - c.discountPct / 100)).toFixed(2)}/mo
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4 dark:text-[#F4F4F5]">
                            {c.usedCount} / {c.maxUses === 0 ? "∞" : c.maxUses}
                          </td>
                          <td className="py-3 pr-4 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">
                            {c.expiresAt
                              ? new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
                              : "Never"}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={cn("text-[12px] font-bold", status.color)}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleCoupon(c)}
                                title={c.active ? "Deactivate" : "Activate"}
                                className="text-[#A1A1AA] hover:text-[#F97316] transition-colors"
                              >
                                {c.active ? <ToggleRight size={16} className="text-[#22C55E]" /> : <ToggleLeft size={16} />}
                              </button>
                              <button
                                onClick={() => deleteCoupon(c.code)}
                                title="Delete coupon"
                                className="text-[#A1A1AA] hover:text-[#EF4444] transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Reset Password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#FFF7ED] dark:bg-[#2A1A0E] rounded-xl flex items-center justify-center shrink-0">
                <KeyRound size={14} className="text-[#EA580C]" />
              </div>
              <div>
                <div className="text-[14px] font-bold dark:text-[#F4F4F5]">Reset Password</div>
                <div className="text-[12px] text-[#A1A1AA] truncate max-w-[220px]">{resetTarget}</div>
              </div>
            </div>
            <label className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wide block mb-1.5">New Password</label>
            <input
              type="text"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doResetPassword()}
              placeholder="Minimum 6 characters"
              className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2.5 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] mb-4 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={doResetPassword}
                disabled={resetPassword.length < 6}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors disabled:opacity-50"
              >
                Set Password
              </button>
              <button
                onClick={() => { setResetTarget(null); setResetPassword(""); }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] px-3.5 py-2 rounded-xl text-[17px] font-semibold z-50 shadow-xl">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
