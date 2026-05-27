import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google";
import { getGadsRefreshToken, getGadsCustomerId, getAuthorizedShop } from "@/lib/session";
import { shopKv } from "@/lib/kv";

const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "";

interface GadsSearchResult {
  results?: { customer?: { id?: string; descriptiveName?: string; currencyCode?: string } }[];
}

async function gadsSearch(accessToken: string, customerId: string, query: string): Promise<GadsSearchResult> {
  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": DEV_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  return res.json() as Promise<GadsSearchResult>;
}

export async function GET(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });

  if (!DEV_TOKEN) {
    return NextResponse.json({ error: "google_ads_dev_token_missing" }, { status: 503 });
  }

  const refreshToken = await getGadsRefreshToken(req, shop);
  if (!refreshToken) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  try {
    const accessToken = await getGoogleAccessToken(refreshToken);

    // List all accessible customer resource names
    const listRes = await fetch(
      "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": DEV_TOKEN,
        },
      }
    );
    const listData = await listRes.json() as { resourceNames?: string[]; error?: { message: string } };

    if (listData.error || !listData.resourceNames?.length) {
      return NextResponse.json({ error: "no_customers", detail: listData.error?.message }, { status: 400 });
    }

    // Fetch name + currency for each customer (parallel, max 20)
    const customerIds = listData.resourceNames
      .map(r => r.replace("customers/", ""))
      .slice(0, 20);

    const details = await Promise.allSettled(
      customerIds.map(async (id) => {
        const data = await gadsSearch(
          accessToken,
          id,
          "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1"
        );
        const row = data.results?.[0]?.customer;
        return {
          id,
          name: row?.descriptiveName ?? `Account ${id}`,
          currency: row?.currencyCode ?? "USD",
        };
      })
    );

    const customers = details
      .filter(r => r.status === "fulfilled")
      .map(r => (r as PromiseFulfilledResult<{ id: string; name: string; currency: string }>).value);

    const savedCustomerId = await getGadsCustomerId(req, shop);

    return NextResponse.json({ customers, savedCustomerId });
  } catch (e) {
    console.error("Google Ads customers error:", e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const shop = await getAuthorizedShop(req);
  if (!shop) return NextResponse.json({ error: "not_authorized" }, { status: 403 });

  const { customerId } = await req.json() as { customerId?: string };
  if (!customerId) return NextResponse.json({ error: "missing_customer_id" }, { status: 400 });

  await shopKv.setGadsCustomerId(shop, customerId);
  return NextResponse.json({ ok: true });
}
