import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop } from "@/lib/session";
import { competitorKv } from "@/lib/kv";
import { type Competitor } from "@/lib/competitors";
import { getCompetitorStore } from "@/lib/shopify-public";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  // Own catalogue read the same public way as a competitor's, so prices compare like for like
  if (req.nextUrl.searchParams.get("own") === "1") {
    return NextResponse.json({ status: "ok", data: await getCompetitorStore(shop) });
  }
  const list = (await competitorKv.getList<Competitor>(shop)) ?? [];
  const c = list.find(x => x.id === req.nextUrl.searchParams.get("id"));
  if (!c) return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  if (!c.website) return NextResponse.json({ status: "error", message: "Add this competitor's website to see their prices." });
  const data = await getCompetitorStore(c.website);
  return NextResponse.json({ status: "ok", data });
}
