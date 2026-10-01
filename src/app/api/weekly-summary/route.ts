import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { requireShopPermission } from "@/lib/session";
import { isEmbeddedEmail } from "@/lib/auth";
import { buildWeekly, sendWeekly } from "@/lib/weekly-summary";

// Email this week's summary to the signed-in user now (or the store email when inside the
// Shopify admin) — lets a merchant preview what arrives on Monday. Once per 10 min per store.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await requireShopPermission(req, "edit");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const lock = `shop:${auth.shop}:weekly_test`;
  if (await kv.get(lock).catch(() => null)) {
    return NextResponse.json({ error: "Just sent one — try again in a few minutes." }, { status: 429 });
  }
  const w = await buildWeekly(auth.shop).catch(() => null);
  if (!w) return NextResponse.json({ error: "Couldn't build the summary" }, { status: 502 });
  const to = auth.email && !isEmbeddedEmail(auth.email) ? auth.email : w.email;
  if (!to) return NextResponse.json({ error: "No email address on file for this store" }, { status: 400 });
  try {
    await sendWeekly(w, to);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Email failed" }, { status: 502 });
  }
  await kv.set(lock, 1, { ex: 600 }).catch(() => {});
  return NextResponse.json({ ok: true, to });
}
