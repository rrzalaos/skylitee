"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DateRangeProvider } from "@/lib/date-range-context";
import { Eye, X } from "lucide-react";

interface ImpersonateData { id: string; name: string; brand: string; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [impersonate, setImpersonate] = useState<ImpersonateData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("skylitee-impersonate");
    if (raw) setImpersonate(JSON.parse(raw));
  }, []);

  const exitImpersonate = () => {
    localStorage.removeItem("skylitee-impersonate");
    setImpersonate(null);
    router.push("/dashboard/admin");
  };

  return (
    <DateRangeProvider>
      <div className="flex h-screen overflow-hidden bg-[#F5F5F4] dark:bg-[#0C0C0C]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(v => !v)} />

          {/* Admin impersonation banner */}
          {impersonate && (
            <div className="bg-[#1877F2] text-white text-[12px] font-semibold px-4 py-2 flex items-center gap-2 shrink-0 flex-wrap">
              <Eye size={13} className="shrink-0" />
              <span>
                Admin view — <strong>{impersonate.brand}</strong> ({impersonate.name}).
                Data shown is your own connected store.
              </span>
              <button onClick={exitImpersonate}
                className="ml-auto flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors">
                <X size={10} /> Exit Admin View
              </button>
            </div>
          )}

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4">
            {children}
          </main>
        </div>
      </div>
    </DateRangeProvider>
  );
}
