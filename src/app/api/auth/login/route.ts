import { NextRequest, NextResponse } from "next/server";
import { getUser, verifyPassword, addShopToUser, createSession, SESSION_COOKIE, SESSION_MAX_AGE, ADMIN_EMAIL } from "@/lib/auth";
import { teamKv } from "@/lib/kv";

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

  // Claim any pending team invites added while they were not yet signed up
  const pending = await teamKv.getPending(user.email);
  if (pending?.length) {
    await Promise.allSettled(pending.map(p => addShopToUser(user.email, p.shop)));
    await teamKv.delPending(user.email);
    // Reload updated user shops
    const updated = await getUser(user.email);
    if (updated) user.shops = updated.shops;
  }

  const activeShop = user.shops[0] ?? "";
  const token = await createSession(user.email, activeShop);

  const isAdmin = user.email === ADMIN_EMAIL;
  const res = NextResponse.json({ ok: true, hasShop: user.shops.length > 0, isAdmin });
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
