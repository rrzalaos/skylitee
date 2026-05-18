import { NextRequest, NextResponse } from "next/server";
import { shopifyApiUrl } from "@/lib/shopify";

type RawOrder = {
  id: number;
  customer?: { id: number };
  created_at: string;
  total_price: string;
};

async function fetchAllOrders(shop: string, token: string): Promise<RawOrder[]> {
  const headers = { "X-Shopify-Access-Token": token, "Content-Type": "application/json" };
  const all: RawOrder[] = [];

  let path = `/orders.json?limit=250&status=any&fields=id,customer,created_at,total_price`;

  for (let i = 0; i < 10; i++) {
    const res = await fetch(shopifyApiUrl(shop, path), { headers });
    if (!res.ok) break;

    const data = await res.json() as { orders: RawOrder[] };
    all.push(...data.orders);

    if (data.orders.length < 250) break;

    const link = res.headers.get("Link") ?? "";
    const match = link.match(/<[^>]+[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
    if (!match) break;
    path = `/orders.json?limit=250&page_info=${match[1]}`;
  }

  return all;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function addMonths(key: string, offset: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return monthKey(d);
}

export async function GET(req: NextRequest) {
  const shop = process.env.SHOPIFY_STORE ?? req.cookies.get("shopify_shop")?.value;
  const token = process.env.SHOPIFY_ACCESS_TOKEN ?? req.cookies.get("shopify_token")?.value;
  if (!shop || !token) return NextResponse.json({ error: "not_connected" }, { status: 401 });

  const rawOrders = await fetchAllOrders(shop, token);

  // Group orders by customer
  const customerOrders = new Map<number, { date: Date; price: number }[]>();
  for (const o of rawOrders) {
    if (!o.customer?.id) continue;
    const entry = customerOrders.get(o.customer.id) ?? [];
    entry.push({ date: new Date(o.created_at), price: parseFloat(o.total_price) });
    customerOrders.set(o.customer.id, entry);
  }

  // Sort each customer's orders chronologically
  customerOrders.forEach((orders) => orders.sort((a, b) => a.date.getTime() - b.date.getTime()));

  // Determine each customer's acquisition cohort (month of first order)
  const customerCohort = new Map<number, string>();
  customerOrders.forEach((orders, customerId) => {
    customerCohort.set(customerId, monthKey(orders[0].date));
  });

  // Build cohort sets and revenue
  const cohortCustomers = new Map<string, Set<number>>();
  const cohortRevenue = new Map<string, number>();

  customerOrders.forEach((orders, customerId) => {
    const cohort = customerCohort.get(customerId)!;
    if (!cohortCustomers.has(cohort)) cohortCustomers.set(cohort, new Set());
    cohortCustomers.get(cohort)!.add(customerId);
    const rev = orders.reduce((s, o) => s + o.price, 0);
    cohortRevenue.set(cohort, (cohortRevenue.get(cohort) ?? 0) + rev);
  });

  // Last 6 calendar months (oldest → newest)
  const now = new Date();
  const cohortMonths: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    cohortMonths.push(monthKey(d));
  }

  const nowKey = monthKey(now);

  const matrix = cohortMonths.map((cohort) => {
    const customers = cohortCustomers.get(cohort)?.size ?? 0;
    const retention: (number | null)[] = [];

    for (let offset = 0; offset <= 5; offset++) {
      const targetKey = addMonths(cohort, offset);

      // Future month — no data yet
      if (targetKey > nowKey) {
        retention.push(null);
        continue;
      }

      if (offset === 0) {
        retention.push(customers > 0 ? 100 : null);
        continue;
      }

      if (customers === 0) {
        retention.push(null);
        continue;
      }

      const [ty, tm] = targetKey.split("-").map(Number);
      let count = 0;
      cohortCustomers.get(cohort)?.forEach((customerId) => {
        const orders = customerOrders.get(customerId) ?? [];
        const bought = orders.some(
          (o) => o.date.getFullYear() === ty && o.date.getMonth() + 1 === tm
        );
        if (bought) count++;
      });

      retention.push(Math.round((count / customers) * 100));
    }

    return {
      month: monthLabel(cohort),
      customers,
      retention,
      revenue: Math.round(cohortRevenue.get(cohort) ?? 0),
    };
  });

  // Revenue by cohort bar chart (top 5 by revenue)
  const revenueChart = matrix
    .filter((r) => r.customers > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRev = revenueChart[0]?.revenue ?? 1;
  const revenueByMonth = revenueChart.map((r) => ({
    month: r.month,
    revenue: r.revenue,
    pct: Math.round((r.revenue / maxRev) * 100),
  }));

  // Summary stats for insights
  const activeCohorts = matrix.filter((r) => r.customers > 0);
  const bestMonth1 = activeCohorts.reduce(
    (best, r) => {
      const m1 = r.retention[1] ?? 0;
      return m1 > (best?.val ?? 0) ? { month: r.month, val: m1 } : best;
    },
    null as { month: string; val: number } | null
  );
  const month2Values = activeCohorts.map((r) => r.retention[2]).filter((v): v is number => v !== null);
  const avgMonth2 = month2Values.length ? Math.round(month2Values.reduce((s, v) => s + v, 0) / month2Values.length) : null;
  const totalCustomers = activeCohorts.reduce((s, r) => s + r.customers, 0);
  const totalRevenue = activeCohorts.reduce((s, r) => s + r.revenue, 0);
  const avgOrderValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  return NextResponse.json({
    matrix,
    revenueByMonth,
    insights: { bestMonth1, avgMonth2, totalCustomers, avgOrderValue },
  });
}
