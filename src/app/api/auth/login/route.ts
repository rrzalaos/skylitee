import { NextRequest, NextResponse } from "next/server";
import { getUser, verifyPassword, createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await getUser(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const activeShop = user.shops[0] ?? "";
  const token = await createSession(user.email, activeShop);

  const res = NextResponse.json({ ok: true, hasShop: user.shops.length > 0 });
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
