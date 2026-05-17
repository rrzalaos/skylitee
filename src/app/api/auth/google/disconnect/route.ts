import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("google_refresh_token");
  res.cookies.delete("google_gsc_site");
  res.cookies.delete("google_ga4_property");
  res.cookies.delete("google_state");
  return res;
}
