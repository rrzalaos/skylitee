import { NextRequest, NextResponse } from "next/server";
import { getUser, verifyPassword, createSession, SESSION_COOKIE, SESSION_MAX_AGE, ADMIN_EMAIL } from "@/lib/auth";
import { activityKv, inviteKv } from "@/lib/kv";
import { claimPendingInstall, isOnboardingPending, PENDING_INSTALL_COOKIE } from "@/lib/onboarding";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await getUser(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (user.disabled) {
    return NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 });
  }

  // Came from an App Store install? Link that store and make it the active one.
  const claimedShop = await claimPendingInstall(req.cookies.get(PENDING_INSTALL_COOKIE)?.value, user.email);
  if (claimedShop && !user.shops.includes(claimedShop)) user.shops.push(claimedShop);
  const activeShop = claimedShop ?? user.shops[0] ?? "";
  const token = await createSession(user.email, activeShop);
  const next = activeShop && await isOnboardingPending(activeShop) ? "/welcome" : null;

  // Fire-and-forget login log
  activityKv.logUser(user.email, {
    type: "login",
    userEmail: user.email,
    detail: "Logged in",
  }).catch(() => {});

  const isAdmin = user.email === ADMIN_EMAIL;
  // Invited clients have no store of their own yet — send them to the dashboard
  // (where the invite bell lives) instead of the "connect your store" screen.
  const pendingInvites = user.shops.length === 0 ? (await inviteKv.getInvites(user.email) ?? []).length : 0;
  const res = NextResponse.json({ ok: true, hasShop: user.shops.length > 0 || pendingInvites > 0, isAdmin, next });
  if (claimedShop) res.cookies.delete(PENDING_INSTALL_COOKIE);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  if (activeShop) {
    res.cookies.set("shopify_shop", activeShop, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}
