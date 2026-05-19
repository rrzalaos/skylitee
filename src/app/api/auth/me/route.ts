import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, updateUser, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const user = await getUser(session.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    name: user.name,
    email: user.email,
    shops: user.shops,
    activeShop: session.activeShop,
    isAdmin: user.email === ADMIN_EMAIL,
  });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const user = await getUser(session.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as { name?: string };
  if (body.name && typeof body.name === "string" && body.name.trim()) {
    user.name = body.name.trim();
    await updateUser(user);
  }

  return NextResponse.json({ ok: true });
}
