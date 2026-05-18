"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ children, content, side = "right", maxWidth = 200 }: {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  maxWidth?: number;
}) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={cn(
            "absolute z-[200] bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none leading-relaxed",
            side === "right" && "left-full ml-2.5 top-1/2 -translate-y-1/2",
            side === "left" && "right-full mr-2.5 top-1/2 -translate-y-1/2",
            side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
            side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
          )}
          style={{ width: maxWidth }}
        >
          {content}
          <span className={cn(
            "absolute border-[5px] border-transparent",
            side === "right" && "right-full top-1/2 -translate-y-1/2 border-r-[#18181B] dark:border-r-[#F4F4F5]",
            side === "left" && "left-full top-1/2 -translate-y-1/2 border-l-[#18181B] dark:border-l-[#F4F4F5]",
            side === "top" && "top-full left-1/2 -translate-x-1/2 border-t-[#18181B] dark:border-t-[#F4F4F5]",
            side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 border-b-[#18181B] dark:border-b-[#F4F4F5]",
          )} />
        </span>
      )}
    </span>
  );
}
