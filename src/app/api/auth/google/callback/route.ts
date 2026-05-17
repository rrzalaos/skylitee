import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/google";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("google_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/dashboard/connections?error=google", req.url));
  }

  // State format: "{nonce}|{service}" — service is "gsc", "ga4", or "both"
  const service = state.split("|")[1] ?? "both";

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/dashboard/connections?error=no_refresh_token", req.url));
    }

    const res = NextResponse.redirect(new URL(`/dashboard/connections?connected=${service}`, req.url));
    const cookieOpts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };

    if (service === "gsc") {
      res.cookies.set("google_gsc_token", tokens.refresh_token, cookieOpts);
    } else if (service === "ga4") {
      res.cookies.set("google_ga4_token", tokens.refresh_token, cookieOpts);
    } else {
      // "both" — legacy path: single token covers both
      res.cookies.set("google_refresh_token", tokens.refresh_token, cookieOpts);
    }

    res.cookies.delete("google_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/dashboard/connections?error=google_failed", req.url));
  }
}
