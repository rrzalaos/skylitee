"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  User, Building2, Users, CheckCircle2, Lock,
  Camera, Shield, Eye, Edit3, Crown, ChevronRight, Info, Activity, Clock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  fullName: string; username: string; email: string; mobile: string;
  city: string; bio: string; photoUrl: string;
  brandName: string; brandLogoUrl: string; tagline: string;
  productCategory: string; businessType: string;
  targetGender: string; targetAgeRange: string;
  monthlyRevenueRange: string; gstNumber: string; address: string;
  website: string; instagram: string; facebook: string;
}

const EMPTY: ProfileData = {
  fullName: "", username: "", email: "", mobile: "",
  city: "", bio: "", photoUrl: "",
  brandName: "", brandLogoUrl: "", tagline: "",
  productCategory: "", businessType: "",
  targetGender: "", targetAgeRange: "",
  monthlyRevenueRange: "", gstNumber: "", address: "",
  website: "", instagram: "", facebook: "",
};

const STORAGE_KEY = "skylitee-profile";

const REQUIRED_FIELDS: (keyof ProfileData)[] = [
  "fullName", "email", "mobile", "city", "photoUrl",
  "brandName", "productCategory", "businessType",
  "targetGender", "targetAgeRange", "monthlyRevenueRange", "website",
];

function calcCompletion(d: ProfileData) {
  const filled = REQUIRED_FIELDS.filter(k => d[k] && (d[k] as string).trim().length > 0).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

function Field({ label, hint, value, onChange, type = "text", placeholder = "", readOnly = false }: {
  label: string; hint?: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">{label}</label>
      {hint && <div className="text-[13px] text-[#A1A1AA] mb-1">{hint}</div>}
      <input
        type={type} value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          "w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none transition-all",
          readOnly ? "cursor-not-allowed text-[#A1A1AA]" : "focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30"
        )}
      />
    </div>
  );
}

