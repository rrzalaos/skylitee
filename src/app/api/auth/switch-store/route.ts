import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, updateSessionShop, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const { shop } = await req.json();
  if (!shop) return NextResponse.json({ error: "Shop required" }, { status: 400 });

  const user = await getUser(session.email);
  if (!user?.shops.includes(shop)) {
    return NextResponse.json({ error: "Store not connected to your account" }, { status: 403 });
  }

  await updateSessionShop(token, shop);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("shopify_shop", shop, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
