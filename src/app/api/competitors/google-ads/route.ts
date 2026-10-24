import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop } from "@/lib/session";
import { competitorKv } from "@/lib/kv";
import { getCountry, googleAdStats, type Competitor } from "@/lib/competitors";
import { getCompetitorGoogleAds } from "@/lib/dataforseo";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const list = (await competitorKv.getList<Competitor>(shop)) ?? [];
  const c = list.find(x => x.id === sp.get("id"));
  if (!c) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  if (!c.website) return NextResponse.json({ status: "error", message: "Add this competitor's website to see their Google ads." });

  const result = await getCompetitorGoogleAds(c.website, getCountry(sp.get("country")), { refresh: sp.get("refresh") === "1" });
  return NextResponse.json(result.status === "ok" ? { ...result, stats: googleAdStats(result.data.ads) } : result);
}
