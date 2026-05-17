import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DateRangeProvider } from "@/lib/date-range-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DateRangeProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-[#f1f0ed] overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </DateRangeProvider>
  );
}
