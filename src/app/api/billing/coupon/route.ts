import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop } from "@/lib/session";
import { shopKv, couponKv, Grant, normalizeCoupon, computeGrantExpiry, describeBenefit } from "@/lib/kv";
import { PLANS } from "@/lib/billing";

function isCouponValid(coupon: { active: boolean; expiresAt: string | null; maxUses: number; usedCount: number }): boolean {
  if (!coupon.active) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return false;
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

// POST { code, action: "validate" | "apply" }
// validate — returns discount info (no side effects)
// apply    — grants free access for 100% discount coupons
export async function POST(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const { code, action = "validate" } = await req.json() as { code: string; action?: "validate" | "apply" };

  const normalized = code.trim().toUpperCase();
  const coupon = await couponKv.get(normalized);

  if (!coupon || !isCouponValid(coupon)) {
    return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
  }
  if (coupon.redemptions.includes(shop)) {
    return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
  }

  const norm = normalizeCoupon(coupon);
  const basePrice = PLANS[0].price;
  const finalPrice = norm.kind === "free"
    ? 0
    : parseFloat((basePrice * (1 - norm.discountPct / 100)).toFixed(2));
  const benefit = describeBenefit(norm);

  if (action === "validate") {
    return NextResponse.json({
      valid: true,
      kind: norm.kind,
      discountPct: norm.discountPct,
      finalPrice,
      durationType: norm.durationType,
      durationValue: norm.durationValue,
      benefit,
    });
  }

  // apply — only free codes are granted here (they bypass Shopify billing).
  // Discount codes must run through the subscription flow (Shopify charge).
  if (norm.kind !== "free") {
    return NextResponse.json({ error: "This code applies a discount — please proceed through the subscription flow" }, { status: 400 });
  }

  const grant: Grant = {
    couponCode: norm.code,
    kind: "free",
    discountPct: 100,
    startedAt: new Date().toISOString(),
    expiresAt: computeGrantExpiry(norm.durationType, norm.durationValue),
  };

  await Promise.allSettled([
    shopKv.setPlan(shop, "growth"),
    shopKv.setGrant(shop, grant),
    couponKv.set(normalized, {
      ...coupon,
      usedCount: coupon.usedCount + 1,
      redemptions: [...coupon.redemptions, shop],
    }),
  ]);

  return NextResponse.json({ ok: true });
}
