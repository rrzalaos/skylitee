import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyShopifyWebhook } from "@/lib/webhook";
import { shopKv } from "@/lib/kv";
import { getUser } from "@/lib/auth";
import { recordUninstall, claimUninstallEmail, feedbackSig, UNINSTALL_REASONS } from "@/lib/funnel";

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@skylitee.io";
const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.io";

// Shopify app/uninstalled — fires the moment a merchant removes the app. We record it for the
// admin funnel, drop the now-revoked Shopify token, and send ONE short "why did you leave?"
// email. Everything else (Meta/Google tokens, plan, team) is left for shop/redact 48 days later,
// so a quick reinstall picks up where the merchant left off.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyShopifyWebhook(rawBody, req.headers.get("x-shopify-hmac-sha256"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: { myshopify_domain?: string; email?: string; shop_owner?: string } = {};
  try { payload = JSON.parse(rawBody); } catch { /* keep header fallback */ }
  const shop = req.headers.get("x-shopify-shop-domain") ?? payload.myshopify_domain;
  if (!shop) return NextResponse.json({ ok: true });

  await recordUninstall(shop);
  await shopKv.delToken(shop);

  // Prefer the Skylitee account that connected the store; fall back to the Shopify store email.
  try {
    const ownerEmail = await shopKv.getOwner(shop);
    const owner = ownerEmail ? await getUser(ownerEmail) : null;
    const to = owner?.email ?? payload.email;
    if (to && process.env.RESEND_API_KEY && await claimUninstallEmail(shop)) {
      await sendFeedbackEmail(shop, to, owner?.name ?? payload.shop_owner ?? "there");
    }
  } catch { /* email is best-effort — always ack Shopify */ }

  return NextResponse.json({ ok: true });
}

async function sendFeedbackEmail(shop: string, to: string, name: string) {
  const base = `${APP_URL}/feedback/uninstall?shop=${encodeURIComponent(shop)}&sig=${feedbackSig(shop)}`;
  const buttons = UNINSTALL_REASONS.map(r =>
    `<a href="${base}&r=${r.key}" style="display:block;margin:0 0 8px;padding:11px 16px;border:1px solid #E4E4E7;border-radius:10px;color:#18181B;text-decoration:none;font-size:14px;">${r.label}</a>`
  ).join("");
  const firstName = name.split(" ")[0];

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Quick question — why did you remove Skylitee?",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 800; color: #18181B; margin-bottom: 8px;">Sorry to see you go, ${firstName}</h2>
        <p style="color: #71717A; font-size: 15px; margin-bottom: 20px;">
          You just removed Skylitee from <b>${shop.replace(".myshopify.com", "")}</b>. One click below tells us what went wrong — it really helps us fix it.
        </p>
        ${buttons}
        <p style="color: #A1A1AA; font-size: 13px; margin-top: 20px;">
          Changed your mind? Reinstall any time from the Shopify App Store — your Meta and Google connections are kept for 48 days.
        </p>
      </div>
    `,
  });
}
