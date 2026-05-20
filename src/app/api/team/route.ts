import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser, addShopToUser, removeShopFromUser, SESSION_COOKIE } from "@/lib/auth";
import { shopKv, teamKv, TeamMember } from "@/lib/kv";
import { getShopFromRequest } from "@/lib/session";

const VALID_ROLES = ["admin", "marketing", "view_only"];

async function getSessionAndShop(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  const shop = getShopFromRequest(req);
  if (!shop) return null;
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
  };
  members.push(newMember);
  await shopKv.setTeam(ctx.shop, members);

  // If they already have a Skylitee account, grant access immediately
  const existingUser = await getUser(normalizedEmail);
  if (existingUser) {
    await addShopToUser(normalizedEmail, ctx.shop);
  } else {
    // Store pending invite — claimed automatically when they sign up or log in
    const pending = await teamKv.getPending(normalizedEmail) ?? [];
    if (!pending.some(p => p.shop === ctx.shop)) {
      pending.push({ shop: ctx.shop, role });
      await teamKv.setPending(normalizedEmail, pending);
    }
  }

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

  // Clean pending invite if it exists
  const pending = await teamKv.getPending(normalizedEmail) ?? [];
  const updatedPending = pending.filter(p => p.shop !== ctx.shop);
  if (updatedPending.length === 0) {
    await teamKv.delPending(normalizedEmail);
  } else {
    await teamKv.setPending(normalizedEmail, updatedPending);
  }

  return NextResponse.json({ ok: true });
}
