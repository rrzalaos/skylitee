import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, updateUser, hashPassword, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(token);
  if (!session || session.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json() as { email: string; action: "disable" | "enable" | "reset-password"; newPassword?: string };
  const { email, action } = body;
  if (!email || !action) return NextResponse.json({ error: "email and action required" }, { status: 400 });

  const target = await getUser(email);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (action === "reset-password") {
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    target.passwordHash = hashPassword(body.newPassword);
    await updateUser(target);
    return NextResponse.json({ ok: true });
  }

  target.disabled = action === "disable";
  await updateUser(target);

  return NextResponse.json({ ok: true, disabled: target.disabled });
}
