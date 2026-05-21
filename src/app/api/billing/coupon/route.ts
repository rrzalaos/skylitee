import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopKv, couponKv } from "@/lib/kv";
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
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop } = session;

  const { code, action = "validate" } = await req.json() as { code: string; action?: "validate" | "apply" };

  const normalized = code.trim().toUpperCase();
  const coupon = await couponKv.get(normalized);

  if (!coupon || !isCouponValid(coupon)) {
    return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
  }
  if (coupon.redemptions.includes(shop)) {
    return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
  }

  const basePrice = PLANS[0].price;
  const finalPrice = coupon.discountPct === 100
    ? 0
    : parseFloat((basePrice * (1 - coupon.discountPct / 100)).toFixed(2));

  if (action === "validate") {
    return NextResponse.json({ valid: true, discountPct: coupon.discountPct, finalPrice });
  }

  // apply — only valid for 100% off (free access, bypasses Shopify billing)
  if (coupon.discountPct !== 100) {
    return NextResponse.json({ error: "This coupon applies a partial discount — please proceed through the subscription flow" }, { status: 400 });
  }

  await Promise.allSettled([
    shopKv.setPlan(shop, "growth"),
    couponKv.set(normalized, {
      ...coupon,
      usedCount: coupon.usedCount + 1,
      redemptions: [...coupon.redemptions, shop],
    }),
  ]);

  return NextResponse.json({ ok: true });
}
