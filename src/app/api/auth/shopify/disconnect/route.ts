import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("shopify_token");
  res.cookies.delete("shopify_shop");
  res.cookies.delete("shopify_state");
  return res;
}
