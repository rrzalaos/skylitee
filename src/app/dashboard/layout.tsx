import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#f1f0ed] overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
