// Browser helpers for Skylitee running inside the Shopify admin iframe.

export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.top !== window.self; } catch { return true; }
}

// Open a page in the whole browser tab (App Bridge routes "_top" out of the admin iframe).
export function openTop(url: string) {
  if (isEmbedded()) window.open(url, "_top");
  else window.location.href = url;
}

const HANDOFF_PREFIXES = ["/api/auth/meta", "/api/auth/google"];
export const needsHandoff = (url: string) => HANDOFF_PREFIXES.some(p => url === p || url.startsWith(`${p}?`));

// Meta/Google login can't run inside the iframe and the top-level tab has no session, so the
// server issues a one-time link that carries the store across. Outside the admin: plain nav.
export async function goExternal(url: string) {
  if (!isEmbedded()) { window.location.href = url; return; }
  if (!needsHandoff(url)) { openTop(url); return; }
  try {
    const res = await fetch("/api/embedded/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ next: url }),
    });
    const data = await res.json() as { url?: string };
    if (data.url) { window.open(data.url, "_top"); return; }
  } catch { /* fall through */ }
  alert("Couldn't start the connection. Please reload the app and try again.");
}
