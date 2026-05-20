import { NextRequest, NextResponse } from "next/server";
import { getUser, createUser, addShopToUser, createSession, SESSION_COOKIE, SESSION_MAX_AGE, ADMIN_EMAIL } from "@/lib/auth";
import { teamKv } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await getUser(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await createUser(name, email, password);

  // Claim any pending team invites for this email
  const pending = await teamKv.getPending(user.email);
  if (pending?.length) {
    await Promise.allSettled(pending.map(p => addShopToUser(user.email, p.shop)));
    await teamKv.delPending(user.email);
  }

  const firstShop = pending?.[0]?.shop ?? "";
  const token = await createSession(user.email, firstShop);

  const isAdmin = user.email === ADMIN_EMAIL;
  const res = NextResponse.json({ ok: true, isAdmin });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
