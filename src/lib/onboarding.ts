import { kv } from "@vercel/kv";
import crypto from "crypto";
import type { NextResponse } from "next/server";
import { addShopToUser } from "@/lib/auth";
import { shopKv } from "@/lib/kv";

// New-merchant onboarding (/welcome): 3 questions → Store X-Ray → locked Meta/Google cards.
// Only stores Skylitee has NEVER seen before get status "pending" (set in the Shopify OAuth
// callback). Stores that existed before this flow have no record → never redirected here.

export type Goal = "sales" | "ad_cost" | "profit";
export type AdsChannel = "meta" | "google" | "both" | "none";
export type RevenueBand = "lt_1l" | "1_10l" | "gt_10l";

export interface OnboardingAnswers { goal: Goal; ads: AdsChannel; revenue: RevenueBand }

export interface OnboardingState {
  status: "pending" | "done";
  createdAt: string;
  answers?: OnboardingAnswers;
  answeredAt?: string;
  completedAt?: string;
}

const key = (shop: string) => `shop:${shop}:onboarding`;

export async function getOnboarding(shop: string): Promise<OnboardingState | null> {
  try { return await kv.get<OnboardingState>(key(shop)); } catch { return null; }
}

export async function setOnboarding(shop: string, v: OnboardingState): Promise<void> {
  try { await kv.set(key(shop), v); } catch { /* best-effort */ }
}

export async function startOnboarding(shop: string): Promise<void> {
  await setOnboarding(shop, { status: "pending", createdAt: new Date().toISOString() });
}

export async function isOnboardingPending(shop: string): Promise<boolean> {
  return (await getOnboarding(shop))?.status === "pending";
}

// ── Pending install cookie ──────────────────────────────────────────────────────────────
// An App Store install can finish OAuth before the merchant has a Skylitee session. We hand
// the browser a SIGNED, short-lived cookie naming the shop; signup/login then links that shop
// to the account. Signed so nobody can claim a store by hand-crafting a cookie.

export const PENDING_INSTALL_COOKIE = "skylitee_pending_install";
const PENDING_TTL_S = 24 * 60 * 60;

function sign(payload: string): string {
  return crypto.createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET ?? "")
    .update(`pending-install:${payload}`).digest("hex");
}

export function makePendingInstall(shop: string): string {
  const payload = `${shop}|${Date.now() + PENDING_TTL_S * 1000}`;
  return `${payload}|${sign(payload)}`;
}

export function readPendingInstall(value: string | undefined): string | null {
  if (!value) return null;
  const parts = value.split("|");
  if (parts.length !== 3) return null;
  const [shop, exp, sig] = parts;
  const expected = sign(`${shop}|${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Date.now() > Number(exp)) return null;
  return shop;
}

export function setPendingInstallCookie(res: NextResponse, shop: string) {
  res.cookies.set(PENDING_INSTALL_COOKIE, makePendingInstall(shop), {
    httpOnly: true, maxAge: PENDING_TTL_S, sameSite: "lax", path: "/",
  });
}

// Link a signed pending install to a freshly signed-up / logged-in account. Returns the shop
// that was linked (caller makes it the active shop), or null if there was nothing valid.
export async function claimPendingInstall(cookieValue: string | undefined, email: string): Promise<string | null> {
  const shop = readPendingInstall(cookieValue);
  if (!shop) return null;
  if (!(await shopKv.getTokenRecord(shop))) return null;   // uninstalled since
  // A store already owned by another account is joined via a team invite, never by cookie.
  const owner = await shopKv.getOwner(shop);
  if (owner && owner !== email) return null;
  await addShopToUser(email, shop);
  if (!owner) {
    await Promise.all([
      shopKv.setOwner(shop, email),
      shopKv.getConnectedAt(shop).then(c => c ? undefined : shopKv.setConnectedAt(shop, new Date().toISOString())),
    ]);
  }
  return shop;
}
