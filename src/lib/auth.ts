import { kv } from "@vercel/kv";
import crypto from "crypto";
import { EMBEDDED_SESSION_PREFIX, isEmbeddedSessionToken, verifyShopifySessionToken } from "./embedded";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserRecord {
  name: string;
  email: string;
  passwordHash: string;
  shops: string[];
  createdAt: string;
  disabled?: boolean;
}

export interface SessionRecord {
  email: string;
  activeShop: string;
  createdAt: string;
  embedded?: boolean;   // inside the Shopify admin (session token, see lib/embedded.ts)
}

// ── Password helpers (PBKDF2 — no extra deps) ────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;   // passwordless (embedded) account
  const [salt, hash] = stored.split(":");
  const attempt = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha256").toString("hex");
  return attempt === hash;
}

// ── KV helpers ───────────────────────────────────────────────────────────────

async function kvGet<T>(key: string): Promise<T | null> {
  try { return await kv.get<T>(key); } catch { return null; }
}
async function kvSet(key: string, value: unknown, ex?: number): Promise<void> {
  try {
    if (ex) await kv.set(key, value, { ex });
    else await kv.set(key, value);
  } catch { /* KV not configured */ }
}
async function kvDel(key: string): Promise<void> {
  try { await kv.del(key); } catch { /* KV not configured */ }
}

// ── User helpers ─────────────────────────────────────────────────────────────

export async function getUser(email: string): Promise<UserRecord | null> {
  return kvGet<UserRecord>(`user:${email.toLowerCase()}`);
}

export async function createUser(name: string, email: string, password: string): Promise<UserRecord> {
  const user: UserRecord = {
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    shops: [],
    createdAt: new Date().toISOString(),
  };
  await kvSet(`user:${user.email}`, user);
  // Add to global users index for admin listing
  try { await kv.sadd("users:index", user.email); } catch { /* KV not configured */ }
  return user;
}

export async function updateUser(user: UserRecord): Promise<void> {
  await kvSet(`user:${user.email}`, user);
}

export async function getAllUserEmails(): Promise<string[]> {
  try { return (await kv.smembers("users:index")) as string[]; } catch { return []; }
}

export async function addShopToUser(email: string, shop: string): Promise<void> {
  const user = await getUser(email);
  if (!user) return;
  if (!user.shops.includes(shop)) {
    user.shops.push(shop);
    await kvSet(`user:${user.email}`, user);
  }
}

export async function removeShopFromUser(email: string, shop: string): Promise<void> {
  const user = await getUser(email);
  if (!user) return;
  user.shops = user.shops.filter(s => s !== shop);
  await kvSet(`user:${user.email}`, user);
}

// ── Session helpers ───────────────────────────────────────────────────────────

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days

export async function createSession(email: string, activeShop: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const session: SessionRecord = { email, activeShop, createdAt: new Date().toISOString() };
  await kvSet(`session:${token}`, session, SESSION_TTL);
  return token;
}

export async function getSession(token: string): Promise<SessionRecord | null> {
  if (isEmbeddedSessionToken(token)) return getEmbeddedSession(token);
  return kvGet<SessionRecord>(`session:${token}`);
}

// ── Embedded (inside Shopify admin) sessions ─────────────────────────────────
// A verified Shopify session token acts as a per-store account that can see ONLY that store —
// never the owner's personal account, so Shopify staff can't reach the owner's other stores.
// It has no password: login / signup / password reset all refuse embedded emails.

const EMBEDDED_EMAIL_PREFIX = "embedded:";
export const embeddedEmail = (shop: string) => `${EMBEDDED_EMAIL_PREFIX}${shop}`;
export const isEmbeddedEmail = (email: string) => email.toLowerCase().startsWith(EMBEDDED_EMAIL_PREFIX);

async function ensureEmbeddedUser(shop: string): Promise<boolean> {
  const email = embeddedEmail(shop);
  const user = await getUser(email);
  if (user) return !user.passwordHash && user.shops.length === 1 && user.shops[0] === shop;
  await kvSet(`user:${email}`, {
    name: shop.replace(".myshopify.com", ""), email, passwordHash: "", shops: [shop],
    createdAt: new Date().toISOString(),
  } satisfies UserRecord);
  try { await kv.sadd("users:index", email); } catch { /* KV not configured */ }
  return true;
}

async function getEmbeddedSession(token: string): Promise<SessionRecord | null> {
  const claims = await verifyShopifySessionToken(token.slice(EMBEDDED_SESSION_PREFIX.length));
  if (!claims || !(await ensureEmbeddedUser(claims.shop))) return null;
  return { email: embeddedEmail(claims.shop), activeShop: claims.shop, createdAt: new Date().toISOString(), embedded: true };
}

export async function updateSessionShop(token: string, activeShop: string): Promise<void> {
  if (isEmbeddedSessionToken(token)) return;   // locked to its store
  const session = await getSession(token);
  if (!session) return;
  session.activeShop = activeShop;
  await kvSet(`session:${token}`, session, SESSION_TTL);
}

export async function deleteSession(token: string): Promise<void> {
  await kvDel(`session:${token}`);
}

// ── Password reset helpers ────────────────────────────────────────────────────

const RESET_TTL = 60 * 60; // 1 hour

export async function createResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await kvSet(`reset:${token}`, email.toLowerCase(), RESET_TTL);
  return token;
}

export async function getResetTokenEmail(token: string): Promise<string | null> {
  return kvGet<string>(`reset:${token}`);
}

export async function deleteResetToken(token: string): Promise<void> {
  await kvDel(`reset:${token}`);
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "skylitee_session";
export const SESSION_MAX_AGE = SESSION_TTL;
export const ADMIN_EMAIL = "rrzala@yellowsky.in";
