import { NextRequest, NextResponse } from "next/server";
import { getShopifySession } from "@/lib/session";
import { shopKv } from "@/lib/kv";
import { getAccessState } from "@/lib/access";

export async function GET(req: NextRequest) {
  const session = await getShopifySession(req);
  // No connected store yet → no access, show subscribe/connect flow.
  if (!session) {
    return NextResponse.json({
      plan: "free", chargeId: null, hasAccess: false,
      source: "none", grant: null, grantExpiresAt: null, discountRevertPending: false,
    });
  }

  const [chargeId, access] = await Promise.all([
    shopKv.getChargeId(session.shop),
    getAccessState(session.shop),
  ]);

  return NextResponse.json({
    plan: access.plan,
    chargeId: chargeId ?? null,
    shop: session.shop,
    hasAccess: access.hasAccess,
    source: access.source,
    grant: access.grant,
    grantExpiresAt: access.grantExpiresAt,
    discountRevertPending: access.discountRevertPending,
  });
}
