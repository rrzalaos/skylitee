import { shopKv, Grant } from "@/lib/kv";

export interface AccessState {
  hasAccess: boolean;
  plan: "free" | "growth";
  source: "subscription" | "grant" | "none";
  grant: Grant | null;
  grantExpiresAt: string | null;     // when the active grant ends (null = forever / none)
  discountRevertPending: boolean;    // an expired discount grant — must re-subscribe at full price
}

function isExpired(iso: string | null): boolean {
  return !!iso && new Date(iso) < new Date();
}

/**
 * Resolve a shop's effective access.
 *
 * Rules:
 *  - An active (non-expired) grant always grants access.
 *  - An expired grant revokes access. If it was a discount grant, the merchant must
 *    re-subscribe at full price (discountRevertPending) — Shopify can't auto-raise a price.
 *  - With no grant, a "growth" plan (a real paid subscription, or a store grandfathered
 *    in before access codes existed) grants access. Everything else is gated.
 */
export async function getAccessState(shop: string): Promise<AccessState> {
  const [planRaw, , grant] = await Promise.all([
    shopKv.getPlan(shop),
    shopKv.getChargeId(shop),
    shopKv.getGrant(shop),
  ]);
  const plan: "free" | "growth" = planRaw === "growth" ? "growth" : "free";

  if (grant) {
    const expired = isExpired(grant.expiresAt);
    if (!expired) {
      return {
        hasAccess: true,
        plan,
        source: "grant",
        grant,
        grantExpiresAt: grant.expiresAt,
        discountRevertPending: false,
      };
    }
    // Grant has expired.
    return {
      hasAccess: false,
      plan,
      source: "none",
      grant,
      grantExpiresAt: null,
      discountRevertPending: grant.kind === "discount",
    };
  }

  // No grant — a paid/grandfathered "growth" plan keeps access.
  if (plan === "growth") {
    return { hasAccess: true, plan, source: "subscription", grant: null, grantExpiresAt: null, discountRevertPending: false };
  }

  return { hasAccess: false, plan, source: "none", grant: null, grantExpiresAt: null, discountRevertPending: false };
}
