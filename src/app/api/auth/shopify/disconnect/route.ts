import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { requireShopPermission } from "@/lib/session";

export async function POST(req: NextRequest) {
  const perm = await requireShopPermission(req, "connections");
  if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: perm.status });
  await shopKv.delToken(perm.shop);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("shopify_token");
  res.cookies.delete("shopify_shop");
  res.cookies.delete("shopify_state");
  return res;
}
