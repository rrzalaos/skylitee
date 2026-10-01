import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { verifyWeeklySig } from "@/lib/weekly-summary";

// One-click "Stop these emails" link from the weekly summary. Signed per shop so only
// the emailed merchant can turn it off. ?resume=1 turns it back on.
export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  const resume = req.nextUrl.searchParams.get("resume") === "1";
  const page = (msg: string) => new NextResponse(
    `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#FAFAF9;padding:48px 16px;text-align:center"><div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:28px"><p style="font-size:16px;color:#18181B">${msg}</p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
  if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shop) || !verifyWeeklySig(shop, sig)) return page("This link isn't valid.");

  if (resume) {
    await kv.del(`shop:${shop}:weekly_off`);
    return page("Weekly summaries are back on. See you Monday.");
  }
  await kv.set(`shop:${shop}:weekly_off`, 1);
  const back = `${req.nextUrl.pathname}?shop=${encodeURIComponent(shop)}&sig=${sig}&resume=1`;
  return page(`Done — you won't get weekly summaries any more.<br><br><a href="${back}" style="color:#EA580C;font-weight:700">Changed your mind? Turn them back on</a>`);
}
