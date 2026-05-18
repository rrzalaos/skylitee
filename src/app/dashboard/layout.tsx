"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DateRangeProvider } from "@/lib/date-range-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DateRangeProvider>
      <div className="flex h-screen overflow-hidden bg-[#F5F5F4] dark:bg-[#0C0C0C]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(v => !v)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4">
            {children}
          </main>
        </div>
      </div>
    </DateRangeProvider>
  );
}
