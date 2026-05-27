import { NextRequest, NextResponse } from "next/server";
import { shopKv } from "@/lib/kv";
import { getShopFromRequest } from "@/lib/session";

export async function POST(req: NextRequest) {
  const service = new URL(req.url).searchParams.get("service") ?? "all";
  const shop = getShopFromRequest(req) ?? "unknown";
  const res = NextResponse.json({ ok: true });

  if (service === "gsc") {
    await shopKv.delGscToken(shop);
    res.cookies.delete("google_gsc_token");
    res.cookies.delete("google_gsc_site");
  } else if (service === "ga4") {
    await shopKv.delGa4Token(shop);
    res.cookies.delete("google_ga4_token");
    res.cookies.delete("google_ga4_property");
  } else if (service === "gads") {
    await shopKv.delGadsToken(shop);
    await shopKv.delGadsCustomerId(shop);
  } else {
    await shopKv.delGscToken(shop);
    await shopKv.delGa4Token(shop);
    res.cookies.delete("google_refresh_token");
    res.cookies.delete("google_gsc_token");
    res.cookies.delete("google_ga4_token");
    res.cookies.delete("google_gsc_site");
    res.cookies.delete("google_ga4_property");
    res.cookies.delete("google_state");
  }

  return res;
}
