import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google";
import { getGscRefreshToken, getGa4RefreshToken, getGadsRefreshToken, getAuthorizedShop, getGscSite, getGa4Property } from "@/lib/session";
import { shopKv } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const gscRefresh  = await getGscRefreshToken(req, shop);
  const ga4Refresh  = await getGa4RefreshToken(req, shop);
  const gadsRefresh = await getGadsRefreshToken(req, shop);

  if (!gscRefresh && !ga4Refresh && !gadsRefresh) {
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
      // Paginate through all account summaries (default page size is 50, max 200)
      let pageToken: string | undefined;
      do {
        const url = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
        url.searchParams.set("pageSize", "200");
        if (pageToken) url.searchParams.set("pageToken", pageToken);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as {
          accountSummaries?: { displayName: string; propertySummaries?: { property: string; displayName: string }[] }[];
          nextPageToken?: string;
        };

        const page = (data.accountSummaries ?? [])
          .flatMap(a => (a.propertySummaries ?? []).map(p => ({
            id: p.property,
            name: p.displayName,
            account: a.displayName,
          })));
        ga4Properties.push(...page);
        pageToken = data.nextPageToken;
      } while (pageToken);
    } catch { /* token invalid */ }
  }

  const savedGscSite = await getGscSite(req, shop);
  const savedGa4Property = await getGa4Property(req, shop);

  return NextResponse.json({
    gscConnected:  !!gscRefresh,
    ga4Connected:  !!ga4Refresh,
    gadsConnected: !!gadsRefresh,
    gscSites,
    ga4Properties,
    savedGscSite,
    savedGa4Property,
  });
}

export async function POST(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  const gscRefresh = await getGscRefreshToken(req, shop);
  const ga4Refresh = await getGa4RefreshToken(req, shop);
  if (!gscRefresh && !ga4Refresh) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const { gscSite, ga4Property } = await req.json() as { gscSite?: string; ga4Property?: string };
  const res = NextResponse.json({ ok: true });
  const opts = { httpOnly: true, maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const };
  if (gscSite) {
    await shopKv.setGscSite(shop, gscSite);
    res.cookies.set("google_gsc_site", gscSite, opts);
  }
  if (ga4Property) {
    await shopKv.setGa4Property(shop, ga4Property);
    res.cookies.set("google_ga4_property", ga4Property, opts);
  }
  return res;
}
