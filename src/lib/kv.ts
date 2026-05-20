import { kv } from "@vercel/kv";

// Gracefully no-ops if KV env vars are not set (local dev without KV)
async function kvGet<T>(key: string): Promise<T | null> {
  try { return await kv.get<T>(key); } catch { return null; }
}
async function kvSet(key: string, value: unknown): Promise<void> {
  try { await kv.set(key, value as Parameters<typeof kv.set>[1]); } catch { /* KV not configured */ }
}
async function kvDel(key: string): Promise<void> {
  try { await kv.del(key); } catch { /* KV not configured */ }
}

export const shopKv = {
  // Shopify
  getToken:       (shop: string) => kvGet<string>(`shop:${shop}:shopify_token`),
  setToken:       (shop: string, v: string) => kvSet(`shop:${shop}:shopify_token`, v),
  delToken:       (shop: string) => kvDel(`shop:${shop}:shopify_token`),

  // Google GSC
  getGscToken:    (shop: string) => kvGet<string>(`shop:${shop}:gsc_token`),
  setGscToken:    (shop: string, v: string) => kvSet(`shop:${shop}:gsc_token`, v),
  delGscToken:    (shop: string) => kvDel(`shop:${shop}:gsc_token`),
  getGscSite:     (shop: string) => kvGet<string>(`shop:${shop}:gsc_site`),
  setGscSite:     (shop: string, v: string) => kvSet(`shop:${shop}:gsc_site`, v),

  // Google GA4
  getGa4Token:    (shop: string) => kvGet<string>(`shop:${shop}:ga4_token`),
  setGa4Token:    (shop: string, v: string) => kvSet(`shop:${shop}:ga4_token`, v),
  delGa4Token:    (shop: string) => kvDel(`shop:${shop}:ga4_token`),
  getGa4Property: (shop: string) => kvGet<string>(`shop:${shop}:ga4_property`),
  setGa4Property: (shop: string, v: string) => kvSet(`shop:${shop}:ga4_property`, v),

  // Meta
  getMetaToken:   (shop: string) => kvGet<string>(`shop:${shop}:meta_token`),
  setMetaToken:   (shop: string, v: string) => kvSet(`shop:${shop}:meta_token`, v),
  delMetaToken:   (shop: string) => kvDel(`shop:${shop}:meta_token`),
  getMetaAccount: (shop: string) => kvGet<string>(`shop:${shop}:meta_ad_account`),
  setMetaAccount: (shop: string, v: string) => kvSet(`shop:${shop}:meta_ad_account`, v),
  delMetaAccount: (shop: string) => kvDel(`shop:${shop}:meta_ad_account`),

  // Billing
  getPlan:      (shop: string) => kvGet<string>(`shop:${shop}:plan`),
  setPlan:      (shop: string, v: string) => kvSet(`shop:${shop}:plan`, v),
  getChargeId:  (shop: string) => kvGet<string>(`shop:${shop}:charge_id`),
  setChargeId:  (shop: string, v: string) => kvSet(`shop:${shop}:charge_id`, v),

  // Team members per shop
  getTeam: (shop: string) => kvGet<TeamMember[]>(`shop:${shop}:team`),
  setTeam: (shop: string, v: TeamMember[]) => kvSet(`shop:${shop}:team`, v),

  // Wipe all data for a shop (used on uninstall / shop/redact webhook)
  async delAllShopData(shop: string): Promise<void> {
    const keys = [
      `shop:${shop}:shopify_token`,
      `shop:${shop}:gsc_token`,
      `shop:${shop}:gsc_site`,
      `shop:${shop}:ga4_token`,
      `shop:${shop}:ga4_property`,
      `shop:${shop}:meta_token`,
      `shop:${shop}:meta_ad_account`,
      `shop:${shop}:plan`,
      `shop:${shop}:charge_id`,
      `shop:${shop}:team`,
    ];
    await Promise.allSettled(keys.map(k => kvDel(k)));
  },
};

export interface TeamMember {
  email: string;
  role: "admin" | "marketing" | "view_only";
  addedAt: string;
}

// Pending team invites — keyed by invitee email, claimed on signup/login
export const teamKv = {
  getPending: (email: string) => kvGet<Array<{ shop: string; role: string }>>(`team:pending:${email.toLowerCase()}`),
  setPending: (email: string, v: Array<{ shop: string; role: string }>) => kvSet(`team:pending:${email.toLowerCase()}`, v),
  delPending: (email: string) => kvDel(`team:pending:${email.toLowerCase()}`),
};
