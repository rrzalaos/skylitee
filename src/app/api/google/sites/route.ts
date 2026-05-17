import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google";

export async function GET(req: NextRequest) {
  // Service-specific tokens take priority; fall back to the combined legacy token
  const gscRefresh =
    req.cookies.get("google_gsc_token")?.value ??
    req.cookies.get("google_refresh_token")?.value ?? null;

  const ga4Refresh =
    req.cookies.get("google_ga4_token")?.value ??
    req.cookies.get("google_refresh_token")?.value ?? null;

  if (!gscRefresh && !ga4Refresh) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  let gscSites: { url: string; permission?: string }[] = [];
  let ga4Properties: { id: string; name: string; account: string }[] = [];

  if (gscRefresh) {
    try {
      const token = await getGoogleAccessToken(gscRefresh);
      const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { siteEntry?: { siteUrl: string; permissionLevel: string }[] };
      gscSites = (data.siteEntry ?? []).map(s => ({ url: s.siteUrl, permission: s.permissionLevel }));
    } catch { /* token invalid */ }
  }

  if (ga4Refresh) {
    try {
      const token = await getGoogleAccessToken(ga4Refresh);
      const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as {
        accountSummaries?: { displayName: string; propertySummaries?: { property: string; displayName: string }[] }[]
      };
      ga4Properties = (data.accountSummaries ?? [])
        .flatMap(a => (a.propertySummaries ?? []).map(p => ({
          id: p.property,
          name: p.displayName,
          account: a.displayName,
        })));
    } catch { /* token invalid */ }
  }

  const savedGscSite = req.cookies.get("google_gsc_site")?.value ?? null;
  const savedGa4Property = req.cookies.get("google_ga4_property")?.value ?? null;

  return NextResponse.json({
    gscConnected: !!gscRefresh,
    ga4Connected: !!ga4Refresh,
    gscSites,
    ga4Properties,
    savedGscSite,
    savedGa4Property,
  });
}

export async function POST(req: NextRequest) {
  const anyToken =
    req.cookies.get("google_gsc_token")?.value ??
    req.cookies.get("google_ga4_token")?.value ??
    req.cookies.get("google_refresh_token")?.value;
  if (!anyToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const { gscSite, ga4Property } = await req.json() as { gscSite?: string; ga4Property?: string };
  const res = NextResponse.json({ ok: true });
  const opts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
  if (gscSite) res.cookies.set("google_gsc_site", gscSite, opts);
  if (ga4Property) res.cookies.set("google_ga4_property", ga4Property, opts);
  return res;
}
