"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Users, BarChart2, CreditCard, LayoutDashboard,
  Search, Plus, Edit2, Trash2, LogIn, UserX, UserCheck,
  ShieldCheck, Eye, EyeOff, X, Lock, CheckCircle2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, Tooltip as RTooltip,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string; name: string; email: string;
  brand: string; niche: string;
  city: string; state: string;
  plan: "free" | "pro" | "agency";
  status: "active" | "inactive";
  joinedAt: string; lastActiveAt: string;
  shopifyStore: string;
  monthlySales: number[];
  totalRevenue: number; totalOrders: number;
}

interface AdminPlan {
  id: string; name: string; price: number; color: string;
  features: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const ADMIN_PIN = "skylitee2026";
const STORAGE_KEY = "skylitee-admin-data";

const SEED_USERS: AdminUser[] = [
  {
    id: "u001", name: "Rishi Zala", email: "rrzala@yellowsky.in",
    brand: "Rrahi Print Shop", niche: "Print-on-Demand",
    city: "Ahmedabad", state: "Gujarat", plan: "pro", status: "active",
    joinedAt: "2024-11-01", lastActiveAt: "2026-05-18",
    shopifyStore: "rrahi-print-shop.myshopify.com",
    monthlySales: [18500, 24200, 31000, 27800, 35400, 42100],
    totalRevenue: 179000, totalOrders: 89,
  },
  {
    id: "u002", name: "Priya Sharma", email: "priya@kraftkart.in",
    brand: "KraftKart", niche: "Apparel & Fashion",
    city: "Mumbai", state: "Maharashtra", plan: "pro", status: "active",
    joinedAt: "2025-01-15", lastActiveAt: "2026-05-17",
    shopifyStore: "kraftkart.myshopify.com",
    monthlySales: [45000, 52000, 61000, 55000, 68000, 73000],
    totalRevenue: 354000, totalOrders: 234,
  },
  {
    id: "u003", name: "Arjun Mehta", email: "arjun@luminora.co",
    brand: "Luminora", niche: "Beauty & Skincare",
    city: "Bangalore", state: "Karnataka", plan: "agency", status: "active",
    joinedAt: "2024-12-20", lastActiveAt: "2026-05-16",
    shopifyStore: "luminora.myshopify.com",
    monthlySales: [82000, 94000, 110000, 98000, 125000, 138000],
    totalRevenue: 647000, totalOrders: 412,
  },
  {
    id: "u004", name: "Kavya Nair", email: "kavya@homebliss.in",
    brand: "HomeBliss", niche: "Home Decor",
    city: "Kochi", state: "Kerala", plan: "free", status: "active",
    joinedAt: "2026-02-10", lastActiveAt: "2026-05-10",
    shopifyStore: "homebliss.myshopify.com",
    monthlySales: [0, 0, 8500, 12000, 15000, 18000],
    totalRevenue: 53500, totalOrders: 47,
  },
  {
    id: "u005", name: "Rahul Gupta", email: "rahul@streetwearco.in",
    brand: "StreetWear Co", niche: "Apparel & Fashion",
    city: "Delhi", state: "Delhi", plan: "pro", status: "active",
    joinedAt: "2025-03-05", lastActiveAt: "2026-05-15",
    shopifyStore: "streetwearco.myshopify.com",
    monthlySales: [0, 32000, 38000, 35000, 41000, 47000],
    totalRevenue: 193000, totalOrders: 156,
  },
  {
    id: "u006", name: "Sneha Iyer", email: "sneha@handcraftedelite.in",
    brand: "Handcrafted Elite", niche: "Jewellery",
    city: "Chennai", state: "Tamil Nadu", plan: "pro", status: "inactive",
    joinedAt: "2025-02-20", lastActiveAt: "2026-03-15",
    shopifyStore: "handcraftedelite.myshopify.com",
    monthlySales: [28000, 31000, 0, 0, 0, 0],
    totalRevenue: 59000, totalOrders: 38,
  },
  {
    id: "u007", name: "Vikram Singh", email: "vikram@gourmetbox.in",
    brand: "GourmetBox", niche: "Food & Beverage",
    city: "Pune", state: "Maharashtra", plan: "agency", status: "active",
    joinedAt: "2024-10-01", lastActiveAt: "2026-05-18",
    shopifyStore: "gourmetbox.myshopify.com",
    monthlySales: [95000, 108000, 122000, 115000, 134000, 148000],
    totalRevenue: 722000, totalOrders: 534,
  },
  {
    id: "u008", name: "Aisha Khan", email: "aisha@zestgadgets.in",
    brand: "Zest Gadgets", niche: "Electronics",
    city: "Hyderabad", state: "Telangana", plan: "free", status: "active",
    joinedAt: "2026-04-01", lastActiveAt: "2026-05-14",
    shopifyStore: "zestgadgets.myshopify.com",
    monthlySales: [0, 0, 0, 0, 21000, 28000],
    totalRevenue: 49000, totalOrders: 31,
  },
];

const DEFAULT_PLANS: AdminPlan[] = [
  {
    id: "free", name: "Free", price: 0, color: "#A1A1AA",
    features: ["1 platform connect", "30-day data only", "Basic Shopify reports", "No AI insights", "No CSV export"],
  },
  {
    id: "pro", name: "Pro", price: 2999, color: "#F97316",
    features: ["All platforms (Shopify + Meta + Google)", "Full data history", "AI insights & funnel diagnosis", "CSV export", "Goal tracking & P&L"],
  },
  {
    id: "agency", name: "Agency", price: 7999, color: "#8B5CF6",
    features: ["Everything in Pro", "Unlimited brand profiles", "Team access (coming soon)", "Priority support", "White-label (coming soon)"],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function PlanBadge({ plan }: { plan: AdminUser["plan"] }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold",
      plan === "agency" ? "bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#1E1240] dark:text-[#A78BFA]" :
      plan === "pro" ? "bg-[#FFF7ED] text-[#EA580C] dark:bg-[#2A1A0E] dark:text-[#FB923C]" :
      "bg-[#F5F5F4] text-[#71717A] dark:bg-[#1C1C1C]"
    )}>{plan}</span>
  );
}

