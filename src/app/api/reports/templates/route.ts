import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getAuthorizedShop } from "@/lib/session";

export interface ReportTemplate {
  id: string;
  name: string;
  blocks: string[];
  branding: { brandName?: string; color?: string; clientName?: string; logoDataUrl?: string; reportTitle?: string };
  createdAt: string;
}

const key = (shop: string) => `shop:${shop}:report_templates`;

async function load(shop: string): Promise<ReportTemplate[]> {
  try { return (await kv.get<ReportTemplate[]>(key(shop))) ?? []; } catch { return []; }
}

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  return NextResponse.json({ templates: await load(shop) });
}

export async function POST(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const body = await req.json() as Partial<ReportTemplate>;
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });
  if (!Array.isArray(body.blocks) || body.blocks.length === 0) {
    return NextResponse.json({ error: "Select at least one block" }, { status: 400 });
  }

  const templates = await load(shop);
  // Update in place if a template with this id exists, else create.
  const id = body.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tpl: ReportTemplate = {
    id, name,
    blocks: body.blocks,
    branding: body.branding ?? {},
    createdAt: templates.find(t => t.id === id)?.createdAt ?? new Date().toISOString(),
  };
  const next = templates.some(t => t.id === id)
    ? templates.map(t => (t.id === id ? tpl : t))
    : [tpl, ...templates];

  try { await kv.set(key(shop), next.slice(0, 50)); } catch { /* KV not configured */ }
  return NextResponse.json({ template: tpl });
}

export async function DELETE(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_connected" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const templates = await load(shop);
  try { await kv.set(key(shop), templates.filter(t => t.id !== id)); } catch { /* KV not configured */ }
  return NextResponse.json({ ok: true });
}
