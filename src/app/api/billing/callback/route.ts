import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopifyPost, shopifyDelete } from "@/lib/shopify";
import { shopKv, couponKv, Grant, normalizeCoupon, computeGrantExpiry } from "@/lib/kv";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.vercel.app";

interface ActivateResponse {
  recurring_application_charge: {
    id: number;
    status: string;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const chargeId = searchParams.get("charge_id");
  const planId = searchParams.get("plan") ?? "growth";

  if (!chargeId) {
    return NextResponse.redirect(`${APP_URL}/dashboard/pricing?error=no_charge`);
  }

  const session = await getShopifySession(req);
  if (!session) {
    return NextResponse.redirect(`${APP_URL}/dashboard/connections`);
  }
  const { shop, token } = session;

  try {
    const data = await shopifyPost<ActivateResponse>(
      shop, token,
      `/recurring_application_charges/${chargeId}/activate.json`,
      { recurring_application_charge: { id: parseInt(chargeId) } }
    );

    const status = data.recurring_application_charge.status;
    if (status === "active") {
      const prevChargeId = await shopKv.getChargeId(shop);
      await shopKv.setPlan(shop, planId);
      await shopKv.setChargeId(shop, chargeId);

      // A pending coupon means this charge used a partial discount — mark it used and
      // record the discount grant (its benefit window). No pending coupon means a plain
      // full-price (re)subscription, so clear any stale grant (e.g. an expired discount).
      const pendingCoupon = await shopKv.getPendingCoupon(shop);
      if (pendingCoupon) {
        const coupon = await couponKv.get(pendingCoupon);
        if (coupon) {
          const norm = normalizeCoupon(coupon);
          const grant: Grant = {
            couponCode: norm.code,
            kind: "discount",
            discountPct: norm.discountPct,
            startedAt: new Date().toISOString(),
            expiresAt: computeGrantExpiry(norm.durationType, norm.durationValue),
          };
          await Promise.allSettled([
            shopKv.setGrant(shop, grant),
            couponKv.set(pendingCoupon, {
              ...coupon,
              usedCount: coupon.usedCount + 1,
              redemptions: [...coupon.redemptions, shop],
            }),
          ]);
        }
        await shopKv.delPendingCoupon(shop);
      } else {
        // Full-price (re)subscription — clear any stale grant and cancel the old charge
        // (e.g. a previous discounted charge) so the merchant isn't billed twice.
        await shopKv.delGrant(shop);
        if (prevChargeId && prevChargeId !== chargeId) {
          try { await shopifyDelete(shop, token, `/recurring_application_charges/${prevChargeId}.json`); } catch { /* best-effort */ }
        }
      }

      return NextResponse.redirect(`${APP_URL}/dashboard?subscribed=1`);
    } else {
      return NextResponse.redirect(`${APP_URL}/dashboard/pricing?error=declined`);
    }
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/pricing?error=failed`);
  }
}
