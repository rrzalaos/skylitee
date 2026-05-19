export interface MetaAccount {
  id: string;
  name: string;
  currency: string;
}

/**
 * Resolve which Meta ad account to use.
 * If savedAccountId exists, fetch it directly by ID to avoid pagination issues
 * (me/adaccounts only returns the first 25 by default).
 * Falls back to the first account when no saved ID is set.
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
    if (!data.error && data.id) {
      return { id: data.id, name: data.name ?? "", currency: data.currency ?? "USD" };
    }
  }

  // No saved account or saved account is invalid — use first available
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency&limit=1&access_token=${token}`
  );
  const data = await res.json() as {
    data?: { id: string; name: string; currency: string }[];
    error?: unknown;
  };
  return data.data?.[0] ?? null;
}
