import { NextRequest } from "next/server";
import { shopKv } from "./kv";
import { getValidToken } from "./shopify";
import { getSession, getUser, SESSION_COOKIE } from "./auth";

// ── Shop identity (cookies are correct here — shop domain is a UI cookie, not a secret token) ──

export function getShopFromRequest(req: NextRequest): string | null {
  return process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value ?? null;
}

// Verified version — confirms the session user actually owns this shop cookie.
// Use this on every data API route instead of getShopFromRequest.
export async function getAuthorizedShop(req: NextRequest): Promise<string | null> {
  if (process.env.SHOPIFY_STORE) return process.env.SHOPIFY_STORE;
  const shop = req.cookies.get("shopify_shop")?.value;
  if (!shop) return null;
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;
  const session = await getSession(sessionToken);
  if (!session) return null;
  const user = await getUser(session.email);
  if (!user?.shops.includes(shop)) return null;
  return shop;
}

// ── Store roles ───────────────────────────────────────────────────────────────
// A user with the shop on their account is its owner unless they joined via a
// team invite, in which case their team role applies.

export type ShopRole = "owner" | "admin" | "marketing" | "view_only";

// Mirrors the "Access Levels" card on the profile Team tab.
export type ShopPermission =
  | "billing"      // subscribe, coupons
  | "team"         // invite / remove members
  | "connections"  // connect/disconnect platforms, pick accounts & sites
  | "edit";        // saved report templates

const PERMISSION_ROLES: Record<ShopPermission, ShopRole[]> = {
  billing:     ["owner"],
  team:        ["owner", "admin"],
  connections: ["owner", "admin"],
  edit:        ["owner", "admin", "marketing"],
};

export async function getShopRole(shop: string, email: string): Promise<ShopRole> {
  if (process.env.SHOPIFY_STORE) return "owner";
  const [owner, team] = await Promise.all([shopKv.getOwner(shop), shopKv.getTeam(shop)]);
  if (owner === email) return "owner";
  return team?.find(m => m.email === email)?.role ?? "owner";
}

export function roleCan(role: ShopRole, permission: ShopPermission): boolean {
  return PERMISSION_ROLES[permission].includes(role);
}

// Verified shop + the caller's role on it. Use on every route that changes store state.
export async function requireShopPermission(
  req: NextRequest,
  permission: ShopPermission
): Promise<{ ok: true; shop: string; email: string; role: ShopRole } | { ok: false; status: 401 | 403; error: string }> {
  const shop = await getAuthorizedShop(req);
  if (!shop) return { ok: false, status: 401, error: "Not authenticated" };
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await getSession(token) : null;
  const email = session?.email ?? "";
  const role = await getShopRole(shop, email);
  if (!roleCan(role, permission)) {
    return {
      ok: false, status: 403,
      error: role === "view_only"
        ? "You have view-only access to this store"
        : "Your role on this store doesn't allow this — ask the store owner",
    };
  }
  return { ok: true, shop, email, role };
}

// Returns shop + Shopify API token. Use on routes that call the Shopify REST API.
export async function getShopifySession(
  req: NextRequest
): Promise<{ shop: string; token: string } | null> {
  const shop = await getAuthorizedShop(req);
  if (!shop) return null;
  // getValidToken transparently refreshes an expiring token or migrates a legacy permanent one.
  const token = (await getValidToken(shop)) ?? process.env.SHOPIFY_ACCESS_TOKEN ?? null;
  if (!token) return null;
  return { shop, token };
}

// ── Platform token helpers — KV only, no cookie fallbacks ────────────────────
// All platform tokens are stored in KV after OAuth. Cookies are never written
// for tokens and must not be used as a fallback (they don't exist post-migration).

export async function getGadsRefreshToken(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getGadsToken(shop);
}

export async function getGadsCustomerId(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getGadsCustomerId(shop);
}

export async function getGscRefreshToken(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getGscToken(shop);
}

export async function getGa4RefreshToken(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getGa4Token(shop);
}

export async function getMetaToken(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getMetaToken(shop);
}

export async function getMetaAdAccount(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getMetaAccount(shop);
}

export async function getGscSite(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getGscSite(shop);
}

export async function getGa4Property(_req: NextRequest, shop: string): Promise<string | null> {
  return shopKv.getGa4Property(shop);
}
