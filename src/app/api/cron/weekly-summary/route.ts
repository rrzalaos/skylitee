import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getAllUserEmails, getUser } from "@/lib/auth";
import { getAccessState } from "@/lib/access";
import { buildWeekly, sendWeekly } from "@/lib/weekly-summary";

// Monday-morning plain-language summary email to every store with access.
// Skips stores that opted out (shop:{shop}:weekly_off) and stores already sent this week
// (shop:{shop}:weekly_sent = YYYY-MM-DD of the Monday), so a retried cron never double-sends.
// Protected by CRON_SECRET, same as billing-sweep.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const shops = new Set<string>();
  const users = await Promise.allSettled((await getAllUserEmails()).map(getUser));
  for (const r of users) if (r.status === "fulfilled" && r.value) r.value.shops.forEach(s => shops.add(s));

  const now = new Date();
  const monday = new Date(now); monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  const weekKey = monday.toISOString().slice(0, 10);

  let sent = 0, skipped = 0;
  const failed: string[] = [];
  await Promise.allSettled([...shops].map(async shop => {
    try {
      const [off, last, access] = await Promise.all([
        kv.get(`shop:${shop}:weekly_off`), kv.get<string>(`shop:${shop}:weekly_sent`), getAccessState(shop),
      ]);
      if (off || last === weekKey || !access.hasAccess) { skipped++; return; }
      const w = await buildWeekly(shop);
      if (!w?.email) { skipped++; return; }
      await sendWeekly(w, w.email);
      await kv.set(`shop:${shop}:weekly_sent`, weekKey, { ex: 14 * 24 * 60 * 60 });
      sent++;
    } catch (e) {
      failed.push(`${shop}: ${e instanceof Error ? e.message : "error"}`);
    }
  }));

  return NextResponse.json({ ok: true, scanned: shops.size, sent, skipped, failed });
}
