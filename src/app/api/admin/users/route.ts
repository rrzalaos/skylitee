import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, getAllUserEmails, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(token);
  if (!session || session.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const emails = await getAllUserEmails();
  const users = await Promise.all(
    emails.map(async email => {
      const user = await getUser(email);
      if (!user) return null;
      return {
        name: user.name,
        email: user.email,
        shops: user.shops,
        createdAt: user.createdAt,
      };
    })
  );

  return NextResponse.json({
    users: users.filter(Boolean).sort((a, b) =>
      new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
    ),
    total: users.filter(Boolean).length,
  });
}