// ── Password Gate ──────────────────────────────────────────────────────────────

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
            <div className="text-[16px] font-bold dark:text-[#F4F4F5]">Admin Panel</div>
            <div className="text-[12px] text-[#A1A1AA]">Skylitee · Owner access only</div>
          </div>
        </div>
        <label className="text-[12px] font-semibold dark:text-[#F4F4F5] block mb-1">Admin Password</label>
        <div className="relative mb-3">
          <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            type={show ? "text" : "password"}
            value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onLogin()}
            placeholder="Enter admin password"
            className={cn(
              "w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border rounded-xl pl-9 pr-10 py-2.5 text-[13px] dark:text-[#F4F4F5] outline-none transition-all",
              error ? "border-[#EF4444] ring-1 ring-[#EF4444]/30" : "border-black/[0.06] dark:border-white/[0.06] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30"
            )}
          />
          <button onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        {error && <div className="text-[11px] text-[#EF4444] mb-2">Incorrect password.</div>}
        <button onClick={onLogin}
          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl py-2.5 text-[13px] font-bold transition-colors">
          Enter Admin Panel
        </button>
        <div className="mt-4 text-center text-[11px] text-[#A1A1AA]">Authorised access only. All actions are logged.</div>
      </div>
    </div>
  );
}

// ── User Modal ─────────────────────────────────────────────────────────────────

