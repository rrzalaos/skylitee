import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedShop, getShopRole } from "@/lib/session";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { shopKv } from "@/lib/kv";
import { getAccessState } from "@/lib/access";
import { markOnce } from "@/lib/funnel";
import { getOnboarding, setOnboarding, type OnboardingAnswers } from "@/lib/onboarding";

const GOALS = ["sales", "ad_cost", "profit"];
const ADS = ["meta", "google", "both", "none"];
const REVENUE = ["lt_1l", "1_10l", "gt_10l"];

// /welcome state for the active store: onboarding status, saved answers, what's connected.
export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const session = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  const [onboarding, meta, gsc, ga4, gads, role] = await Promise.all([
    getOnboarding(shop),
    shopKv.getMetaToken(shop),
    shopKv.getGscToken(shop),
    shopKv.getGa4Token(shop),
    shopKv.getGadsToken(shop),
    getShopRole(shop, session?.email ?? ""),
  ]);

  return NextResponse.json({
    shop,
    onboarding,
    role,
    connected: { meta: !!meta, google: !!(gsc || ga4 || gads), gsc: !!gsc, ga4: !!ga4, gads: !!gads },
  });
}

// { answers } → save the 3 answers.   { complete: true } → finish; returns where to go next.
export async function POST(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { answers?: Partial<OnboardingAnswers>; complete?: boolean };
  const now = new Date().toISOString();
  const cur = await getOnboarding(shop) ?? { status: "pending" as const, createdAt: now };

  if (body.answers) {
    const a = body.answers;
    if (!GOALS.includes(a.goal ?? "") || !ADS.includes(a.ads ?? "") || !REVENUE.includes(a.revenue ?? "")) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }
    await setOnboarding(shop, { ...cur, answers: a as OnboardingAnswers, answeredAt: now });
    await markOnce(shop, "questionsAt");
    return NextResponse.json({ ok: true });
  }

  if (body.complete) {
    await setOnboarding(shop, { ...cur, status: "done", completedAt: now });
    await markOnce(shop, "welcomeDoneAt");
    const access = await getAccessState(shop);
    return NextResponse.json({ ok: true, next: access.hasAccess ? "/dashboard" : "/dashboard/pricing" });
  }

  return NextResponse.json({ error: "Nothing to do" }, { status: 400 });
}
