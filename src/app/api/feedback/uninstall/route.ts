import { NextRequest, NextResponse } from "next/server";
import { verifyFeedbackSig, recordUninstallReason, UNINSTALL_REASONS, type UninstallReason } from "@/lib/funnel";

// Stores the reason a merchant picked in the uninstall-feedback email. No login needed —
// the signed link (sig) proves the answer is for that shop.
export async function POST(req: NextRequest) {
  const { shop, sig, reason, note } = await req.json() as { shop?: string; sig?: string; reason?: string; note?: string };
  if (!shop || !sig || !verifyFeedbackSig(shop, sig)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  if (!UNINSTALL_REASONS.some(r => r.key === reason)) {
    return NextResponse.json({ error: "Pick a reason" }, { status: 400 });
  }
  await recordUninstallReason(shop, reason as UninstallReason, typeof note === "string" ? note.trim() : "");
  return NextResponse.json({ ok: true });
}
