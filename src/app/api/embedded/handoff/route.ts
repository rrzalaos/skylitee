import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { isEmbeddedSessionToken } from "@/lib/embedded";
import { createHandoff, isHandoffTarget, setEmbeddedOAuthCookie, takeHandoff } from "@/lib/embedded-server";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.io";

// Inside the admin (session token) → one-time URL that starts Meta/Google login top-level.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!isEmbeddedSessionToken(token)) return NextResponse.json({ error: "Not embedded" }, { status: 401 });
  const session = await getSession(token!);
  if (!session?.embedded || !session.activeShop) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { next } = await req.json().catch(() => ({ next: "" }));
  if (typeof next !== "string" || !isHandoffTarget(next)) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }
  const code = await createHandoff(session.activeShop, next);
  return NextResponse.json({ url: `${APP_URL}/api/embedded/handoff?code=${code}` });
}

// Top-level tab: redeem the code → signed store cookie → start the OAuth flow.
export async function GET(req: NextRequest) {
  const handoff = await takeHandoff(req.nextUrl.searchParams.get("code") ?? "");
  if (!handoff || !isHandoffTarget(handoff.next)) {
    return NextResponse.redirect(new URL("/install", req.url));
  }
  const res = NextResponse.redirect(new URL(handoff.next, req.url));
  setEmbeddedOAuthCookie(res, handoff.shop);
  return res;
}
