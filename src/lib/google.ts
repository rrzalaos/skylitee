const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.SHOPIFY_APP_URL}/api/auth/google/callback`;

const GSC_SCOPE  = "https://www.googleapis.com/auth/webmasters.readonly";
const GA4_SCOPE  = "https://www.googleapis.com/auth/analytics.readonly";
const GADS_SCOPE = "https://www.googleapis.com/auth/adwords";

export type GoogleService = "gsc" | "ga4" | "gads" | "both";

export function buildGoogleAuthUrl(state: string, service: GoogleService = "both"): string {
  const scope =
    service === "gsc"  ? GSC_SCOPE :
    service === "ga4"  ? GA4_SCOPE :
    service === "gads" ? GADS_SCOPE :
    `${GSC_SCOPE} ${GA4_SCOPE}`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<{ access_token: string; refresh_token?: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code,
    }),
  });
  return res.json();
}

export async function getGoogleAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}
