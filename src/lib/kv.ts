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
  status?: "pending" | "active"; // pending = invite sent, active = accepted
}

export interface InviteRecord {
  shop: string;
  role: string;
  addedAt: string;
  inviterEmail: string;
}

export interface NotificationRecord {
  id: string;
  type: "invite_accepted" | "invite_declined" | "member_removed";
  message: string;
  meta: { userEmail?: string; shop?: string; role?: string };
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  userEmail: string;
  detail: string;
  createdAt: string;
}

// Pending store invitations — shown in dashboard bell, user must explicitly accept
export const inviteKv = {
  getInvites: (email: string) => kvGet<InviteRecord[]>(`user:${email.toLowerCase()}:invites`),
  setInvites: (email: string, v: InviteRecord[]) => kvSet(`user:${email.toLowerCase()}:invites`, v),
};

// Owner notifications (invite accepted/declined, member removed)
export const notificationKv = {
  get: (email: string) => kvGet<NotificationRecord[]>(`user:${email.toLowerCase()}:notifications`),
  set: (email: string, v: NotificationRecord[]) => kvSet(`user:${email.toLowerCase()}:notifications`, v),
  async push(email: string, notif: Omit<NotificationRecord, "id" | "read" | "createdAt">): Promise<void> {
    const all = (await kvGet<NotificationRecord[]>(`user:${email.toLowerCase()}:notifications`)) ?? [];
    all.unshift({
      ...notif,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    await kvSet(`user:${email.toLowerCase()}:notifications`, all.slice(0, 50));
  },
};

// Activity logs — per-shop (team/invite events) and per-user (logins)
export const activityKv = {
  getShop: (shop: string) => kvGet<ActivityLog[]>(`shop:${shop}:activity`),
  getUser: (email: string) => kvGet<ActivityLog[]>(`user:${email.toLowerCase()}:activity`),
  async logShop(shop: string, entry: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
    const all = (await kvGet<ActivityLog[]>(`shop:${shop}:activity`)) ?? [];
    all.unshift({ ...entry, id: `l_${Date.now()}`, createdAt: new Date().toISOString() });
    await kvSet(`shop:${shop}:activity`, all.slice(0, 100));
  },
  async logUser(email: string, entry: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
    const all = (await kvGet<ActivityLog[]>(`user:${email.toLowerCase()}:activity`)) ?? [];
    all.unshift({ ...entry, id: `l_${Date.now()}`, createdAt: new Date().toISOString() });
    await kvSet(`user:${email.toLowerCase()}:activity`, all.slice(0, 100));
  },
};
