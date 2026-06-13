"use client";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Tooltip({ children, content, side = "right", maxWidth = 220 }: {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  maxWidth?: number;
}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const compute = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    if (side === "right")  setPos({ top: r.top + r.height / 2, left: r.right + 8 });
    if (side === "left")   setPos({ top: r.top + r.height / 2, left: r.left - 8 });
    if (side === "top")    setPos({ top: r.top - 8,            left: r.left + r.width / 2 });
    if (side === "bottom") setPos({ top: r.bottom + 8,         left: r.left + r.width / 2 });
  };

  const tooltip = show && typeof document !== "undefined"
    ? createPortal(
        <span
          className={cn(
            "fixed z-[9999] bg-[#18181B] text-white text-[13px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none leading-relaxed",
            side === "right"  && "-translate-y-1/2",
            side === "left"   && "-translate-y-1/2 -translate-x-full",
            side === "top"    && "-translate-x-1/2 -translate-y-full",
            side === "bottom" && "-translate-x-1/2",
          )}
          style={{ top: pos.top, left: pos.left, maxWidth, width: maxWidth }}
        >
          {content}
        </span>,
        document.body
      )
    : null;

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => { compute(); setShow(true); }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {tooltip}
    </span>
  );
}
