import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// House style: plain hyphens, never em dashes - applied to AI-written text before it reaches the UI
export function plainDashes(s: string) {
  return s.replace(/ — /g, " - ").replace(/—/g, "-");
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatPercent(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}
