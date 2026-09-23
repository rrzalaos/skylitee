import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { requireShopPermission } from "@/lib/session";

export async function POST(req: NextRequest) {
  const perm = await requireShopPermission(req, "connections");
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status });
  const shop = perm.shop;
  await shopKv.delMetaToken(shop);
  await shopKv.delMetaAccount(shop);

  const res = NextResponse.json({ ok: true });
  const opts = { maxAge: 0, path: "/" };
  res.cookies.set("meta_token", "", opts);
  res.cookies.set("meta_ad_account", "", opts);
  return res;
}
