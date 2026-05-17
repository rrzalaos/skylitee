"use client";
import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Dashboard error:", error); }, [error]);

  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-5">
        <div className="text-[13px] font-bold text-[#DC2626] mb-2">Dashboard crashed — error details:</div>
        <pre className="text-[11px] text-[#991B1B] whitespace-pre-wrap break-all bg-white rounded-xl p-3 border border-[#FCA5A5] max-h-64 overflow-auto">
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
        <button onClick={reset} className="mt-3 px-4 py-2 bg-[#F97316] text-white rounded-xl text-[13px] font-semibold">
          Try again
        </button>
      </div>
    </div>
  );
}
