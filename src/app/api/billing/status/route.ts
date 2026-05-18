import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  if (!session) return NextResponse.json({ plan: "free", chargeId: null });

  const [plan, chargeId] = await Promise.all([
    shopKv.getPlan(session.shop),
    shopKv.getChargeId(session.shop),
  ]);

  return NextResponse.json({
    plan: plan ?? "free",
    chargeId: chargeId ?? null,
    shop: session.shop,
  });
}
