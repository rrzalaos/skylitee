import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, SESSION_COOKIE } from "@/lib/auth";
import { activityKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const shop = req.cookies.get("shopify_shop")?.value ?? process.env.SHOPIFY_STORE ?? null;

  const userLogs = await activityKv.getUser(session.email) ?? [];
  const shopLogs = shop
    ? (() => {
        const user = getUser(session.email);
        return user.then(u => (u?.shops.includes(shop) || process.env.SHOPIFY_STORE) ? activityKv.getShop(shop) : Promise.resolve([]));
      })()
    : Promise.resolve([]);

  const combined = [...userLogs, ...(await shopLogs ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);

  return NextResponse.json({ logs: combined });
}
