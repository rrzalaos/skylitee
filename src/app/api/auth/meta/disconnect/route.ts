import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { getShopFromRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  const shop = getShopFromRequest(req) ?? "unknown";
  await shopKv.delMetaToken(shop);
  await shopKv.delMetaAccount(shop);

  const res = NextResponse.json({ ok: true });
  const opts = { maxAge: 0, path: "/" };
  res.cookies.set("meta_token", "", opts);
  res.cookies.set("meta_ad_account", "", opts);
  return res;
}
