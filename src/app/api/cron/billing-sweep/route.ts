import { NextRequest, NextResponse } from "next/server";
import { getAllUserEmails, getUser } from "@/lib/auth";
import { shopKv } from "@/lib/kv";
import { shopifyDelete, getValidToken } from "@/lib/shopify";

// Daily sweep that retires expired access grants:
//  - Expired FREE grants (trials / comped clients) → downgrade to free; the access gate
//    then sends them to the plans page.
//  - Expired DISCOUNT grants → cancel the discounted Shopify charge so billing stops, and
//    downgrade to free. The grant is kept so the pricing page shows the "discount ended,
//    re-subscribe at full price" banner until they approve a new full-price charge.
//
// Protected by CRON_SECRET (Vercel sends it as `Authorization: Bearer <secret>`). If no
// secret is configured the route still runs, so a missing env var never silently disables it.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const emails = await getAllUserEmails();

  // Collect unique shops across all users.
  const shops = new Set<string>();
  const users = await Promise.allSettled(emails.map(getUser));
  for (const r of users) {
    if (r.status === "fulfilled" && r.value) {
      for (const s of r.value.shops) shops.add(s);
    }
  }

  let freeExpired = 0;
  let discountReverted = 0;

  await Promise.allSettled([...shops].map(async (shop) => {
    const grant = await shopKv.getGrant(shop);
    if (!grant || !grant.expiresAt) return;            // no grant, or never-expiring
    if (new Date(grant.expiresAt) >= now) return;      // still within window

    if (grant.kind === "free") {
      await Promise.allSettled([shopKv.setPlan(shop, "free"), shopKv.delGrant(shop)]);
      freeExpired++;
      return;
    }

    // Discount grant expired → stop the discounted Shopify charge and gate access.
    const [token, chargeId] = await Promise.all([getValidToken(shop), shopKv.getChargeId(shop)]);
    if (token && chargeId) {
      try { await shopifyDelete(shop, token, `/recurring_application_charges/${chargeId}.json`); } catch { /* best-effort */ }
    }
    await Promise.allSettled([shopKv.setPlan(shop, "free"), shopKv.delChargeId(shop)]);
    // Keep the (now-expired) grant so the pricing page knows to show the revert banner.
    discountReverted++;
  }));

  return NextResponse.json({ ok: true, scanned: shops.size, freeExpired, discountReverted });
}
