import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, addShopToUser, removeShopFromUser, SESSION_COOKIE } from "@/lib/auth";
import { shopKv, inviteKv, notificationKv, activityKv, TeamMember } from "@/lib/kv";
import { getAuthorizedShop } from "@/lib/session";

const VALID_ROLES = ["admin", "marketing", "view_only"];

async function getSessionAndShop(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  const shop = req.cookies.get("shopify_shop")?.value ?? process.env.SHOPIFY_STORE ?? null;
  if (!shop) return null;
  const user = await getUser(session.email);
  if (!user?.shops.includes(shop) && !process.env.SHOPIFY_STORE) return null;
  return { session, shop };
}

export async function GET(req: NextRequest) {
  const ctx = await getSessionAndShop(req);
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const members = await shopKv.getTeam(ctx.shop) ?? [];
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionAndShop(req);
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { email, role } = await req.json() as { email?: string; role?: string };
  if (!email || !role) return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail === ctx.session.email) {
    return NextResponse.json({ error: "You can't add yourself as a team member" }, { status: 400 });
  }

  const members = await shopKv.getTeam(ctx.shop) ?? [];
  if (members.some(m => m.email === normalizedEmail)) {
    return NextResponse.json({ error: "This person is already a team member" }, { status: 409 });
  }

  const newMember: TeamMember = {
    email: normalizedEmail,
    role: role as TeamMember["role"],
    addedAt: new Date().toISOString(),
    status: "pending",
  };
  members.push(newMember);
  await shopKv.setTeam(ctx.shop, members);

  // Create an invite notification — member must explicitly accept before getting access
  const invites = await inviteKv.getInvites(normalizedEmail) ?? [];
  if (!invites.some(i => i.shop === ctx.shop)) {
    invites.push({ shop: ctx.shop, role, addedAt: new Date().toISOString(), inviterEmail: ctx.session.email });
    await inviteKv.setInvites(normalizedEmail, invites);
  }

  await activityKv.logShop(ctx.shop, {
    type: "member_invited",
    userEmail: ctx.session.email,
    detail: `Invited ${normalizedEmail} as ${role.replace("_", " ")}`,
  });

  return NextResponse.json({ ok: true, member: newMember });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getSessionAndShop(req);
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { email } = await req.json() as { email?: string };
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();
  const members = await shopKv.getTeam(ctx.shop) ?? [];
  await shopKv.setTeam(ctx.shop, members.filter(m => m.email !== normalizedEmail));

  // Revoke shop access from their account
  await removeShopFromUser(normalizedEmail, ctx.shop);

  // Clean invite notification if still pending
  const invites = await inviteKv.getInvites(normalizedEmail) ?? [];
  await inviteKv.setInvites(normalizedEmail, invites.filter(i => i.shop !== ctx.shop));

  await activityKv.logShop(ctx.shop, {
    type: "member_removed",
    userEmail: ctx.session.email,
    detail: `Removed ${normalizedEmail} from team`,
  });

  return NextResponse.json({ ok: true });
}
