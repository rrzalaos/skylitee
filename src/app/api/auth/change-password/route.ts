import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, updateUser, verifyPassword, hashPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const user = await getUser(session.email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as { currentPassword?: string; newPassword?: string };
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  user.passwordHash = hashPassword(newPassword);
  await updateUser(user);

  return NextResponse.json({ ok: true });
}
