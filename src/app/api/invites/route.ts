import { NextRequest, NextResponse } from "next/server";
import { getSession, addShopToUser, SESSION_COOKIE } from "@/lib/auth";
import { inviteKv, shopKv, notificationKv, activityKv } from "@/lib/kv";

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

  const invites = await inviteKv.getInvites(session.email) ?? [];
  const invite = invites.find(i => i.shop === shop);

  // Remove the invite regardless of action
  await inviteKv.setInvites(session.email, invites.filter(i => i.shop !== shop));

  const shopLabel = shop.replace(".myshopify.com", "");

  if (action === "accept") {
    await addShopToUser(session.email, shop);

    // Mark team member as active
    const members = await shopKv.getTeam(shop) ?? [];
    await shopKv.setTeam(shop, members.map(m =>
      m.email === session.email ? { ...m, status: "active" as const } : m
    ));

    // Notify owner
    if (invite?.inviterEmail) {
      await notificationKv.push(invite.inviterEmail, {
        type: "invite_accepted",
        message: `${session.email} accepted your invitation to ${shopLabel}`,
        meta: { userEmail: session.email, shop, role: invite.role },
      });
    }

    await activityKv.logShop(shop, {
      type: "invite_accepted",
      userEmail: session.email,
      detail: `Accepted invitation as ${(invite?.role ?? "member").replace("_", " ")}`,
    });
  } else {
    // Decline: remove from shop's team list
    const members = await shopKv.getTeam(shop) ?? [];
    await shopKv.setTeam(shop, members.filter(m => m.email !== session.email));

    // Notify owner
    if (invite?.inviterEmail) {
      await notificationKv.push(invite.inviterEmail, {
        type: "invite_declined",
        message: `${session.email} declined your invitation to ${shopLabel}`,
        meta: { userEmail: session.email, shop, role: invite.role },
      });
    }

    await activityKv.logShop(shop, {
      type: "invite_declined",
      userEmail: session.email,
      detail: `Declined invitation`,
    });
  }

  return NextResponse.json({ ok: true });
}
