import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { getSession, SESSION_COOKIE, ADMIN_EMAIL, isEmbeddedEmail } from "./auth";
import { shopKv } from "./kv";

// Who connected a store's Meta/Google login. An agency usually connects its own Meta/Google
// login, which can reach EVERY client's ad accounts / sites / properties. Only that connector
// (or the Skylitee admin) may list those accounts and change the store's selection — anyone
// else (the store owner inside Shopify, invited clients) sees only the store's saved account,
// so one brand can never browse or switch to another brand's data.

export type ConnService = "meta" | "gsc" | "ga4" | "gads";

const key = (shop: string, service: ConnService) => `shop:${shop}:connector:${service}`;

export async function setConnector(shop: string, service: ConnService, email: string): Promise<void> {
  if (!email) return;
  try { await kv.set(key(shop, service), email); } catch { /* best-effort */ }
}

export async function getConnector(shop: string, service: ConnService): Promise<string | null> {
  try {
    // Connections made before this was tracked: the website user who added the store.
    return (await kv.get<string>(key(shop, service))) ?? (await shopKv.getOwner(shop)) ?? null;
  } catch { return null; }
}

// May the current user see every account the connected login can reach and pick one?
export async function canManageAccounts(req: NextRequest, shop: string, service: ConnService): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const email = token ? (await getSession(token))?.email ?? "" : "";
  if (!email) return false;
  if (email === ADMIN_EMAIL) return true;
  const connector = await getConnector(shop, service);
  if (connector) return connector === email;
  // Unknown connector (very old connection): website users keep their old access; inside
  // the Shopify admin stay locked to the saved account.
  return !isEmbeddedEmail(email);
}

// How to show the connector to someone who can't manage it.
export async function connectorLabel(shop: string, service: ConnService): Promise<string | null> {
  const c = await getConnector(shop, service);
  if (!c) return null;
  return isEmbeddedEmail(c) ? "the store owner" : c;
}
