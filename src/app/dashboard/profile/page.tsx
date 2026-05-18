"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  User, Building2, Users, CheckCircle2, Lock,
  Camera, Shield, Eye, Edit3, Crown, ChevronRight, Info,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  // Personal
  fullName: string; username: string; email: string; mobile: string;
  city: string; bio: string; photoUrl: string;
  // Brand
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

// ── Completion calc ──────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof ProfileData)[] = [
  "fullName", "email", "mobile", "city", "photoUrl",
  "brandName", "productCategory", "businessType",
  "targetGender", "targetAgeRange", "monthlyRevenueRange", "website",
];

function calcCompletion(d: ProfileData) {
  const filled = REQUIRED_FIELDS.filter(k => d[k] && (d[k] as string).trim().length > 0).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, hint, value, onChange, type = "text", placeholder = "" }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">{label}</label>
      {hint && <div className="text-[11px] text-[#A1A1AA] mb-1">{hint}</div>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition-all"
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
      <label className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">{label}</label>
      {hint && <div className="text-[11px] text-[#A1A1AA] mb-1">{hint}</div>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-[#18181B] dark:text-[#F4F4F5] outline-none focus:border-[#F97316] transition-all appearance-none"
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

// ── Role definitions ─────────────────────────────────────────────────────────

const ROLES = [
  {
    role: "Owner",
    icon: Crown,
    color: "text-[#F97316]",
    bg: "bg-[#FFF7ED] dark:bg-[#2A1A0E]",
    permissions: ["Full access to all data", "Manage connections", "Invite/remove team members", "Billing & settings"],
  },
  {
    role: "Admin",
    icon: Shield,
    color: "text-[#3B82F6]",
    bg: "bg-[#EFF6FF] dark:bg-[#0D1E3D]",
    permissions: ["All data access", "Manage connections", "Cannot change billing", "Cannot remove owner"],
  },
  {
    role: "Marketing",
    icon: Edit3,
    color: "text-[#8B5CF6]",
    bg: "bg-[#F5F3FF] dark:bg-[#1E1240]",
    permissions: ["Meta, GA4, GSC data", "Can view all reports", "Cannot change connections", "No billing access"],
  },
  {
    role: "View Only",
    icon: Eye,
    color: "text-[#71717A]",
    bg: "bg-[#F5F5F4] dark:bg-[#1C1C1C]",
    permissions: ["Read-only dashboard", "No data export", "No settings access", "No connection changes"],
  },
];

type Tab = "profile" | "brand" | "team";

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const set = (k: keyof ProfileData) => (v: string) => setData(d => ({ ...d, [k]: v }));

  const saveProfile = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const completion = calcCompletion(data);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "My Account", icon: User },
    { key: "brand", label: "Brand Details", icon: Building2 },
    { key: "team", label: "Team & Access", icon: Users },
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold dark:text-[#F4F4F5]">Profile & Account</h2>
          <p className="text-[13px] text-[#A1A1AA] mt-0.5">Your account details, brand info, and team access</p>
        </div>
        {/* Completion */}
        <div className="flex items-center gap-2 bg-[#F5F5F4] dark:bg-[#1C1C1C] rounded-xl px-3 py-2">
          <div className="w-20 h-1.5 bg-[#E5E5E5] dark:bg-[#262626] rounded-full overflow-hidden">
            <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${completion}%` }} />
          </div>
          <span className="text-[12px] font-bold text-[#F97316]">{completion}%</span>
          <span className="text-[11px] text-[#A1A1AA]">complete</span>
        </div>
      </div>

      {/* Completion nudge */}
      {completion < 80 && (
        <div className="flex items-start gap-2 bg-[#FFF7ED] dark:bg-[#2A1A0E] border border-[#F97316]/20 rounded-xl p-3 mb-4">
          <Info size={13} className="text-[#F97316] shrink-0 mt-0.5" />
          <div className="text-[12px] text-[#EA580C] dark:text-[#FB923C]">
            <span className="font-bold">Complete your profile for smarter AI insights.</span>
            {" "}The more we know about your brand, audience, and goals — the better our recommendations. You&apos;re {completion}% done.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-black/[0.06] dark:border-white/[0.06] mb-4">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors",
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
          {/* Photo + name row */}
          <Card>
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar photoUrl={data.photoUrl} name={data.fullName || "User"} size={72} />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#F97316] rounded-full flex items-center justify-center border-2 border-white dark:border-[#171717]">
                  <Camera size={10} className="text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold dark:text-[#F4F4F5]">{data.fullName || "Your Name"}</div>
                <div className="text-[12px] text-[#A1A1AA]">{data.email || "your@email.com"}</div>
                <div className="text-[12px] text-[#A1A1AA] mt-0.5">{data.city || "City"}</div>
              </div>
            </div>
            <div className="mt-3">
              <Field
                label="Profile photo URL"
                hint="Paste a link to your photo (e.g. from Google Photos, LinkedIn, etc.)"
                value={data.photoUrl} onChange={set("photoUrl")}
                placeholder="https://..."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Personal Information" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Full name" value={data.fullName} onChange={set("fullName")} placeholder="Rishi Zala" />
              <Field label="Username" value={data.username} onChange={set("username")} placeholder="rishi_z" />
              <Field label="Email address" type="email" value={data.email} onChange={set("email")} placeholder="you@yourbrand.com" />
              <Field label="Mobile number" type="tel" value={data.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" />
              <Field label="City" value={data.city} onChange={set("city")} placeholder="Ahmedabad" />
              <div className="col-span-2">
                <label className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">Short bio</label>
                <textarea
                  value={data.bio} onChange={e => set("bio")(e.target.value)}
                  rows={2} placeholder="D2C brand founder · print-on-demand · Ahmedabad"
                  className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] resize-none"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={<span className="flex items-center gap-1.5"><Lock size={13} className="text-[#A1A1AA]" /> Password & Security</span>}
              right={<span className="text-[11px] bg-[#F5F5F4] dark:bg-[#1C1C1C] px-2 py-0.5 rounded-full text-[#A1A1AA]">Auth required</span>}
            />
            <div className="text-[12px] text-[#71717A] mb-3">
              Password management is available once account-based authentication is enabled. Your dashboard currently uses Shopify&apos;s secure token — no separate password is needed yet.
            </div>
            <div className="grid grid-cols-3 gap-3 opacity-50 pointer-events-none">
              {["Current password", "New password", "Confirm new password"].map((label, i) => (
                <div key={i}>
                  <label className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-1">{label}</label>
                  <input type="password" disabled placeholder="••••••••"
                    className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] rounded-xl px-3 py-2 text-[13px] placeholder-[#A1A1AA]" />
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-[#A1A1AA] flex items-center gap-1.5">
              <Info size={11} />
              Forgot password &amp; reset will be available with the login system — coming soon.
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <button onClick={saveProfile}
              className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[13px] font-bold hover:bg-[#EA580C] transition-colors">
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
            <div className="text-[12px] text-[#1E40AF] dark:text-[#93C5FD]">
              <span className="font-bold">These details power your AI recommendations.</span>
              {" "}When we know your product category, audience, and revenue scale — the AI gives you industry-specific benchmarks instead of generic advice. Fill as much as you can.
            </div>
          </div>

          <Card>
            <CardHeader title="Brand Identity" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Brand name" value={data.brandName} onChange={set("brandName")} placeholder="Rrahi Print Shop" />
              <Field label="Tagline / slogan" value={data.tagline} onChange={set("tagline")} placeholder="Print your story" />
              <Select
                label="Main product category"
                hint="What do you primarily sell?"
                value={data.productCategory} onChange={set("productCategory")}
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
              <Select
                label="Business type"
                value={data.businessType} onChange={set("businessType")}
                options={[
                  { value: "d2c", label: "D2C Brand (own brand, own products)" },
                  { value: "agency", label: "Agency / Freelancer (managing client brands)" },
                  { value: "dropshipping", label: "Dropshipping" },
                  { value: "reseller", label: "Reseller / Wholesale" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Field
                label="Brand logo URL"
                hint="Link to your brand logo image"
                value={data.brandLogoUrl} onChange={set("brandLogoUrl")}
                placeholder="https://..."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Target Audience" right="Helps AI benchmark against your niche" />
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Select
                label="Target gender"
                value={data.targetGender} onChange={set("targetGender")}
                options={[
                  { value: "men", label: "Men" },
                  { value: "women", label: "Women" },
                  { value: "both", label: "Both / Unisex" },
                  { value: "kids", label: "Kids" },
                ]}
              />
              <Select
                label="Primary age group"
                value={data.targetAgeRange} onChange={set("targetAgeRange")}
                options={[
                  { value: "13_17", label: "13–17 (Teens)" },
                  { value: "18_24", label: "18–24 (Young adults)" },
                  { value: "25_34", label: "25–34 (Millennials)" },
                  { value: "35_44", label: "35–44" },
                  { value: "45_plus", label: "45+ (Older adults)" },
                ]}
              />
              <Select
                label="Monthly revenue range"
                hint="Helps benchmark your scale"
                value={data.monthlyRevenueRange} onChange={set("monthlyRevenueRange")}
                options={[
                  { value: "lt_1l", label: "Below ₹1 Lakh" },
                  { value: "1l_5l", label: "₹1L – ₹5L" },
                  { value: "5l_20l", label: "₹5L – ₹20L" },
                  { value: "20l_50l", label: "₹20L – ₹50L" },
                  { value: "50l_plus", label: "Above ₹50L" },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Business & Contact Details" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Field label="Website URL" value={data.website} onChange={set("website")} placeholder="https://yourbrand.com" />
              <Field label="Instagram handle" value={data.instagram} onChange={set("instagram")} placeholder="@yourbrand" />
              <Field label="Facebook page URL" value={data.facebook} onChange={set("facebook")} placeholder="facebook.com/yourbrand" />
              <Field label="GST number" hint="Optional — for GST-inclusive P&L" value={data.gstNumber} onChange={set("gstNumber")} placeholder="22AAAAA0000A1Z5" />
              <div className="col-span-2">
                <label className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5] block mb-0.5">Business address</label>
                <textarea
                  value={data.address} onChange={e => set("address")(e.target.value)}
                  rows={2} placeholder="123, Business Park, Ahmedabad - 380001, Gujarat"
                  className="w-full bg-[#F5F5F4] dark:bg-[#1C1C1C] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-3 py-2 text-[13px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none focus:border-[#F97316] resize-none"
                />
              </div>
            </div>
          </Card>

          {/* What's filled */}
          <Card>
            <CardHeader title="Profile completeness" right={`${completion}% done`} />
            <div className="w-full h-2 bg-[#F5F5F4] dark:bg-[#262626] rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-[#F97316] rounded-full transition-all" style={{ width: `${completion}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {REQUIRED_FIELDS.map(k => {
                const filled = data[k] && (data[k] as string).trim().length > 0;
                const labels: Record<string, string> = {
                  fullName: "Full name", email: "Email", mobile: "Mobile", city: "City",
                  photoUrl: "Profile photo", brandName: "Brand name", productCategory: "Product category",
                  businessType: "Business type", targetGender: "Target gender", targetAgeRange: "Target age",
                  monthlyRevenueRange: "Revenue range", website: "Website",
                };
                return (
                  <div key={k} className="flex items-center gap-1.5 text-[12px]">
                    <CheckCircle2 size={12} className={filled ? "text-[#22C55E]" : "text-[#E5E5E5] dark:text-[#333]"} />
                    <span className={filled ? "text-[#18181B] dark:text-[#F4F4F5]" : "text-[#A1A1AA]"}>{labels[k]}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <button onClick={saveProfile}
              className="px-5 py-2.5 bg-[#F97316] text-white rounded-xl text-[13px] font-bold hover:bg-[#EA580C] transition-colors">
              {saved ? "✓ Saved!" : "Save Brand Details"}
            </button>
          </div>
        </div>
      )}

      {/* ── TEAM TAB ────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="space-y-4">
          {/* Current user */}
          <Card>
            <CardHeader title="Team Members" right="1 member" />
            <div className="flex items-center justify-between py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Avatar photoUrl={data.photoUrl} name={data.fullName || "Owner"} size={40} />
                <div>
                  <div className="text-[13px] font-semibold dark:text-[#F4F4F5]">{data.fullName || "Account Owner"}</div>
                  <div className="text-[11px] text-[#A1A1AA]">{data.email || "—"} · {data.mobile || "—"}</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold bg-[#FFF7ED] dark:bg-[#2A1A0E] text-[#EA580C] dark:text-[#FB923C] px-2.5 py-1 rounded-full">
                <Crown size={10} /> Owner
              </span>
            </div>
            <div className="pt-3">
              <div className="flex items-center gap-2 text-[12px] text-[#A1A1AA] mb-3">
                <Info size={12} />
                Multi-user login and invite system is on our roadmap. Once enabled, you can invite team members by email and set their access level.
              </div>
              <button disabled
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5F5F4] dark:bg-[#1C1C1C] text-[#A1A1AA] text-[13px] font-semibold cursor-not-allowed w-full justify-center border border-dashed border-[#D4D4D4] dark:border-[#333]">
                <Users size={14} /> + Invite team member
                <span className="text-[11px] bg-[#E5E5E5] dark:bg-[#262626] px-1.5 py-0.5 rounded-full ml-1">Coming soon</span>
              </button>
            </div>
          </Card>

          {/* Role definitions */}
          <Card>
            <CardHeader title="Access Levels" right="How roles work" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              {ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.role} className={cn("rounded-xl p-3 border border-black/[0.06] dark:border-white/[0.06]", r.bg)}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon size={13} className={r.color} />
                      <span className={cn("text-[12px] font-bold", r.color)}>{r.role}</span>
                    </div>
                    <ul className="space-y-1">
                      {r.permissions.map((p, i) => (
                        <li key={i} className="flex items-start gap-1 text-[11px] text-[#52525B] dark:text-[#A1A1AA]">
                          <ChevronRight size={10} className="shrink-0 mt-0.5" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* What team access unlocks */}
          <Card>
            <CardHeader title="Why add team members?" />
            <div className="space-y-2 mt-1">
              {[
                { icon: "👩‍💼", text: "Give your performance marketing agency View-only or Marketing access — they can see data but can't change your connections or billing." },
                { icon: "📊", text: "Add a business partner as Admin — they get full data access but you stay as the controlling Owner." },
                { icon: "🔒", text: "Your Shopify token and Meta credentials stay protected — team members access through Skylitee, not your accounts directly." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-[#52525B] dark:text-[#A1A1AA] py-2 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
