import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";

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
