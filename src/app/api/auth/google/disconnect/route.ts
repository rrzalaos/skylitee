import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const service = new URL(req.url).searchParams.get("service") ?? "all";
  const res = NextResponse.json({ ok: true });

  if (service === "gsc") {
    res.cookies.delete("google_gsc_token");
    res.cookies.delete("google_gsc_site");
  } else if (service === "ga4") {
    res.cookies.delete("google_ga4_token");
    res.cookies.delete("google_ga4_property");
  } else {
    // Disconnect all Google
    res.cookies.delete("google_refresh_token");
    res.cookies.delete("google_gsc_token");
    res.cookies.delete("google_ga4_token");
    res.cookies.delete("google_gsc_site");
    res.cookies.delete("google_ga4_property");
    res.cookies.delete("google_state");
  }

  return res;
}
