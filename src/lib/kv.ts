import { kv } from "@vercel/kv";

export type CouponKind = "free" | "discount";
export type DurationType = "days" | "months" | "forever";

export interface Coupon {
  code: string;
  kind?: CouponKind;            // "free" (100% off) | "discount" (partial). Absent on legacy coupons — derive from discountPct.
  discountPct: number;          // 1–100
  durationType?: DurationType;  // how long the benefit lasts once redeemed. Absent on legacy coupons → treat as "forever".
  durationValue?: number;       // e.g. 14 (days) or 3 (months); ignored when durationType is "forever"
  maxUses: number;              // 0 = unlimited
  usedCount: number;
  expiresAt: string | null;     // last day the code can be CLAIMED (ISO date or null)
  createdAt: string;
  active: boolean;
  redemptions: string[];        // shops that redeemed
}

// Per-shop access grant — the benefit a redeemed coupon (or admin comp) confers.
export interface Grant {
  couponCode: string;           // source code, or "ADMIN" for a hand-granted comp
  kind: CouponKind;
  discountPct: number;
  startedAt: string;            // ISO
  expiresAt: string | null;     // ISO end of benefit window; null = forever
}

// Normalize a coupon read from KV so legacy records have the new fields.
export function normalizeCoupon(c: Coupon): Required<Pick<Coupon, "kind" | "durationType" | "durationValue">> & Coupon {
  return {
    ...c,
    kind: c.kind ?? (c.discountPct >= 100 ? "free" : "discount"),
    durationType: c.durationType ?? "forever",
    durationValue: c.durationValue ?? 0,
  };
}

// Compute the ISO end of a benefit window given a duration, starting now (or from a base date).
export function computeGrantExpiry(durationType: DurationType, durationValue: number, from: Date = new Date()): string | null {
  if (durationType === "forever") return null;
  const d = new Date(from);
  if (durationType === "days") d.setDate(d.getDate() + durationValue);
  else if (durationType === "months") d.setMonth(d.getMonth() + durationValue);
  return d.toISOString();
}

// Plain-English description of what a coupon/grant gives (e.g. "50% off for 3 months").
export function describeBenefit(opts: { kind: CouponKind; discountPct: number; durationType: DurationType; durationValue: number }): string {
  const what = opts.kind === "free" ? "Free" : `${opts.discountPct}% off`;
  if (opts.durationType === "forever") return `${what} forever`;
  const unit = opts.durationType === "days"
    ? (opts.durationValue === 1 ? "day" : "days")
    : (opts.durationValue === 1 ? "month" : "months");
  return `${what} for ${opts.durationValue} ${unit}`;
}

// Gracefully no-ops if KV env vars are not set (local dev without KV)
async function kvGet<T>(key: string): Promise<T | null> {
  try { return await kv.get<T>(key); } catch { return null; }
}
async function kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    if (ttlSeconds) {
      await kv.set(key, value as Parameters<typeof kv.set>[1], { ex: ttlSeconds });
    } else {
      await kv.set(key, value as Parameters<typeof kv.set>[1]);
    }
  } catch { /* KV not configured */ }
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

  // Google Ads
  getGadsToken:      (shop: string) => kvGet<string>(`shop:${shop}:gads_token`),
  setGadsToken:      (shop: string, v: string) => kvSet(`shop:${shop}:gads_token`, v),
  delGadsToken:      (shop: string) => kvDel(`shop:${shop}:gads_token`),
  getGadsCustomerId: (shop: string) => kvGet<string>(`shop:${shop}:gads_customer_id`),
  setGadsCustomerId: (shop: string, v: string) => kvSet(`shop:${shop}:gads_customer_id`, v),
  delGadsCustomerId: (shop: string) => kvDel(`shop:${shop}:gads_customer_id`),

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
  delChargeId:  (shop: string) => kvDel(`shop:${shop}:charge_id`),

  // Access grant (free/discount benefit window from a redeemed coupon or admin comp)
  getGrant: (shop: string) => kvGet<Grant>(`shop:${shop}:grant`),
  setGrant: (shop: string, v: Grant) => kvSet(`shop:${shop}:grant`, v),
  delGrant: (shop: string) => kvDel(`shop:${shop}:grant`),

  // Pending coupon code (stored during discounted Shopify billing flow, 1-hour TTL)
  getPendingCoupon: (shop: string) => kvGet<string>(`shop:${shop}:pending_coupon`),
  setPendingCoupon: (shop: string, v: string) => kvSet(`shop:${shop}:pending_coupon`, v, 3600),
  delPendingCoupon: (shop: string) => kvDel(`shop:${shop}:pending_coupon`),

  // Store IANA timezone (e.g. "Asia/Kolkata") — cached 7 days so date ranges match the
  // Shopify admin's local-day boundaries without re-fetching /shop.json each request.
  getTz: (shop: string) => kvGet<string>(`shop:${shop}:tz`),
  setTz: (shop: string, v: string) => kvSet(`shop:${shop}:tz`, v, 7 * 24 * 60 * 60),

  // When the store first connected Shopify, and the owner who connected it (the account
  // that ran OAuth). Set once on connect — used by the admin store view for age & ownership.
  getConnectedAt: (shop: string) => kvGet<string>(`shop:${shop}:connected_at`),
  setConnectedAt: (shop: string, v: string) => kvSet(`shop:${shop}:connected_at`, v),
  getOwner: (shop: string) => kvGet<string>(`shop:${shop}:owner`),
  setOwner: (shop: string, v: string) => kvSet(`shop:${shop}:owner`, v),

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
      `shop:${shop}:gads_token`,
      `shop:${shop}:gads_customer_id`,
      `shop:${shop}:meta_token`,
      `shop:${shop}:meta_ad_account`,
      `shop:${shop}:plan`,
      `shop:${shop}:charge_id`,
      `shop:${shop}:grant`,
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

// Coupon codes
export const couponKv = {
  get: (code: string) => kvGet<Coupon>(`coupon:${code.toUpperCase()}`),
  set: (code: string, v: Coupon) => kvSet(`coupon:${code.toUpperCase()}`, v),
  del: (code: string) => kvDel(`coupon:${code.toUpperCase()}`),
  async listAll(): Promise<Coupon[]> {
    try {
      const codes = (await kv.smembers("coupons:index")) as string[];
      const results = await Promise.allSettled(codes.map(c => couponKv.get(c)));
      return results.flatMap(r => r.status === "fulfilled" && r.value ? [r.value] : []);
    } catch { return []; }
  },
  async addToIndex(code: string): Promise<void> {
    try { await kv.sadd("coupons:index", code.toUpperCase()); } catch { /* KV not configured */ }
  },
  async removeFromIndex(code: string): Promise<void> {
    try { await kv.srem("coupons:index", code.toUpperCase()); } catch { /* KV not configured */ }
  },
};
