import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const opts = { maxAge: 0, path: "/" };
  res.cookies.set("meta_token", "", opts);
  res.cookies.set("meta_ad_account", "", opts);
  return res;
}
