import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getSession, getUser, SESSION_COOKIE } from "@/lib/auth";

export interface UserProfile {
  brandName: string;
  niche: string;
  businessType: string;
  phone: string;
  country: string;
  city: string;
  updatedAt: string;
}

async function kvGet<T>(key: string): Promise<T | null> {
  try { return await kv.get<T>(key); } catch { return null; }
}
async function kvSet(key: string, value: unknown): Promise<void> {
  try { await kv.set(key, value); } catch { /* KV not configured */ }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await kvGet<UserProfile>(`user:${session.email}:profile`);
  return NextResponse.json({ profile: profile ?? null });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await getUser(session.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as Partial<UserProfile>;
  const existing = await kvGet<UserProfile>(`user:${session.email}:profile`) ?? {} as UserProfile;

  const updated: UserProfile = {
    brandName:    body.brandName    ?? existing.brandName    ?? "",
    niche:        body.niche        ?? existing.niche        ?? "",
    businessType: body.businessType ?? existing.businessType ?? "",
    phone:        body.phone        ?? existing.phone        ?? "",
    country:      body.country      ?? existing.country      ?? "",
    city:         body.city         ?? existing.city         ?? "",
    updatedAt:    new Date().toISOString(),
  };

  await kvSet(`user:${session.email}:profile`, updated);
  return NextResponse.json({ ok: true });
}
