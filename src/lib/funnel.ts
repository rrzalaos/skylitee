import { kv } from "@vercel/kv";
import crypto from "crypto";
import { UNINSTALL_REASONS, type UninstallReason } from "@/lib/uninstall-reasons";

export { UNINSTALL_REASONS, type UninstallReason };

// Onboarding funnel — one Redis hash per shop (`funnel:{shop}`) recording WHEN each step
// first happened, plus an index set of every shop ever seen. Keyed by shop (not user) because
// an App Store install can happen before the merchant has a Skylitee account.
//
// Every writer here swallows errors: tracking must never break install, OAuth or billing.

export type FunnelMark = "installedAt" | "planAt" | "metaAt" | "googleAt";

export type FunnelRecord = {
  installedAt?: string;       // first successful Shopify OAuth
  reinstalledAt?: string;     // latest reinstall after an uninstall
  planAt?: string;            // first time a plan/trial/free grant became active
  metaAt?: string;            // first Meta connect
  googleAt?: string;          // first GSC / GA4 / Google Ads connect
  lastSeenDay?: string;       // YYYY-MM-DD of the latest dashboard visit
  activeDays?: number;        // distinct days the dashboard was opened
  returnedD7At?: string;      // first visit 7+ days after install
  uninstalledAt?: string;     // latest uninstall (cleared on reinstall)
  uninstallCount?: number;
  uninstallReason?: UninstallReason;
  uninstallNote?: string;
  uninstallEmailAt?: string;  // feedback email sent for the current uninstall
};

const key = (shop: string) => `funnel:${shop}`;
const INDEX = "funnel:index";
const DAY_MS = 86_400_000;

// Record a step the first time it happens (HSETNX — later calls are no-ops).
export async function markOnce(shop: string, field: FunnelMark): Promise<void> {
  try {
    await Promise.all([
      kv.hsetnx(key(shop), field, new Date().toISOString()),
      kv.sadd(INDEX, shop),
    ]);
  } catch { /* tracking is best-effort */ }
}

// Called after every successful Shopify OAuth. First install sets installedAt; an install
// after an uninstall is a reinstall — clear the uninstall state so the store counts as live.
export async function recordInstall(shop: string): Promise<void> {
  try {
    const rec = await getFunnel(shop);
    if (rec?.uninstalledAt) {
      await kv.hset(key(shop), { reinstalledAt: new Date().toISOString() });
      await kv.hdel(key(shop), "uninstalledAt", "uninstallEmailAt");
    }
    await markOnce(shop, "installedAt");
  } catch { /* best-effort */ }
}

export async function recordUninstall(shop: string): Promise<void> {
  try {
    await Promise.all([
      kv.hset(key(shop), { uninstalledAt: new Date().toISOString() }),
      kv.hincrby(key(shop), "uninstallCount", 1),
      kv.sadd(INDEX, shop),
    ]);
  } catch { /* best-effort */ }
}

// Claim the right to send the feedback email for this uninstall (true once per uninstall).
export async function claimUninstallEmail(shop: string): Promise<boolean> {
  try {
    return (await kv.hsetnx(key(shop), "uninstallEmailAt", new Date().toISOString())) === 1;
  } catch { return false; }
}

export async function recordUninstallReason(shop: string, reason: UninstallReason, note: string): Promise<void> {
  const fields: Record<string, string> = { uninstallReason: reason };
  if (note) fields.uninstallNote = note.slice(0, 500);
  try { await kv.hset(key(shop), fields); } catch { /* best-effort */ }
}

// Dashboard visit — at most one write per shop per day. Also flags "came back after day 7".
export async function touchSeen(shop: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const cur = await kv.hmget<{ lastSeenDay: string | null; installedAt: string | null }>(key(shop), "lastSeenDay", "installedAt");
    if (cur?.lastSeenDay === today) return;
    // Stores connected before funnel tracking have no installedAt — use their connect date.
    const since = cur?.installedAt ?? await kv.get<string>(`shop:${shop}:connected_at`);
    const ops: Promise<unknown>[] = [
      kv.hset(key(shop), { lastSeenDay: today }),
      kv.hincrby(key(shop), "activeDays", 1),
      kv.sadd(INDEX, shop),
    ];
    if (since && Date.now() - new Date(since).getTime() >= 7 * DAY_MS) {
      ops.push(kv.hsetnx(key(shop), "returnedD7At", new Date().toISOString()));
    }
    await Promise.all(ops);
  } catch { /* best-effort */ }
}

export async function getFunnel(shop: string): Promise<FunnelRecord | null> {
  try { return await kv.hgetall<FunnelRecord>(key(shop)); } catch { return null; }
}

export async function listFunnelShops(): Promise<string[]> {
  try { return (await kv.smembers(INDEX)) as string[]; } catch { return []; }
}

// Signed token for the uninstall-feedback link, so only the emailed merchant can answer
// for their shop.
export function feedbackSig(shop: string): string {
  return crypto.createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET ?? "")
    .update(`uninstall-feedback:${shop}`).digest("hex").slice(0, 32);
}

export function verifyFeedbackSig(shop: string, sig: string): boolean {
  const expected = feedbackSig(shop);
  try {
    return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return false; }
}
