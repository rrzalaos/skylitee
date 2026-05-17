import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = buildGoogleAuthUrl(state);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("google_state", state, { httpOnly: true, maxAge: 600, sameSite: "lax" });
  return res;
}
