import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopifyPost } from "@/lib/shopify";
import { shopKv } from "@/lib/kv";

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
      await shopKv.setPlan(shop, planId);
      await shopKv.setChargeId(shop, chargeId);
      return NextResponse.redirect(`${APP_URL}/dashboard?subscribed=1`);
    } else {
      return NextResponse.redirect(`${APP_URL}/dashboard/pricing?error=declined`);
    }
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/pricing?error=failed`);
  }
}
