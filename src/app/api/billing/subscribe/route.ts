import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopifyPost } from "@/lib/shopify";
import { PLANS, PlanId } from "@/lib/billing";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.vercel.app";

interface ChargeResponse {
  recurring_application_charge: {
    id: number;
    confirmation_url: string;
    status: string;
  };
}

export async function POST(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const { shop, token } = session;

  const { planId } = await req.json() as { planId: PlanId };
  const plan = PLANS.find(p => p.id === planId);
  if (!plan || plan.price === 0) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const isTest = process.env.NODE_ENV !== "production";

  const data = await shopifyPost<ChargeResponse>(
    shop, token,
    "/recurring_application_charges.json",
    {
      recurring_application_charge: {
        name: `Skylitee ${plan.name}`,
        price: plan.price.toFixed(2),
        return_url: `${APP_URL}/api/billing/callback?plan=${planId}`,
        trial_days: plan.trialDays,
        test: isTest,
      },
    }
  );

  return NextResponse.json({
    confirmationUrl: data.recurring_application_charge.confirmation_url,
  });
}
