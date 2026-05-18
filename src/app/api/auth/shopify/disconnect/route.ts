import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { getShopFromRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  const shop = getShopFromRequest(req);
  if (shop) await shopKv.delToken(shop);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("shopify_token");
  res.cookies.delete("shopify_shop");
  res.cookies.delete("shopify_state");
  return res;
}