function UserModal({ user, onSave, onClose }: {
  user: AdminUser | null; onSave: (u: AdminUser) => void; onClose: () => void;
}) {
  const blank: AdminUser = {
    id: `u${Date.now()}`, name: "", email: "", brand: "", niche: "Print-on-Demand",
    city: "", state: "", plan: "free", status: "active",
    joinedAt: new Date().toISOString().split("T")[0],
    lastActiveAt: new Date().toISOString().split("T")[0],
    shopifyStore: "", monthlySales: [0, 0, 0, 0, 0, 0],
    totalRevenue: 0, totalOrders: 0,
  };
  const [form, setForm] = useState<AdminUser>(user ?? blank);
  const set = (k: keyof AdminUser, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg border border-black/[0.06] dark:border-white/[0.06] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#171717] px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
          <div className="text-[15px] font-bold dark:text-[#F4F4F5]">{user ? "Edit User" : "Add New User"}</div>
          <button onClick={onClose}><X size={16} className="text-[#A1A1AA]" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([["Full name", "name"], ["Email", "email"], ["Brand name", "brand"], ["Shopify store", "shopifyStore"], ["City", "city"], ["State", "state"]] as [string, keyof AdminUser][]).map(([label, key]) => (
              <div key={key}>
                <label className="text-[11px] font-semibold text-[#A1A1AA] block mb-0.5 uppercase tracking-wide">{label}</label>
                <input value={String(form[key])} onChange={e => set(key, e.target.value)}
                  className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["Niche", "niche", ["Print-on-Demand","Apparel & Fashion","Beauty & Skincare","Home Decor","Jewellery","Food & Beverage","Electronics","Stationery","Other"]],
              ["Plan", "plan", ["free","pro","agency"]],
              ["Status", "status", ["active","inactive"]],
            ].map(([label, key, opts]) => (
              <div key={key as string}>
                <label className="text-[11px] font-semibold text-[#A1A1AA] block mb-0.5 uppercase tracking-wide">{label as string}</label>
                <select value={String(form[key as keyof AdminUser])} onChange={e => set(key as keyof AdminUser, e.target.value)}
                  className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] appearance-none">
                  {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-[#71717A] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">Cancel</button>
            <button onClick={() => onSave(form)} className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-[13px] font-bold transition-colors">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type AdminTab = "overview" | "users" | "analytics" | "plans";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans] = useState<AdminPlan[]>(DEFAULT_PLANS);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("skylitee-admin-auth") === "1") setAuthed(true);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      setUsers(p.users ?? SEED_USERS);
    } else {
      setUsers(SEED_USERS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ users: SEED_USERS }));
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify({ users }));
  }, [users]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const doLogin = () => {
    if (pin === ADMIN_PIN) { sessionStorage.setItem("skylitee-admin-auth", "1"); setAuthed(true); }
    else { setPinError(true); setTimeout(() => setPinError(false), 2000); }
  };

  const saveUser = (u: AdminUser) => {
    setUsers(prev => prev.find(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [...prev, u]);
    setShowModal(false); setEditUser(null);
    showToast("User saved.");
  };

  const deleteUser = (id: string) => {
    if (!confirm("Delete this user permanently?")) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast("User deleted.");
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
    showToast("Status updated.");
  };

  const loginAs = (u: AdminUser) => {
    localStorage.setItem("skylitee-impersonate", JSON.stringify({ id: u.id, name: u.name, brand: u.brand }));
    router.push("/dashboard");
  };

  const lockAdmin = () => {
    sessionStorage.removeItem("skylitee-admin-auth");
    setAuthed(false);
  };

  if (!authed) return <PasswordGate pin={pin} setPin={setPin} onLogin={doLogin} error={pinError} />;

  // ── Computed ──
  const totalRevenue = users.reduce((s, u) => s + u.totalRevenue, 0);
  const totalOrders = users.reduce((s, u) => s + u.totalOrders, 0);
  const activeUsers = users.filter(u => u.status === "active").length;

  const monthlyTotals = MONTHS.map((month, i) => ({
    month,
    revenue: users.reduce((s, u) => s + (u.monthlySales[i] ?? 0), 0),
  }));

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (!search || u.name.toLowerCase().includes(q) || u.brand.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (filterPlan === "all" || u.plan === filterPlan)
      && (filterStatus === "all" || u.status === filterStatus);
  });

  const cityMap: Record<string, { revenue: number; users: number }> = {};
  users.forEach(u => {
    if (!cityMap[u.city]) cityMap[u.city] = { revenue: 0, users: 0 };
    cityMap[u.city].revenue += u.totalRevenue;
    cityMap[u.city].users += 1;
  });
  const cityData = Object.entries(cityMap).sort((a, b) => b[1].revenue - a[1].revenue);

  const nicheMap: Record<string, { revenue: number; users: number }> = {};
  users.forEach(u => {
    if (!nicheMap[u.niche]) nicheMap[u.niche] = { revenue: 0, users: 0 };
    nicheMap[u.niche].revenue += u.totalRevenue;
    nicheMap[u.niche].users += 1;
  });
  const nicheData = Object.entries(nicheMap).sort((a, b) => b[1].revenue - a[1].revenue);

  const planCounts = { free: 0, pro: 0, agency: 0 };
  users.forEach(u => planCounts[u.plan]++);

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "users", label: `Users (${users.length})`, icon: Users },
    { key: "analytics", label: "Analytics", icon: BarChart2 },
    { key: "plans", label: "Plans", icon: CreditCard },
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
            <p className="text-[11px] text-[#A1A1AA]">Skylitee platform management · Owner only</p>
          </div>
        </div>
        <button onClick={lockAdmin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-[#71717A] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.06] hover:bg-[#F5F5F4] dark:hover:bg-[#1C1C1C] transition-colors">
          <Lock size={11} /> Lock Admin
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: users.length, sub: `${activeUsers} active`, color: "text-[#F97316]" },
          { label: "Active Users", value: activeUsers, sub: `${users.length - activeUsers} inactive`, color: "text-[#22C55E]" },
          { label: "Platform Revenue", value: fmt(totalRevenue), sub: "all brands combined", color: "text-[#F97316]" },
          { label: "Total Orders", value: totalOrders.toLocaleString("en-IN"), sub: "across all brands", color: "dark:text-[#F4F4F5]" },
        ].map(k => (
          <Card key={k.label}>
            <div className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wide">{k.label}</div>
            <div className={cn("text-[24px] font-black mt-1", k.color)}>{k.value}</div>
            <div className="text-[11px] text-[#A1A1AA] mt-0.5">{k.sub}</div>
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
                "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors",
                tab === t.key ? "border-[#F97316] text-[#F97316]" : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
              )}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader title="Platform Revenue — Dec 2025 to May 2026" right="All brands combined" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTotals} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" strokeOpacity={0.4} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <RTooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E5E5E5" }}
                    formatter={(v) => [fmt(Number(v)), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader title="Plan Distribution" />
              <div className="space-y-3 mt-2">
                {plans.map(p => {
                  const count = planCounts[p.id as keyof typeof planCounts] ?? 0;
                  const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold dark:text-[#F4F4F5]">{p.name}</span>
                        <span className="text-[11px] text-[#A1A1AA]">{count} users · {p.price ? `₹${p.price.toLocaleString("en-IN")}/mo` : "Free"}</span>
                      </div>
                      <div className="w-full h-2 bg-[#F5F5F4] dark:bg-[#262626] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Top 5 brands */}
          <Card>
            <CardHeader title="Top 5 Brands by Revenue" right="All time" />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-[13px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["#", "Brand", "Owner", "Niche", "City", "Plan", "Revenue", "Orders", "Status"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5).map((u, i) => (
                    <tr key={u.id} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                      <td className="py-2.5 pr-4 text-[#A1A1AA] font-bold text-[12px]">#{i + 1}</td>
                      <td className="py-2.5 pr-4 font-semibold dark:text-[#F4F4F5]">{u.brand}</td>
                      <td className="py-2.5 pr-4 text-[#71717A] dark:text-[#A1A1AA]">{u.name}</td>
                      <td className="py-2.5 pr-4 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{u.niche}</td>
                      <td className="py-2.5 pr-4 text-[#71717A] dark:text-[#A1A1AA]">{u.city}</td>
                      <td className="py-2.5 pr-4"><PlanBadge plan={u.plan} /></td>
                      <td className="py-2.5 pr-4 font-bold text-[#F97316]">{fmt(u.totalRevenue)}</td>
                      <td className="py-2.5 pr-4 dark:text-[#F4F4F5]">{u.totalOrders}</td>
                      <td className="py-2.5">
                        <span className={cn("flex items-center gap-1 text-[11px] font-semibold",
                          u.status === "active" ? "text-[#22C55E]" : "text-[#EF4444]")}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", u.status === "active" ? "bg-[#22C55E]" : "bg-[#EF4444]")} />
                          {u.status}
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
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, brand, or email…"
                className="w-full bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none focus:border-[#F97316]" />
            </div>
            <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
              className="bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none appearance-none">
              <option value="all">All plans</option><option value="free">Free</option>
              <option value="pro">Pro</option><option value="agency">Agency</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-[#171717] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] dark:text-[#F4F4F5] outline-none appearance-none">
              <option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <button onClick={() => { setEditUser(null); setShowModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-[13px] font-bold transition-colors whitespace-nowrap">
              <Plus size={13} /> Add User
            </button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[750px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["Brand / Owner", "Niche", "Location", "Plan", "Revenue", "Orders", "Last Active", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2.5 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={cn("border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#FAFAF9] dark:hover:bg-[#1C1C1C] transition-colors", u.status === "inactive" && "opacity-60")}>
                      <td className="py-3 pr-4">
                        <div className="font-semibold dark:text-[#F4F4F5] leading-tight">{u.brand}</div>
                        <div className="text-[11px] text-[#A1A1AA] truncate max-w-[160px]">{u.name} · {u.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap text-[12px]">{u.niche}</td>
                      <td className="py-3 pr-4 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap text-[12px]">{u.city}, {u.state}</td>
                      <td className="py-3 pr-4"><PlanBadge plan={u.plan} /></td>
                      <td className="py-3 pr-4 font-bold text-[#F97316]">{fmt(u.totalRevenue)}</td>
                      <td className="py-3 pr-4 dark:text-[#F4F4F5]">{u.totalOrders}</td>
                      <td className="py-3 pr-4 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap text-[12px]">{daysSince(u.lastActiveAt)}d ago</td>
                      <td className="py-3 pr-4">
                        <button onClick={() => toggleStatus(u.id)}
                          title={u.status === "active" ? "Click to deactivate" : "Click to activate"}
                          className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full cursor-pointer transition-colors",
                            u.status === "active"
                              ? "bg-[#F0FDF4] text-[#22C55E] dark:bg-[#052E16] hover:bg-[#DCFCE7]"
                              : "bg-[#FEF2F2] text-[#EF4444] dark:bg-[#2D0A0A] hover:bg-[#FEE2E2]"
                          )}>
                          {u.status === "active" ? <UserCheck size={10} /> : <UserX size={10} />}
                          {u.status}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => { setEditUser(u); setShowModal(true); }} title="Edit user"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#71717A] hover:bg-[#F5F5F4] dark:hover:bg-[#262626] transition-colors">
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => loginAs(u)} title="Login as this user (impersonate)"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#3B82F6] hover:bg-[#EFF6FF] dark:hover:bg-[#0D1E3D] transition-colors">
                            <LogIn size={11} />
                          </button>
                          <button onClick={() => deleteUser(u.id)} title="Delete user"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#2D0A0A] transition-colors">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-[13px] text-[#A1A1AA]">No users found</td></tr>
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
          {/* Monthly per brand */}
          <Card>
            <CardHeader title="Monthly Revenue per Brand" right="Dec 2025 – May 2026" />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-[13px] min-w-[620px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    <th className="text-left text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2 pr-4">Brand</th>
                    {MONTHS.map(m => (
                      <th key={m} className="text-right text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2 pr-3 whitespace-nowrap">{m}</th>
                    ))}
                    <th className="text-right text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => b.totalRevenue - a.totalRevenue).map(u => (
                    <tr key={u.id} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                      <td className="py-2.5 pr-4">
                        <div className="font-semibold dark:text-[#F4F4F5]">{u.brand}</div>
                        <div className="text-[11px] text-[#A1A1AA]">{u.niche}</div>
                      </td>
                      {u.monthlySales.map((v, i) => (
                        <td key={i} className={cn("py-2.5 pr-3 text-right text-[12px]", v > 0 ? "dark:text-[#F4F4F5]" : "text-[#D4D4D4] dark:text-[#404040]")}>
                          {v > 0 ? fmt(v) : "—"}
                        </td>
                      ))}
                      <td className="py-2.5 text-right font-bold text-[#F97316]">{fmt(u.totalRevenue)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black/[0.08] dark:border-white/[0.08] bg-[#FAFAF9] dark:bg-[#1C1C1C]">
                    <td className="py-2.5 pr-4 font-bold dark:text-[#F4F4F5]">Platform Total</td>
                    {monthlyTotals.map((m, i) => (
                      <td key={i} className="py-2.5 pr-3 text-right font-bold dark:text-[#F4F4F5]">{fmt(m.revenue)}</td>
                    ))}
                    <td className="py-2.5 text-right font-bold text-[#F97316]">{fmt(totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* City + Niche breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Revenue by City" />
              <div className="space-y-2 mt-2">
                {cityData.map(([city, d]) => {
                  const pct = Math.round((d.revenue / totalRevenue) * 100);
                  return (
                    <div key={city}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div>
                          <span className="text-[13px] font-semibold dark:text-[#F4F4F5]">{city}</span>
                          <span className="text-[11px] text-[#A1A1AA] ml-2">{d.users} brand{d.users > 1 ? "s" : ""}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-[#F97316]">{fmt(d.revenue)}</span>
                          <span className="text-[11px] text-[#A1A1AA] ml-1">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[#F5F5F4] dark:bg-[#262626] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader title="Revenue by Brand Niche" />
              <div className="space-y-2 mt-2">
                {nicheData.map(([niche, d]) => {
                  const pct = Math.round((d.revenue / totalRevenue) * 100);
                  return (
                    <div key={niche}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div>
                          <span className="text-[13px] font-semibold dark:text-[#F4F4F5]">{niche}</span>
                          <span className="text-[11px] text-[#A1A1AA] ml-2">{d.users} brand{d.users > 1 ? "s" : ""}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-[#F97316]">{fmt(d.revenue)}</span>
                          <span className="text-[11px] text-[#A1A1AA] ml-1">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[#F5F5F4] dark:bg-[#262626] rounded-full overflow-hidden">
                        <div className="h-full bg-[#8B5CF6] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Full user-wise table */}
          <Card>
            <CardHeader title="User-wise Performance" right="Sorted by revenue" />
            <div className="overflow-x-auto mt-1">
              <table className="w-full text-[13px] min-w-[700px]">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    {["#", "Brand", "Owner", "Niche", "City", "Plan", "Total Revenue", "Orders", "Avg Order", "Status"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wide py-2 pr-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => b.totalRevenue - a.totalRevenue).map((u, i) => (
                    <tr key={u.id} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                      <td className="py-2.5 pr-4 text-[#A1A1AA] font-bold">{i + 1}</td>
                      <td className="py-2.5 pr-4 font-semibold dark:text-[#F4F4F5]">{u.brand}</td>
                      <td className="py-2.5 pr-4 text-[#71717A] dark:text-[#A1A1AA]">{u.name}</td>
                      <td className="py-2.5 pr-4 text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">{u.niche}</td>
                      <td className="py-2.5 pr-4 text-[#71717A] dark:text-[#A1A1AA]">{u.city}</td>
                      <td className="py-2.5 pr-4"><PlanBadge plan={u.plan} /></td>
                      <td className="py-2.5 pr-4 font-bold text-[#F97316]">{fmt(u.totalRevenue)}</td>
                      <td className="py-2.5 pr-4 dark:text-[#F4F4F5]">{u.totalOrders}</td>
                      <td className="py-2.5 pr-4 dark:text-[#F4F4F5]">{u.totalOrders ? fmt(Math.round(u.totalRevenue / u.totalOrders)) : "—"}</td>
                      <td className="py-2.5">
                        <span className={cn("text-[11px] font-bold", u.status === "active" ? "text-[#22C55E]" : "text-[#EF4444]")}>{u.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── PLANS ── */}
      {tab === "plans" && (
        <div className="space-y-4">
          <div className="bg-[#EFF6FF] dark:bg-[#0D1E3D] border border-[#93C5FD]/30 rounded-xl p-3 text-[12px] text-[#1E40AF] dark:text-[#93C5FD]">
            <span className="font-bold">Plan management.</span> Full enforcement requires the billing system. Currently all connected users access all features regardless of plan tier.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const count = planCounts[p.id as keyof typeof planCounts] ?? 0;
              const pct = users.length ? Math.round((count / users.length) * 100) : 0;
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[17px] font-black" style={{ color: p.color }}>{p.name}</div>
                      <div className="text-[12px] text-[#A1A1AA]">{count} user{count !== 1 ? "s" : ""} · {pct}% share</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-black dark:text-[#F4F4F5]">
                        {p.price === 0 ? "Free" : `₹${p.price.toLocaleString("en-IN")}`}
                      </div>
                      {p.price > 0 && <div className="text-[11px] text-[#A1A1AA]">per month</div>}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#F5F5F4] dark:bg-[#262626] rounded-full mb-3 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[12px] text-[#52525B] dark:text-[#A1A1AA]">
                        <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: p.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader title="Revenue contribution per plan" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {plans.map(p => {
                const planUsers = users.filter(u => u.plan === p.id);
                const rev = planUsers.reduce((s, u) => s + u.totalRevenue, 0);
                const ord = planUsers.reduce((s, u) => s + u.totalOrders, 0);
                return (
                  <div key={p.id} className="rounded-xl p-4 border border-black/[0.06] dark:border-white/[0.06]">
                    <div className="text-[12px] font-bold mb-1" style={{ color: p.color }}>{p.name}</div>
                    <div className="text-[22px] font-black dark:text-[#F4F4F5]">{fmt(rev)}</div>
                    <div className="text-[11px] text-[#A1A1AA] mt-0.5">{ord} orders · {planUsers.length} brands</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {showModal && <UserModal user={editUser} onSave={saveUser} onClose={() => { setShowModal(false); setEditUser(null); }} />}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] px-3.5 py-2 rounded-xl text-[13px] font-semibold z-50 shadow-xl">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
