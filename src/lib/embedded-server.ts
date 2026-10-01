import { kv } from "@vercel/kv";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./auth";
import { shopKv } from "./kv";
import { isEmbeddedSessionToken, isValidShopDomain, shopAdminAppUrl } from "./embedded";

// Server-only helpers for Skylitee inside the Shopify admin (see lib/embedded.ts).
//
// Meta/Google login and Shopify's billing page can't load inside the admin iframe, so those
// flows run top-level and then return the merchant to the admin. Top-level there's no session,
// so the store travels in a SIGNED short-lived cookie (never in the user's website session —
// that would log a website user out of their own account), and the page to reopen is parked
// in KV for the embedded landing route (/embedded) to pick up.

export function isEmbeddedRequest(req: NextRequest): boolean {
  return isEmbeddedSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

// Set by /api/auth when OAuth was started from inside the admin (read by the OAuth callback).
export const INSTALL_FROM_ADMIN_COOKIE = "skylitee_install_from_admin";

// ── Where to land when the app reopens inside the admin ────────────────────────────────────
const returnKey = (shop: string) => `shop:${shop}:embedded_return`;

export async function setEmbeddedReturn(shop: string, path: string): Promise<void> {
  try { await kv.set(returnKey(shop), path, { ex: 15 * 60 }); } catch { /* best-effort */ }
}

export async function takeEmbeddedReturn(shop: string): Promise<string | null> {
  try { return await kv.getdel<string>(returnKey(shop)); } catch { return null; }
}

// Finish a top-level flow: park `path` and send the merchant back into the admin.
export async function backToAdmin(shop: string, path: string): Promise<NextResponse> {
  await setEmbeddedReturn(shop, path);
  const res = NextResponse.redirect(shopAdminAppUrl(shop));
  res.cookies.delete(EMBEDDED_OAUTH_COOKIE);
  return res;
}

// ── Signed "this OAuth started inside the admin for <shop>" cookie ─────────────────────────
export const EMBEDDED_OAUTH_COOKIE = "skylitee_embedded_oauth";
const OAUTH_TTL_S = 15 * 60;

function sign(payload: string): string {
  return crypto.createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET ?? "")
    .update(`embedded-oauth:${payload}`).digest("hex");
}

export function setEmbeddedOAuthCookie(res: NextResponse, shop: string) {
  const payload = `${shop}|${Date.now() + OAUTH_TTL_S * 1000}`;
  res.cookies.set(EMBEDDED_OAUTH_COOKIE, `${payload}|${sign(payload)}`, {
    httpOnly: true, secure: true, maxAge: OAUTH_TTL_S, sameSite: "lax", path: "/",
  });
}

// The store an admin-started OAuth is for — checked BEFORE the website session, so a browser
// also logged into the website can't save the tokens to its other active store.
export async function getEmbeddedOAuthShop(req: NextRequest): Promise<string | null> {
  const parts = req.cookies.get(EMBEDDED_OAUTH_COOKIE)?.value?.split("|");
  if (parts?.length !== 3) return null;
  const [shop, exp, sig] = parts;
  const expected = sign(`${shop}|${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Date.now() > Number(exp) || !isValidShopDomain(shop)) return null;
  return (await shopKv.getTokenRecord(shop)) ? shop : null;
}

// ── One-time handoff: iframe (session token) → top-level tab (signed cookie) ───────────────
// Only these top-level flows may be started through a handoff (no open redirect).
const HANDOFF_TARGETS = ["/api/auth/meta", "/api/auth/google"];

export function isHandoffTarget(next: string): boolean {
  return HANDOFF_TARGETS.some(p => next === p || next.startsWith(`${p}?`));
}

export async function createHandoff(shop: string, next: string): Promise<string> {
  const code = crypto.randomBytes(24).toString("hex");
  await kv.set(`embedded:handoff:${code}`, { shop, next }, { ex: 120 });
  return code;
}

export async function takeHandoff(code: string): Promise<{ shop: string; next: string } | null> {
  if (!/^[a-f0-9]{48}$/.test(code)) return null;
  try { return await kv.getdel<{ shop: string; next: string }>(`embedded:handoff:${code}`); } catch { return null; }
}
