"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Store, ShieldCheck, RefreshCw } from "lucide-react";
import { SkyLiteeLogo } from "@/components/ui/skylitee-logo";

interface UserRow {
  name: string;
  email: string;
  shops: string[];
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) { setError("Admin access only."); setLoading(false); return; }
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalShops = users.reduce((s, u) => s + u.shops.length, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SkyLiteeLogo size={32} />
            <div>
              <div className="text-[18px] font-black text-white">Admin Dashboard</div>
              <div className="text-[12px] text-white/40">Sky Litee · Internal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[13px] text-white/60 hover:text-white transition-colors">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => router.push("/dashboard")} className="px-3 py-2 bg-[#F97316] text-white rounded-lg text-[13px] font-semibold hover:bg-[#EA580C] transition-colors">
              Dashboard →
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] px-4 py-3 rounded-xl text-[14px] mb-6 flex items-center gap-2">
            <ShieldCheck size={16} /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: total, icon: Users },
            { label: "Connected Stores", value: totalShops, icon: Store },
            { label: "Admin Access", value: "Active", icon: ShieldCheck },
          ].map(s => (
            <div key={s.label} className="bg-[#111111] border border-white/[0.08] rounded-2xl p-5">
              <s.icon size={16} className="text-[#F97316] mb-3" />
              <div className="text-[28px] font-black text-white">{s.value}</div>
              <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white">All Users</h2>
            <span className="text-[13px] text-white/40">{total} total</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-white/40 text-[14px]">Loading...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-[14px]">No users yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Name", "Email", "Connected Stores", "Signed Up"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.email} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === users.length - 1 ? "border-0" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-[14px] font-semibold text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-white/60">{u.email}</td>
                      <td className="px-5 py-3.5">
                        {u.shops.length === 0 ? (
                          <span className="text-[12px] text-white/30">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {u.shops.map(s => (
                              <span key={s} className="px-2 py-0.5 bg-[#F97316]/10 text-[#FB923C] text-[11px] font-semibold rounded-full border border-[#F97316]/20">
                                {s.replace(".myshopify.com", "")}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-white/40">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
