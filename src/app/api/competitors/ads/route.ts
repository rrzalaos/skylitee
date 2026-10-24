import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop, getMetaToken } from "@/lib/session";
import { competitorKv } from "@/lib/kv";
import { getCompetitorAds, getCountry, adStats, type Competitor } from "@/lib/competitors";

// The scraper run can take a couple of minutes on a cold fetch; cached hits are instant.
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const list = (await competitorKv.getList<Competitor>(shop)) ?? [];
  const c = list.find(x => x.id === sp.get("id"));
  if (!c) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });

  const country = getCountry(sp.get("country"));
  const shopMetaToken = await getMetaToken(req, shop);
  const result = await getCompetitorAds(c, country, { refresh: sp.get("refresh") === "1", shopMetaToken });

  // Remember the page id we learned so later fetches (and other stores) share one cache entry
  if (result.learnedPageId) {
    const fresh = (await competitorKv.getList<Competitor>(shop)) ?? [];
    await competitorKv.setList(shop, fresh.map(x => (x.id === c.id ? { ...x, pageId: result.learnedPageId } : x)));
  }

  if (result.status !== "ok") return NextResponse.json(result);
  return NextResponse.json({ ...result, stats: adStats(result.data.ads) });
}
