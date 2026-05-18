import { NextRequest } from "next/server";
import { shopKv } from "./kv";

export function getShopFromRequest(req: NextRequest): string | null {
  return process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value ?? null;
}

export async function getShopifySession(
  req: NextRequest
): Promise<{ shop: string; token: string } | null> {
  const shop = getShopFromRequest(req);
  if (!shop) return null;
  const token =
    (await shopKv.getToken(shop)) ??
    process.env.SHOPIFY_ACCESS_TOKEN ??
    req.cookies.get("shopify_token")?.value ??
    null;
  if (!token) return null;
  return { shop, token };
}

export async function getGscRefreshToken(req: NextRequest, shop: string): Promise<string | null> {
  return (
    (await shopKv.getGscToken(shop)) ??
    req.cookies.get("google_gsc_token")?.value ??
    req.cookies.get("google_refresh_token")?.value ??
    null
  );
}

export async function getGa4RefreshToken(req: NextRequest, shop: string): Promise<string | null> {
  return (
    (await shopKv.getGa4Token(shop)) ??
    req.cookies.get("google_ga4_token")?.value ??
    req.cookies.get("google_refresh_token")?.value ??
    null
  );
}

export async function getMetaToken(req: NextRequest, shop: string): Promise<string | null> {
  return (
    (await shopKv.getMetaToken(shop)) ??
    req.cookies.get("meta_token")?.value ??
    null
  );
}

export async function getMetaAdAccount(req: NextRequest, shop: string): Promise<string | null> {
  return (
    (await shopKv.getMetaAccount(shop)) ??
    req.cookies.get("meta_ad_account")?.value ??
    null
  );
}

export async function getGscSite(req: NextRequest, shop: string): Promise<string | null> {
  return (
    (await shopKv.getGscSite(shop)) ??
    req.cookies.get("google_gsc_site")?.value ??
    null
  );
}

export async function getGa4Property(req: NextRequest, shop: string): Promise<string | null> {
  return (
    (await shopKv.getGa4Property(shop)) ??
    req.cookies.get("google_ga4_property")?.value ??
    null
  );
}
