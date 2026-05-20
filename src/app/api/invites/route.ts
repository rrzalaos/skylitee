import { NextRequest, NextResponse } from "next/server";
import { getSession, addShopToUser, SESSION_COOKIE } from "@/lib/auth";
import { inviteKv, shopKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const invites = await inviteKv.getInvites(session.email) ?? [];
  return NextResponse.json({ invites });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const { shop, action } = await req.json() as { shop?: string; action?: "accept" | "decline" };
  if (!shop || !action) return NextResponse.json({ error: "shop and action required" }, { status: 400 });

  // Remove the invite regardless of action
  const invites = await inviteKv.getInvites(session.email) ?? [];
  await inviteKv.setInvites(session.email, invites.filter(i => i.shop !== shop));

  if (action === "accept") {
    await addShopToUser(session.email, shop);
  } else {
    // Decline: remove from shop's team list too
    const members = await shopKv.getTeam(shop) ?? [];
    await shopKv.setTeam(shop, members.filter(m => m.email !== session.email));
  }

  return NextResponse.json({ ok: true });
}
