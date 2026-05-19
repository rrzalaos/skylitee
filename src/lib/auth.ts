import { kv } from "@vercel/kv";
import crypto from "crypto";

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
}

// ── Password helpers (PBKDF2 — no extra deps) ────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
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
  return kvGet<SessionRecord>(`session:${token}`);
}

export async function updateSessionShop(token: string, activeShop: string): Promise<void> {
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
