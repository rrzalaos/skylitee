import { NextRequest, NextResponse } from "next/server";
import { getUser, createUser, createSession, SESSION_COOKIE, SESSION_MAX_AGE, ADMIN_EMAIL } from "@/lib/auth";
import { inviteKv } from "@/lib/kv";
import { claimPendingInstall, isOnboardingPending, PENDING_INSTALL_COOKIE } from "@/lib/onboarding";

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
  // Came from an App Store install? Link that store now so they skip "connect your store".
  const claimedShop = await claimPendingInstall(req.cookies.get(PENDING_INSTALL_COOKIE)?.value, user.email);
  const token = await createSession(user.email, claimedShop ?? "");

  const isAdmin = user.email === ADMIN_EMAIL;
  const hasInvites = ((await inviteKv.getInvites(user.email)) ?? []).length > 0;
  const next = claimedShop
    ? (await isOnboardingPending(claimedShop) ? "/welcome" : "/dashboard")
    : null;
  const res = NextResponse.json({ ok: true, isAdmin, hasInvites, next });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  if (claimedShop) {
    res.cookies.set("shopify_shop", claimedShop, { httpOnly: true, maxAge: SESSION_MAX_AGE, sameSite: "lax", path: "/" });
    res.cookies.delete(PENDING_INSTALL_COOKIE);
  }
  return res;
}
