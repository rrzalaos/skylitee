import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getAuthorizedShop, requireShopPermission } from "@/lib/session";

// Done / Not now state for the Command Center "Do these today" list.
// KV shop:{shop}:actions = { [actionId]: { status, at, impact, title } }.
// "Not now" hides an action for 7 days; "Done" hides it until its id changes
// (ids carry the campaign name, so a NEW losing campaign shows up again).

export type ActionState = { status: "done" | "snoozed"; at: number; impact: number; title: string };
type Store = Record<string, ActionState>;

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const keyFor = (shop: string) => `shop:${shop}:actions`;

function monthStats(store: Store) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const done = Object.values(store).filter(a => a.status === "done" && a.at >= start);
  return { fixedThisMonth: done.length, savedThisMonth: Math.round(done.reduce((s, a) => s + (a.impact || 0), 0)) };
}

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const store = (await kv.get<Store>(keyFor(shop)).catch(() => null)) ?? {};
  // Expired snoozes are dropped from the response so the action comes back.
  const active: Store = {};
  for (const [id, a] of Object.entries(store)) {
    if (a.status === "snoozed" && Date.now() - a.at > SNOOZE_MS) continue;
    active[id] = a;
  }
  return NextResponse.json({ actions: active, ...monthStats(store) });
}

export async function POST(req: NextRequest) {
  const auth = await requireShopPermission(req, "edit");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => null) as { id?: string; status?: string; impact?: number; title?: string } | null;
  const id = body?.id?.slice(0, 120);
  if (!id || !["done", "snoozed", "clear"].includes(body?.status ?? "")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const k = keyFor(auth.shop);
  const store = (await kv.get<Store>(k).catch(() => null)) ?? {};
  if (body!.status === "clear") delete store[id];
  else store[id] = {
    status: body!.status as "done" | "snoozed",
    at: Date.now(),
    impact: Math.max(0, Math.round(Number(body!.impact) || 0)),
    title: String(body!.title ?? "").slice(0, 200),
  };
  // Keep the map small: drop entries older than ~6 months.
  const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
  for (const [aid, a] of Object.entries(store)) if (a.at < cutoff) delete store[aid];
  await kv.set(k, store);
  return NextResponse.json({ ok: true, ...monthStats(store) });
}
