import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, registerUninstallWebhook } from "@/lib/shopify";
import { shopKv } from "@/lib/kv";
import { recordInstall, getFunnel } from "@/lib/funnel";
import { startOnboarding, isOnboardingPending, setPendingInstallCookie } from "@/lib/onboarding";
import { getSession, addShopToUser, updateSessionShop, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { embeddedModeOn, shopAdminAppUrl } from "@/lib/embedded";
import { INSTALL_FROM_ADMIN_COOKIE } from "@/lib/embedded-server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("shopify_state")?.value;

  if (!code || !shop || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/connect?error=1", req.url));
  }

  try {
    // A store Skylitee has never seen (no token, no connect date, no funnel record) is a brand
    // new merchant → guided onboarding. Existing stores keep their old flow untouched.
    const [prevToken, prevConnectedAt, prevFunnel] = await Promise.all([
      shopKv.getTokenRecord(shop),
      shopKv.getConnectedAt(shop),
      getFunnel(shop),
    ]);
    const isNewStore = !prevToken && !prevConnectedAt && !prevFunnel?.installedAt;

    const token = await exchangeCodeForToken(shop, code);
    await shopKv.setTokenRecord(shop, token);
    await Promise.allSettled([
      recordInstall(shop),
      registerUninstallWebhook(shop, token.access_token),
      isNewStore ? startOnboarding(shop) : Promise.resolve(),
    ]);

    // Link shop to user account if session exists
    let linked = false;
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    if (sessionToken) {
      const session = await getSession(sessionToken);
      if (session?.email) {
        await addShopToUser(session.email, shop);
        await updateSessionShop(sessionToken, shop);
        linked = true;
        // Record connect date + owner once (first connector), for the admin store view.
        if (!(await shopKv.getConnectedAt(shop))) {
          await shopKv.setConnectedAt(shop, new Date().toISOString());
          await shopKv.setOwner(shop, session.email);
        }
      }
    }

    // Installed from the Shopify admin / App Store: reopen inside the admin, where the store
    // owner is logged in automatically (no signup). Website installs keep the flow below.
    const fromAdmin = req.cookies.get(INSTALL_FROM_ADMIN_COOKIE)?.value === "1";
    if (embeddedModeOn() && (fromAdmin || !linked)) {
      if (!(await shopKv.getConnectedAt(shop))) await shopKv.setConnectedAt(shop, new Date().toISOString());
      const res = NextResponse.redirect(shopAdminAppUrl(shop));
      res.cookies.delete(INSTALL_FROM_ADMIN_COOKIE);
      res.cookies.delete("shopify_state");
      return res;
    }

    // Onboarding merchants see their Store X-Ray before any paywall. Not logged in (App Store
    // install): sign up / log in first — a signed cookie links the store to that account.
    let destination: string;
    if (!linked) {
      destination = isNewStore ? "/signup?from=install" : "/login";
    } else if (await isOnboardingPending(shop)) {
      destination = "/welcome";
    } else {
      destination = (await shopKv.getPlan(shop)) ? "/dashboard" : "/dashboard/pricing";
    }

    const res = NextResponse.redirect(new URL(destination, req.url));
    const cookieOpts = { httpOnly: true, maxAge: SESSION_MAX_AGE, sameSite: "lax" as const, path: "/" };
    res.cookies.set("shopify_shop", shop, cookieOpts);
    if (!linked) setPendingInstallCookie(res, shop);
    res.cookies.delete("shopify_token");
    res.cookies.delete("shopify_state");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/connect?error=2", req.url));
  }
}
