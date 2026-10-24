import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop, requireShopPermission, getMetaToken } from "@/lib/session";
import { competitorKv } from "@/lib/kv";
import { CI_LIMITS, normalizeDomain, pageIdFromUrl, type Competitor } from "@/lib/competitors";
import { dfsConfigured } from "@/lib/dataforseo";

// Competitor list for the current store + which data providers are switched on.

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const [list, metaToken] = await Promise.all([
    competitorKv.getList<Competitor>(shop),
    getMetaToken(req, shop),
  ]);
  return NextResponse.json({
    competitors: list ?? [],
    limit: CI_LIMITS.maxCompetitors,
    providers: {
      adsAnyCountry: !!process.env.APIFY_TOKEN,
      adsEu: !!process.env.APIFY_TOKEN || !!process.env.META_AD_LIBRARY_TOKEN || !!metaToken,
      euReach: !!process.env.META_AD_LIBRARY_TOKEN || !!metaToken,
      traffic: dfsConfigured(),
      ai: !!process.env.ANTHROPIC_API_KEY,
    },
  });
}

function cleanPageUrl(input: unknown): string | undefined {
  if (typeof input !== "string" || !input.trim()) return undefined;
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) {
    // bare page handle, e.g. "mybrand" or "facebook.com/mybrand"
    s = s.replace(/^(www\.|m\.)?facebook\.com\//i, "");
    s = `https://www.facebook.com/${s.replace(/^@/, "")}`;
  }
  try {
    const u = new URL(s);
    if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return undefined;
    return u.toString();
  } catch { return undefined; }
}

export async function POST(req: NextRequest) {
  const auth = await requireShopPermission(req, "edit");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => ({})) as { name?: string; pageUrl?: string; pageId?: string; website?: string };

  const name = (body.name ?? "").trim().slice(0, 80);
  const pageUrl = cleanPageUrl(body.pageUrl);
  const pageId = (typeof body.pageId === "string" && /^\d{5,}$/.test(body.pageId.trim()) ? body.pageId.trim() : undefined)
    ?? pageIdFromUrl(pageUrl) ?? undefined;
  const website = normalizeDomain(body.website) ?? undefined;
  if (!name) return NextResponse.json({ error: "Give the competitor a name" }, { status: 400 });
  if (body.pageUrl && !pageUrl) return NextResponse.json({ error: "That doesn't look like a Facebook page link" }, { status: 400 });
  if (body.website && !website) return NextResponse.json({ error: "That doesn't look like a website address" }, { status: 400 });
  if (!pageUrl && !pageId && !website) {
    return NextResponse.json({ error: "Add their Facebook page link or website (or both)" }, { status: 400 });
  }

  const list = (await competitorKv.getList<Competitor>(auth.shop)) ?? [];
  if (list.length >= CI_LIMITS.maxCompetitors) {
    return NextResponse.json({ error: `You can track up to ${CI_LIMITS.maxCompetitors} competitors — remove one first` }, { status: 400 });
  }
  const dupe = list.find(c => (website && c.website === website) || (pageUrl && c.pageUrl === pageUrl) || (pageId && c.pageId === pageId));
  if (dupe) return NextResponse.json({ error: `${dupe.name} is already on your list` }, { status: 400 });

  const competitor: Competitor = {
    id: crypto.randomUUID().slice(0, 8),
    name, pageUrl, pageId, website,
    addedAt: new Date().toISOString(),
  };
  await competitorKv.setList(auth.shop, [...list, competitor]);
  return NextResponse.json({ competitor });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireShopPermission(req, "edit");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = req.nextUrl.searchParams.get("id");
  const list = (await competitorKv.getList<Competitor>(auth.shop)) ?? [];
  await competitorKv.setList(auth.shop, list.filter(c => c.id !== id));
  return NextResponse.json({ ok: true });
}
