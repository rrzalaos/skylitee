import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop, getGscSite } from "@/lib/session";
import { competitorKv } from "@/lib/kv";
import { getCountry, normalizeDomain, type Competitor } from "@/lib/competitors";
import { getCompetitorTraffic } from "@/lib/dataforseo";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const list = (await competitorKv.getList<Competitor>(shop)) ?? [];
  const c = list.find(x => x.id === sp.get("id"));
  if (!c) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  if (!c.website) return NextResponse.json({ status: "error", message: "Add this competitor's website to see their traffic." });

  // The user's own domain (for the keyword gap) comes from their Search Console property
  const gscSite = await getGscSite(req, shop);
  const ownDomain = normalizeDomain(gscSite?.replace(/^sc-domain:/, ""));

  const result = await getCompetitorTraffic(c.website, getCountry(sp.get("country")), {
    refresh: sp.get("refresh") === "1",
    ownDomain,
  });
  return NextResponse.json(result);
}
