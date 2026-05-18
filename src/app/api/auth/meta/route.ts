import { NextResponse } from "next/server";

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.vercel.app";

export async function GET() {
  const appId = process.env.META_APP_ID;
  if (!appId) return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 500 });

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", `${APP_URL}/api/auth/meta/callback`);
  url.searchParams.set("scope", "ads_read");
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}
