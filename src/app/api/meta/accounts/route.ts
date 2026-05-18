import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getShopFromRequest } from "@/lib/session";
import { shopKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const shop = getShopFromRequest(req) ?? "unknown";
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency,account_status&access_token=${token}`
  );
  const data = await res.json() as {
    data?: { id: string; name: string; currency: string; account_status: number }[];
    error?: { message: string };
  };

  if (data.error) return NextResponse.json({ error: "token_expired" }, { status: 401 });

  const accounts = data.data ?? [];
  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = (savedAccount && accounts.find(a => a.id === savedAccount)) || accounts[0];

  return NextResponse.json({
    connected: true,
    accounts: accounts.map(a => ({ id: a.id, name: a.name, currency: a.currency })),
    selectedAccountId: selected?.id ?? null,
    selectedAccountName: selected?.name ?? null,
  });
}

export async function POST(req: NextRequest) {
  const shop = getShopFromRequest(req) ?? "unknown";
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const { adAccount } = await req.json() as { adAccount: string };
  await shopKv.setMetaAccount(shop, adAccount);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("meta_ad_account", adAccount, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
