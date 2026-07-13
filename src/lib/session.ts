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
