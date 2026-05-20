import { NextRequest, NextResponse } from "next/server";
import { getMetaToken, getMetaAdAccount, getAuthorizedShop } from "@/lib/session";
import { shopKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const token = await getMetaToken(req, shop);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
  const meData = await meRes.json() as { id?: string; name?: string; error?: { message: string } };

  // Paginate through all ad accounts (default limit is 25, users may have 100+)
  type AdAccount = { id: string; name: string; currency: string; account_status: number };
  const accounts: AdAccount[] = [];
  let nextUrl: string | null =
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency,account_status&limit=200&access_token=${token}`;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const data = await res.json() as {
      data?: AdAccount[];
      paging?: { next?: string };
      error?: { message: string };
    };
    if (data.error) return NextResponse.json({ error: "token_expired" }, { status: 401 });
    accounts.push(...(data.data ?? []));
    nextUrl = data.paging?.next ?? null;
  }
  const savedAccount = await getMetaAdAccount(req, shop);
  const selected = (savedAccount && accounts.find(a => a.id === savedAccount)) || accounts[0];

  return NextResponse.json({
    connected: true,
    connectedUserName: meData.name ?? null,
    connectedUserId: meData.id ?? null,
    accounts: accounts.map(a => ({ id: a.id, name: a.name, currency: a.currency })),
    selectedAccountId: selected?.id ?? null,
    selectedAccountName: selected?.name ?? null,
  });
}

export async function POST(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
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
