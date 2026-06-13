"use client";
import { useState, useRef, useEffect } from "react";
import { FileDown, ChevronDown, Loader2 } from "lucide-react";

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportPDF: () => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ onExportCSV, onExportPDF, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handlePDF() {
    setOpen(false);
    setPdfLoading(true);
    try { await onExportPDF(); } finally { setPdfLoading(false); }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && !pdfLoading && setOpen(o => !o)}
        disabled={disabled || pdfLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#171717] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-[14px] font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:border-[#F97316] hover:text-[#F97316] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pdfLoading
          ? <Loader2 size={12} className="animate-spin" />
          : <FileDown size={12} />
        }
        Export <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#1C1C1C] border border-black/[0.08] dark:border-white/[0.08] rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="w-full text-left px-3.5 py-2.5 text-[14px] font-medium text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F5F4] dark:hover:bg-[#262626] transition-colors"
          >
            CSV (.csv)
          </button>
          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />
          <button
            onClick={handlePDF}
            className="w-full text-left px-3.5 py-2.5 text-[14px] font-medium text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F5F4] dark:hover:bg-[#262626] transition-colors"
          >
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
