import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl, GoogleService } from "@/lib/google";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const service = (new URL(req.url).searchParams.get("service") ?? "both") as GoogleService;
  const nonce = crypto.randomBytes(16).toString("hex");
  // Encode service in state so callback knows which token to save
  const state = `${nonce}|${service}`;
  const authUrl = buildGoogleAuthUrl(state, service);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("google_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax" });
  return res;
}
