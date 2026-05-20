import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { notificationKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const notifications = await notificationKv.get(session.email) ?? [];
  return NextResponse.json({ notifications });
}

// Mark all as read
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const notifications = await notificationKv.get(session.email) ?? [];
  await notificationKv.set(session.email, notifications.map(n => ({ ...n, read: true })));
  return NextResponse.json({ ok: true });
}
