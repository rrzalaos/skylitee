import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google";

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get("google_refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const token = await getGoogleAccessToken(refreshToken);

  const [sitesRes, accountsRes] = await Promise.all([
    fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  const sitesData = await sitesRes.json() as { siteEntry?: { siteUrl: string; permissionLevel: string }[] };
  const accountsData = await accountsRes.json() as {
    accountSummaries?: { displayName: string; propertySummaries?: { property: string; displayName: string }[] }[]
  };

  const gscSites = (sitesData.siteEntry ?? []).map(s => ({ url: s.siteUrl, permission: s.permissionLevel }));
  const ga4Properties = (accountsData.accountSummaries ?? [])
    .flatMap(a => (a.propertySummaries ?? []).map(p => ({
      id: p.property,
      name: p.displayName,
      account: a.displayName,
    })));

  const savedGscSite = req.cookies.get("google_gsc_site")?.value ?? null;
  const savedGa4Property = req.cookies.get("google_ga4_property")?.value ?? null;

  return NextResponse.json({ gscSites, ga4Properties, savedGscSite, savedGa4Property });
}

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("google_refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const { gscSite, ga4Property } = await req.json() as { gscSite: string; ga4Property: string };

  const res = NextResponse.json({ ok: true });
  const opts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
  if (gscSite) res.cookies.set("google_gsc_site", gscSite, opts);
  if (ga4Property) res.cookies.set("google_ga4_property", ga4Property, opts);
  return res;
}