function Select({ label, hint, value, onChange, options }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">{label}</label>
      {hint && <div className="text-[13px] text-[#A1A1AA] mb-1">{hint}</div>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] transition-all appearance-none"
      >
        <option value="">— Select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Avatar({ photoUrl, name, size = 64 }: { photoUrl: string; name: string; size?: number }) {
  const initials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover border-2 border-[#F97316]/30" />
  ) : (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white font-black">
      <span style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}

const ROLES = [
  {
    role: "Owner", icon: Crown, color: "text-[#F97316]", bg: "bg-[#FFF7ED] dark:bg-[#2A1A0E]",
    permissions: ["Full access to all data", "Manage connections", "Invite/remove team members", "Billing & settings"],
  },
  {
    role: "Admin", icon: Shield, color: "text-[#3B82F6]", bg: "bg-[#EFF6FF] dark:bg-[#0D1E3D]",
    permissions: ["All data access", "Manage connections", "Cannot change billing", "Cannot remove owner"],
  },
  {
    role: "Marketing", icon: Edit3, color: "text-[#8B5CF6]", bg: "bg-[#F5F3FF] dark:bg-[#1E1240]",
    permissions: ["Meta, GA4, GSC data", "Can view all reports", "Cannot change connections", "No billing access"],
  },
  {
    role: "View Only", icon: Eye, color: "text-[#71717A]", bg: "bg-[#F5F5F4] dark:bg-[#1C1C1C]",
    permissions: ["Read-only dashboard", "No data export", "No settings access", "No connection changes"],
  },
];

type Tab = "profile" | "brand" | "team" | "logs";

interface TeamMember { email: string; role: string; addedAt: string; status?: "pending" | "active"; }
interface ActivityLog { id: string; type: string; userEmail: string; detail: string; createdAt: string; }

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  marketing: "Marketing",
  view_only: "View Only",
};
const ROLE_COLORS: Record<string, string> = {
  admin: "text-[#3B82F6] bg-[#EFF6FF] dark:bg-[#0D1E3D]",
  marketing: "text-[#8B5CF6] bg-[#F5F3FF] dark:bg-[#1E1240]",
  view_only: "text-[#71717A] bg-[#F5F5F4] dark:bg-[#1C1C1C]",
};

// ── Admin profile view ───────────────────────────────────────────────────────

function AdminProfile() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [mobile, setMobile]   = useState("");
  const [saved, setSaved]     = useState(false);

  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwError, setPwError]       = useState("");
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { setName(d.name || ""); setEmail(d.email || ""); })
      .catch(() => {});

    fetch("/api/profile")
      .then(r => r.json())
      .then(d => { if (d.profile?.phone) setMobile(d.profile.phone); })
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    await Promise.allSettled([
      fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }),
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = async () => {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }

    setPwLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    setPwLoading(false);

    if (res.ok && json.ok) {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3500);
    } else {
      setPwError(json.error || "Failed to change password.");
    }
  };

  const inputCls = "w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition-all";
  const labelCls = "text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5";

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-lg font-bold dark:text-[#F4F4F5]">My Profile</h2>
        <p className="text-[15px] text-[#A1A1AA] mt-0.5">Admin account settings</p>
      </div>

      <Card>
        <CardHeader title="Account Details" />
        <div className="space-y-3 mt-2">
          <div>
            <label className={labelCls}>Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email address</label>
            <input value={email} readOnly className={cn(inputCls, "cursor-not-allowed text-[#A1A1AA]")} />
          </div>
          <div>
            <label className={labelCls}>Mobile number</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} type="tel" placeholder="+91 98765 43210" className={inputCls} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={saveProfile}
            className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[15px] font-bold hover:bg-[#EA580C] transition-colors">
            {saved ? "✓ Saved!" : "Save"}
          </button>
        </div>
      </Card>

      <Card>
        <CardHeader title={<span className="flex items-center gap-1.5"><Lock size={13} className="text-[#A1A1AA]" /> Change Password</span>} />
        <div className="space-y-3 mt-2">
          <div>
            <label className={labelCls}>Current password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
              placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && changePassword()}
              placeholder="••••••••" className={inputCls} />
          </div>
          {pwError && <div className="text-[14px] text-[#EF4444]">{pwError}</div>}
          {pwSuccess && <div className="text-[14px] text-[#22C55E] font-semibold">✓ Password changed successfully!</div>}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={changePassword} disabled={pwLoading}
            className="px-5 py-2.5 bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] rounded-xl text-[15px] font-bold hover:opacity-80 transition-opacity disabled:opacity-50">
            {pwLoading ? "Saving…" : "Change Password"}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [isAdmin, setIsAdmin]   = useState<boolean | null>(null);
  const [data, setData]         = useState<ProfileData>(EMPTY);
  const [tab, setTab]           = useState<Tab>("profile");
  const [saved, setSaved]       = useState(false);

  const [meEmail, setMeEmail]       = useState("");
  const [meName, setMeName]         = useState("");
  const [teamMembers, setTeamMembers]   = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading]   = useState(false);
  const [addEmail, setAddEmail]         = useState("");
  const [addRole, setAddRole]           = useState("marketing");
  const [addError, setAddError]         = useState("");
  const [addLoading, setAddLoading]     = useState(false);
  const [logs, setLogs]                 = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading]   = useState(false);

  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwError, setPwError]       = useState("");
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);

  const changePassword = async () => {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setPwLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    setPwLoading(false);
    if (res.ok && json.ok) {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3500);
    } else {
      setPwError(json.error || "Failed to change password.");
    }
  };

  const pwInputCls = "w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition-all";

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        setIsAdmin(!!d.isAdmin);
        setMeEmail(d.email ?? "");
        setMeName(d.name ?? "");
      })
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (tab !== "team") return;
    setTeamLoading(true);
    fetch("/api/team")
      .then(r => r.json())
      .then(d => setTeamMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "logs") return;
    setLogsLoading(true);
    fetch("/api/activity")
      .then(r => r.json())
      .then(d => setLogs(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [tab]);

  const addMember = async () => {
    setAddError("");
    if (!addEmail.trim()) { setAddError("Enter an email address."); return; }
    setAddLoading(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
    });
    const json = await res.json() as { ok?: boolean; error?: string; member?: TeamMember };
    setAddLoading(false);
    if (res.ok && json.member) {
      setTeamMembers(prev => [...prev, json.member!]);
      setAddEmail("");
    } else {
      setAddError(json.error ?? "Failed to add member.");
    }
  };

  const removeMember = async (email: string) => {
    const res = await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setTeamMembers(prev => prev.filter(m => m.email !== email));
  };

  useEffect(() => {
    if (isAdmin) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, [isAdmin]);

  const set = (k: keyof ProfileData) => (v: string) => setData(d => ({ ...d, [k]: v }));

  const saveProfile = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName:    data.brandName,
          niche:        data.productCategory,
          businessType: data.businessType,
          phone:        data.mobile,
          country:      "",
          city:         data.city,
        }),
      });
    } catch { /* non-blocking */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isAdmin === null) return <div className="text-[15px] text-[#A1A1AA] p-4">Loading…</div>;
  if (isAdmin) return <AdminProfile />;

  const completion = calcCompletion(data);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "My Account",    icon: User      },
    { key: "brand",   label: "Brand Details", icon: Building2 },
    { key: "team",    label: "Team & Access", icon: Users     },
    { key: "logs",    label: "Activity Logs", icon: Activity  },
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold dark:text-[#F4F4F5]">Profile & Account</h2>
          <p className="text-[15px] text-[#A1A1AA] mt-0.5">Your account details, brand info, and team access</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl px-3 py-2">
          <div className="w-20 h-1.5 bg-[#E5E5E5] dark:bg-[#262626] rounded-full overflow-hidden">
            <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${completion}%` }} />
          </div>
          <span className="text-[14px] font-bold text-[#F97316]">{completion}%</span>
          <span className="text-[13px] text-[#A1A1AA]">complete</span>
        </div>
      </div>

      {completion < 80 && (
        <div className="flex items-start gap-2 bg-[#FFF7ED] dark:bg-[#2A1A0E] border border-[#F97316]/20 rounded-xl p-3 mb-4">
          <Info size={13} className="text-[#F97316] shrink-0 mt-0.5" />
          <div className="text-[14px] text-[#EA580C] dark:text-[#FB923C]">
            <span className="font-bold">Complete your profile for smarter AI insights.</span>
            {" "}The more we know about your brand, audience, and goals — the better our recommendations. You&apos;re {completion}% done.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-black/[0.06] dark:border-white/[0.06] mb-4">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-[15px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
                tab === t.key
                  ? "border-[#F97316] text-[#F97316]"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
              )}>
              <Icon size={13} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar photoUrl={data.photoUrl} name={data.fullName || "User"} size={72} />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#F97316] rounded-full flex items-center justify-center border-2 border-white dark:border-[#171717]">
                  <Camera size={10} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[17px] font-bold dark:text-[#F4F4F5]">{data.fullName || "Your Name"}</div>
                <div className="text-[14px] text-[#A1A1AA]">{data.email || "your@email.com"}</div>
                <div className="text-[14px] text-[#A1A1AA] mt-0.5">{data.city || "City"}</div>
              </div>
            </div>
            <div className="mt-3">
              <Field label="Profile photo URL" hint="Paste a link to your photo" value={data.photoUrl} onChange={set("photoUrl")} placeholder="https://..." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Personal Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <Field label="Full name" value={data.fullName} onChange={set("fullName")} placeholder="John Doe" />
              <Field label="Username" value={data.username} onChange={set("username")} placeholder="john_doe" />
              <Field label="Email address" type="email" value={data.email} onChange={set("email")} placeholder="you@yourbrand.com" />
              <Field label="Mobile number" type="tel" value={data.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" />
              <Field label="City" value={data.city} onChange={set("city")} placeholder="Ahmedabad" />
              <div className="col-span-2">
                <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">Short bio</label>
                <textarea
                  value={data.bio} onChange={e => set("bio")(e.target.value)}
                  rows={2} placeholder="D2C brand founder · print-on-demand · Ahmedabad"
                  className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] resize-none"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={<span className="flex items-center gap-1.5"><Lock size={13} className="text-[#A1A1AA]" /> Password & Security</span>} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div>
                <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-1">Current password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className={pwInputCls} />
              </div>
              <div>
                <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-1">New password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" className={pwInputCls} />
              </div>
              <div>
                <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-1">Confirm new password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && changePassword()} placeholder="••••••••" className={pwInputCls} />
              </div>
            </div>
            {pwError && <div className="text-[14px] text-[#EF4444] mt-2">{pwError}</div>}
            {pwSuccess && <div className="text-[14px] text-[#22C55E] font-semibold mt-2">✓ Password changed successfully!</div>}
            <div className="flex justify-end mt-4">
              <button onClick={changePassword} disabled={pwLoading}
                className="px-5 py-2.5 bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] rounded-xl text-[15px] font-bold hover:opacity-80 transition-opacity disabled:opacity-50">
                {pwLoading ? "Saving…" : "Change Password"}
              </button>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <button onClick={saveProfile}
              className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[15px] font-bold hover:bg-[#EA580C] transition-colors">
              {saved ? "✓ Saved!" : "Save Profile"}
            </button>
          </div>
        </div>
      )}

      {/* ── BRAND TAB ───────────────────────────────────────────────── */}
      {tab === "brand" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-[#EFF6FF] dark:bg-[#0D1E3D] border border-[#93C5FD]/30 rounded-xl p-3">
            <Info size={13} className="text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="text-[14px] text-[#1E40AF] dark:text-[#93C5FD]">
              <span className="font-bold">These details power your AI recommendations.</span>
              {" "}When we know your product category, audience, and revenue scale — the AI gives you industry-specific benchmarks.
            </div>
          </div>

          <Card>
            <CardHeader title="Brand Identity" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <Field label="Brand name" value={data.brandName} onChange={set("brandName")} placeholder="Acme Apparel" />
              <Field label="Tagline / slogan" value={data.tagline} onChange={set("tagline")} placeholder="Print your story" />
              <Select label="Main product category" hint="What do you primarily sell?" value={data.productCategory} onChange={set("productCategory")}
                options={[
                  { value: "print_on_demand", label: "Print-on-Demand (T-shirts, Hoodies, etc.)" },
                  { value: "apparel", label: "Apparel & Fashion" },
                  { value: "accessories", label: "Accessories & Bags" },
                  { value: "jewellery", label: "Jewellery" },
                  { value: "beauty", label: "Beauty & Skincare" },
                  { value: "home_decor", label: "Home Decor & Lifestyle" },
                  { value: "electronics", label: "Electronics & Gadgets" },
                  { value: "food_bev", label: "Food & Beverage" },
                  { value: "stationery", label: "Stationery & Art" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Select label="Business type" value={data.businessType} onChange={set("businessType")}
                options={[
                  { value: "d2c", label: "D2C Brand (own brand, own products)" },
                  { value: "agency", label: "Agency / Freelancer (managing client brands)" },
                  { value: "dropshipping", label: "Dropshipping" },
                  { value: "reseller", label: "Reseller / Wholesale" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Field label="Brand logo URL" hint="Link to your brand logo image" value={data.brandLogoUrl} onChange={set("brandLogoUrl")} placeholder="https://..." />
            </div>
          </Card>

          <Card>
            <CardHeader title="Target Audience" right="Helps AI benchmark against your niche" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <Select label="Target gender" value={data.targetGender} onChange={set("targetGender")}
                options={[
                  { value: "men", label: "Men" }, { value: "women", label: "Women" },
                  { value: "both", label: "Both / Unisex" }, { value: "kids", label: "Kids" },
                ]}
              />
              <Select label="Primary age group" value={data.targetAgeRange} onChange={set("targetAgeRange")}
                options={[
                  { value: "13_17", label: "13–17 (Teens)" }, { value: "18_24", label: "18–24 (Young adults)" },
                  { value: "25_34", label: "25–34 (Millennials)" }, { value: "35_44", label: "35–44" },
                  { value: "45_plus", label: "45+ (Older adults)" },
                ]}
              />
              <Select label="Monthly revenue range" hint="Helps benchmark your scale" value={data.monthlyRevenueRange} onChange={set("monthlyRevenueRange")}
                options={[
                  { value: "lt_1l", label: "Below ₹1 Lakh" }, { value: "1l_5l", label: "₹1L – ₹5L" },
                  { value: "5l_20l", label: "₹5L – ₹20L" }, { value: "20l_50l", label: "₹20L – ₹50L" },
                  { value: "50l_plus", label: "Above ₹50L" },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Business & Contact Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <Field label="Website URL" value={data.website} onChange={set("website")} placeholder="https://yourbrand.com" />
              <Field label="Instagram handle" value={data.instagram} onChange={set("instagram")} placeholder="@yourbrand" />
              <Field label="Facebook page URL" value={data.facebook} onChange={set("facebook")} placeholder="facebook.com/yourbrand" />
              <Field label="GST number" hint="Optional — for GST-inclusive P&L" value={data.gstNumber} onChange={set("gstNumber")} placeholder="22AAAAA0000A1Z5" />
              <div className="col-span-2">
                <label className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">Business address</label>
                <textarea
                  value={data.address} onChange={e => set("address")(e.target.value)}
                  rows={2} placeholder="123, Business Park, Ahmedabad - 380001, Gujarat"
                  className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] resize-none"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Profile completeness" right={`${completion}% done`} />
            <div className="w-full h-2 bg-[#F5F5F4] dark:bg-[#262626] rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${completion}%` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {REQUIRED_FIELDS.map(k => {
                const filled = data[k] && (data[k] as string).trim().length > 0;
                const labels: Record<string, string> = {
                  fullName: "Full name", email: "Email", mobile: "Mobile", city: "City",
                  photoUrl: "Profile photo", brandName: "Brand name", productCategory: "Product category",
                  businessType: "Business type", targetGender: "Target gender", targetAgeRange: "Target age",
                  monthlyRevenueRange: "Revenue range", website: "Website",
                };
                return (
                  <div key={k} className="flex items-center gap-1.5 text-[14px]">
                    <CheckCircle2 size={12} className={filled ? "text-[#22C55E]" : "text-[#E5E5E5] dark:text-[#333]"} />
                    <span className={filled ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#A1A1AA]"}>{labels[k]}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <button onClick={saveProfile}
              className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[15px] font-bold hover:bg-[#EA580C] transition-colors">
              {saved ? "✓ Saved!" : "Save Brand Details"}
            </button>
          </div>
        </div>
      )}

      {/* ── TEAM TAB ────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Team Members" right={`${1 + teamMembers.length} member${teamMembers.length ? "s" : ""}`} />

            {/* Owner row — always first */}
            <div className="flex items-center justify-between py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Avatar photoUrl={data.photoUrl} name={meName || "Owner"} size={40} />
                <div>
                  <div className="text-[15px] font-semibold dark:text-[#F4F4F5]">{meName || "Account Owner"} <span className="text-[13px] text-[#A1A1AA] font-normal">(you)</span></div>
                  <div className="text-[13px] text-[#A1A1AA]">{meEmail || "—"}</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[13px] font-bold bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C] dark:text-[#FB923C] px-2.5 py-1 rounded-full">
                <Crown size={10} /> Owner
              </span>
            </div>

            {/* Team members */}
            {teamLoading ? (
              <div className="py-4 text-center text-[14px] text-[#A1A1AA]">Loading…</div>
            ) : teamMembers.map(m => (
              <div key={m.email} className="flex items-center justify-between py-3 border-b border-black/[0.06] dark:border-white/[0.06] last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar photoUrl="" name={m.email} size={40} />
                  <div>
                    <div className="text-[15px] font-semibold dark:text-[#F4F4F5]">{m.email}</div>
                    <div className="text-[13px] text-[#A1A1AA]">Added {new Date(m.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(m.status ?? "active") === "pending" ? (
                    <span className="flex items-center gap-1 text-[12px] font-bold bg-[#FFFBEB] dark:bg-[#2D1C00] text-[#92400E] dark:text-[#FCD34D] px-2 py-0.5 rounded-full">
                      <Clock size={9} /> Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[12px] font-bold bg-[#F0FDF4] dark:bg-[#052E16] text-[#166534] dark:text-[#4ADE80] px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={9} /> Active
                    </span>
                  )}
                  <span className={cn("text-[13px] font-bold px-2.5 py-1 rounded-full", ROLE_COLORS[m.role] ?? ROLE_COLORS.view_only)}>
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                  <button
                    onClick={() => removeMember(m.email)}
                    className="text-[13px] text-[#EF4444] hover:text-[#DC2626] font-semibold px-2 py-1 rounded-lg hover:bg-[#FEF2F2] dark:hover:bg-[#2D0A0A] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Add member form */}
            <div className="pt-4 mt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="text-[14px] font-bold text-[#18181B] dark:text-[#F4F4F5] mb-2">Add Team Member</div>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addMember()}
                  placeholder="colleague@email.com"
                  className="flex-1 min-w-[180px] bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition-all"
                />
                <select value={addRole} onChange={e => setAddRole(e.target.value)}
                  className="bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[15px] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] appearance-none cursor-pointer">
                  <option value="admin">Admin</option>
                  <option value="marketing">Marketing</option>
                  <option value="view_only">View Only</option>
                </select>
                <button onClick={addMember} disabled={addLoading}
                  className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-[15px] font-bold hover:bg-[#EA580C] transition-colors disabled:opacity-50 whitespace-nowrap">
                  {addLoading ? "Adding…" : "+ Add"}
                </button>
              </div>
              {addError && <div className="text-[14px] text-[#EF4444] mt-2">{addError}</div>}
              <div className="text-[13px] text-[#A1A1AA] mt-2 flex items-start gap-1.5">
                <Info size={11} className="shrink-0 mt-0.5" />
                They will receive a notification and must accept before getting store access. Status shows Pending until accepted.
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Access Levels" right="How roles work" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.role} className={cn("rounded-xl p-3 border border-black/[0.06] dark:border-white/[0.06]", r.bg)}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon size={13} className={r.color} />
                      <span className={cn("text-[14px] font-bold", r.color)}>{r.role}</span>
                    </div>
                    <ul className="space-y-1">
                      {r.permissions.map((p, i) => (
                        <li key={i} className="flex items-start gap-1 text-[13px] text-[#52525B] dark:text-[#A1A1AA]">
                          <ChevronRight size={10} className="shrink-0 mt-0.5" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Why add team members?" />
            <div className="space-y-2 mt-1">
              {[
                { icon: "👩‍💼", text: "Give your performance marketing agency View-only or Marketing access — they can see data but can't change your connections or billing." },
                { icon: "📊", text: "Add a business partner as Admin — they get full data access but you stay as the controlling Owner." },
                { icon: "🔒", text: "Your Shopify token and Meta credentials stay protected — team members access through Skylitee, not your accounts directly." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[14px] text-[#52525B] dark:text-[#A1A1AA] py-2 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── LOGS TAB ────────────────────────────────────────────────── */}
      {tab === "logs" && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Activity Log" right={<span className="text-[13px] text-[#A1A1AA]">{logs.length} events</span>} />

            {logsLoading ? (
              <div className="py-6 text-center text-[14px] text-[#A1A1AA]">Loading…</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center">
                <Activity size={24} className="text-[#E5E5E5] dark:text-[#333] mx-auto mb-2" />
                <div className="text-[15px] text-[#A1A1AA]">No activity recorded yet</div>
                <div className="text-[13px] text-[#C4C4C0] mt-0.5">Logins, team changes and invite actions appear here</div>
              </div>
            ) : (
              <div className="mt-2">
                {logs.map(log => {
                  const dot: Record<string, string> = {
                    login: "bg-[#3B82F6]",
                    invite_accepted: "bg-[#22C55E]",
                    invite_declined: "bg-[#EF4444]",
                    member_invited: "bg-[#F97316]",
                    member_removed: "bg-[#EF4444]",
                  };
                  const label: Record<string, string> = {
                    login: "Login",
                    invite_accepted: "Accepted",
                    invite_declined: "Declined",
                    member_invited: "Invited",
                    member_removed: "Removed",
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot[log.type] ?? "bg-[#A1A1AA]"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded-full ${
                            log.type === "login" ? "bg-[#EFF6FF] dark:bg-[#0D1E3D] text-[#3B82F6]" :
                            log.type === "invite_accepted" ? "bg-[#F0FDF4] dark:bg-[#052E16] text-[#22C55E]" :
                            log.type === "invite_declined" || log.type === "member_removed" ? "bg-[#FEF2F2] dark:bg-[#2D0A0A] text-[#EF4444]" :
                            "bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#F97316]"
                          }`}>
                            {label[log.type] ?? log.type}
                          </span>
                          <span className="text-[14px] text-[#18181B] dark:text-[#F4F4F5] font-medium truncate">{log.detail}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[13px] text-[#A1A1AA]">{log.userEmail}</span>
                          <span className="text-[#E5E5E5] dark:text-[#333]">·</span>
                          <span className="text-[13px] text-[#A1A1AA]">
                            {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
