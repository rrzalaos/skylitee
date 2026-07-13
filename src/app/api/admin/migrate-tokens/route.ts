import { NextRequest, NextResponse } from "next/server";
import { getAllUserEmails, getUser, getSession, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";
import { shopKv } from "@/lib/kv";
import { getValidToken } from "@/lib/shopify";

// One-time (safe to re-run) sweep that proactively migrates every connected store's Shopify
// offline token from the deprecated PERMANENT type to the new EXPIRING type, instead of waiting
// for each store's dashboard to load. Calling getValidToken performs the token-exchange migration
// for any legacy token; re-running is a no-op for already-migrated stores.
//
// Admin-only (same gate as the admin Stores tab): just open this URL in a browser while logged
// in to skylitee.io as the admin account — no secret needed.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const session = await getSession(token);
  if (!session || session.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Collect unique shops across all users.
  const emails = await getAllUserEmails();
  const shops = new Set<string>();
  const users = await Promise.allSettled(emails.map(getUser));
  for (const r of users) {
    if (r.status === "fulfilled" && r.value) {
      for (const s of r.value.shops) shops.add(s);
    }
  }

  const results = await Promise.allSettled([...shops].map(async (shop) => {
    const before = await shopKv.getTokenRecord(shop);
    if (!before) return { shop, status: "no_token" as const };
    const wasLegacy = !before.expires_at && !before.refresh_token;
    if (!wasLegacy) return { shop, status: "already_expiring" as const };

    await getValidToken(shop);                       // performs the token-exchange migration
    const after = await shopKv.getTokenRecord(shop);
    const migrated = !!(after?.expires_at || after?.refresh_token);
    return { shop, status: migrated ? ("migrated" as const) : ("failed" as const) };
  }));

  const rows = results.map(r => r.status === "fulfilled" ? r.value : { shop: "?", status: "error" as const });
  const summary = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ ok: true, scanned: shops.size, summary, shops: rows });
}
