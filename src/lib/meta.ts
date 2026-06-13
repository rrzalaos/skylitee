export interface MetaAccount {
  id: string;
  name: string;
  currency: string;
}

export type MetaActionEntry = { action_type: string; value: string };

// Meta reports several "lead-ish" events per campaign — on-Meta Instant-Form leads, a
// website "Lead" pixel that fires loosely, messaging conversations, registrations, calls.
// Ads Manager's headline "Results" counts ONLY the one the campaign was optimized for.
// Taking the max of all of them (our old behaviour) over-counts badly — e.g. a campaign
// with 6 form leads but a Lead pixel that fired 48 times showed 48.
// So we mirror Ads Manager: walk a priority list (most-specific result first) and return
// the FIRST event that's present. Order matters — on-Meta form leads outrank the website
// pixel, which outranks the generic aggregate.
const LEAD_RESULT_PRIORITY = [
  "onsite_conversion.lead_grouped",                  // Instant Form leads (on-Meta) — Ads Manager "Leads"
  "leadgen.other",                                   // older Instant Form lead type
  "onsite_conversion.lead",
  "offsite_conversion.fb_pixel_lead",                // website pixel leads (only when no on-Meta form leads)
  "lead",                                            // generic/aggregate lead
  "onsite_conversion.total_messaging_connection",    // messaging-objective results
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.messaging_conversation_started",
  "messaging_conversation_started",
  "onsite_conversion.messaging_first_reply",
  "messaging_first_reply",
  "complete_registration",                           // sign-up leads
  "offsite_conversion.fb_pixel_complete_registration",
  "onsite_conversion.click_to_call",                 // call leads
  "click_to_call",
];

/**
 * The campaign's headline "lead" result, matching Ads Manager's "Results" column.
 * Returns the first present event in priority order (not the max of all lead-ish events).
 */
export function leadCount(actions: MetaActionEntry[] | undefined): number {
  if (!actions?.length) return 0;
  const byType = new Map<string, number>();
  for (const a of actions) {
    byType.set(a.action_type.toLowerCase(), Math.round(parseFloat(a.value) || 0));
  }
  for (const t of LEAD_RESULT_PRIORITY) {
    const v = byType.get(t);
    if (v && v > 0) return v;
  }
  return 0;
}

/**
 * Split leads by channel — on-Meta/website FORM leads vs MESSAGING (WhatsApp/Messenger/IG
 * DM) vs CALL leads. Messaging leads are higher-intent and convert differently, so the
 * Command Center shows them separately instead of one blended lead count.
 */
export function leadChannels(actions: MetaActionEntry[] | undefined): { form: number; messaging: number; calls: number } {
  if (!actions?.length) return { form: 0, messaging: 0, calls: 0 };
  const v = (t: string) => {
    const hit = actions.find(a => a.action_type.toLowerCase() === t);
    return hit ? Math.round(parseFloat(hit.value) || 0) : 0;
  };
  const form = Math.max(
    v("onsite_conversion.lead_grouped"), v("leadgen.other"),
    v("onsite_conversion.lead"), v("offsite_conversion.fb_pixel_lead"), v("lead"),
  );
  const messaging = Math.max(
    v("onsite_conversion.total_messaging_connection"),
    v("onsite_conversion.messaging_conversation_started_7d"),
    v("onsite_conversion.messaging_conversation_started"),
    v("messaging_conversation_started"),
  );
  const calls = Math.max(v("onsite_conversion.click_to_call"), v("click_to_call"));
  return { form, messaging, calls };
}

/** Every lead-ish event + value — for the debug/audit view so a mismatch is diagnosable. */
export function leadBreakdown(actions: MetaActionEntry[] | undefined): { type: string; value: number; chosen: boolean }[] {
  if (!actions?.length) return [];
  const rel = actions
    .filter(a => /lead|leadgen|messaging|registration|click_to_call/i.test(a.action_type))
    .map(a => ({ type: a.action_type, value: Math.round(parseFloat(a.value) || 0) }));
  const chosen = leadCount(actions);
  // Mark the first event that equals the chosen value (in priority order) as the source.
  const order = new Map(LEAD_RESULT_PRIORITY.map((t, i) => [t, i]));
  let chosenType: string | null = null;
  let best = Infinity;
  for (const r of rel) {
    if (r.value === chosen && order.has(r.type.toLowerCase())) {
      const rank = order.get(r.type.toLowerCase())!;
      if (rank < best) { best = rank; chosenType = r.type; }
    }
  }
  return rel.map(r => ({ ...r, chosen: r.type === chosenType }));
}

/**
 * Resolve which Meta ad account to use.
 * If savedAccountId exists, use it — never fall back to a different account.
 * Try to fetch name/currency for display; if that fails, use the ID as the name.
 * Only falls back to me/adaccounts[0] when no account has ever been saved.
 */
export async function resolveMetaAccount(
  savedAccountId: string | null,
  token: string
): Promise<MetaAccount | null> {
  if (savedAccountId) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${savedAccountId}?fields=id,name,currency&access_token=${token}`
    );
    const data = await res.json() as { id?: string; name?: string; currency?: string; error?: unknown };
    // Even if the metadata fetch fails, still use the saved account ID
    return {
      id: data.id ?? savedAccountId,
      name: data.name ?? savedAccountId,
      currency: data.currency ?? "USD",
    };
  }

  // No saved account — use first available
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency&limit=1&access_token=${token}`
  );
  const data = await res.json() as {
    data?: { id: string; name: string; currency: string }[];
    error?: unknown;
  };
  return data.data?.[0] ?? null;
}
