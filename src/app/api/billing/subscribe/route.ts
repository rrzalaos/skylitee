import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopifyPost } from "@/lib/shopify";
import { PLANS, PlanId } from "@/lib/billing";
import { shopKv, couponKv } from "@/lib/kv";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.vercel.app";

interface ChargeResponse {
  recurring_application_charge: {
    id: number;
    confirmation_url: string;
    status: string;
  };
}

function isCouponValid(coupon: { active: boolean; expiresAt: string | null; maxUses: number; usedCount: number }): boolean {
  if (!coupon.active) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return false;
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const { planId, couponCode } = await req.json() as { planId: PlanId; couponCode?: string };
  const plan = PLANS.find(p => p.id === planId);
  if (!plan || plan.price === 0) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  let price = plan.price;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const normalized = couponCode.trim().toUpperCase();
    const coupon = await couponKv.get(normalized);
    if (coupon && isCouponValid(coupon) && !coupon.redemptions.includes(shop)) {
      if (coupon.discountPct === 100) {
        // 100% off should be handled by /api/billing/coupon, not here
        return NextResponse.json({ error: "use_coupon_apply" }, { status: 400 });
      }
      price = parseFloat((plan.price * (1 - coupon.discountPct / 100)).toFixed(2));
      if (price < 0.01) price = 0.01;
      appliedCoupon = normalized;
    }
  }

  const isTest = process.env.NODE_ENV !== "production";

  const data = await shopifyPost<ChargeResponse>(
    shop, token,
    "/recurring_application_charges.json",
    {
      recurring_application_charge: {
        name: `Skylitee ${plan.name}`,
        price: price.toFixed(2),
        return_url: `${APP_URL}/api/billing/callback?plan=${planId}`,
        trial_days: plan.trialDays,
        test: isTest,
      },
    }
  );

  // Store the applied coupon so callback can mark it as used
  if (appliedCoupon) {
    await shopKv.setPendingCoupon(shop, appliedCoupon);
  }

  return NextResponse.json({
    confirmationUrl: data.recurring_application_charge.confirmation_url,
  });
}
