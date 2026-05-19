import { NextRequest, NextResponse } from "next/server";
import { getUser, createResetToken } from "@/lib/auth";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@skylitee.io";
const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://skylitee.io";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await getUser(email);
  // Always return ok to avoid email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = await createResetToken(user.email);
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: "Reset your Skylitee password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 22px; font-weight: 800; color: #18181B; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #71717A; font-size: 15px; margin-bottom: 24px;">
          Hi ${user.name}, click the button below to reset your Skylitee password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #F97316; color: white; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          Reset Password →
        </a>
        <p style="color: #A1A1AA; font-size: 13px; margin-top: 24px;">
          If you didn't request this, ignore this email. Your password won't change.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
