import { NextRequest, NextResponse } from "next/server";
import { getResetTokenEmail, deleteResetToken, getUser, updateUser, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const email = await getResetTokenEmail(token);
  if (!email) return NextResponse.json({ error: "Reset link is invalid or has expired" }, { status: 400 });

  const user = await getUser(email);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  user.passwordHash = hashPassword(password);
  await updateUser(user);
  await deleteResetToken(token);

  return NextResponse.json({ ok: true });
}
