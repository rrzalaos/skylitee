"use client";

import { useEffect } from "react";
import { goExternal, isEmbedded, needsHandoff } from "@/lib/embedded-client";

// Inside the Shopify admin, plain "Connect Meta/Google" links would load the login page in the
// iframe (blocked). Catch them and run the handoff instead. No-op on the website.
export default function EmbeddedBridge() {
  useEffect(() => {
    if (!isEmbedded()) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const path = url.pathname + url.search;
      if (!needsHandoff(path)) return;
      e.preventDefault();
      e.stopPropagation();
      goExternal(path);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
