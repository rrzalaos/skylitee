export interface MetaAccount {
  id: string;
  name: string;
  currency: string;
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
