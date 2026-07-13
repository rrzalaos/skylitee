// Performance Marketing report model — one place that turns the raw API responses into the
// store-owner-friendly structure rendered by both the on-screen report and the PDF.
import { formatINR } from "@/lib/utils";
import { buildRows, type MwRow } from "../seo/monthwise";

/* ── raw input shapes (only the fields we read) ── */
export interface SalesIn {
  kpis: {
    grossSales: number; totalOrders: number; aov: number; newCustomers: number; returningCustomers: number;
    codOrders: number; prepaidOrders: number; avgItemsPerOrder: number; totalItems?: number; distinctSkus?: number;
  };
}
export interface MetaCampaignIn { name: string; status: string; objective: string; spend: number; impressions: number; reach: number; clicks: number; ctr: number; cpc: number; cpm: number; purchases: number; purchaseValue: number; leads: number; roas: number; }
export interface MetaIn {
  kpis: {
    spend: number; roas: number; cac: number; purchases: number; purchaseValue: number; leads: number; costPerLead: number;
    impressions: number; reach: number; frequency: number; cpm: number; clicks: number; ctr: number; cpc: number;
    lpv: number; atc: number; atcRatio: number; checkout: number; checkoutRatio: number; purchaseRatio: number;
  };
  campaigns: MetaCampaignIn[];
}
export interface PlacementBucket { label: string; spend: number; purchases: number; leads: number; clicks: number; roas: number; spendPct: number; }
export interface PlacementIn { placements: (PlacementBucket & { group: string })[]; breakdowns: { age: PlacementBucket[]; gender: PlacementBucket[]; device: PlacementBucket[]; hourly: PlacementBucket[] }; }
export interface MonthIn { ym: string; label: string; revenue?: number; orders?: number; aov?: number; codPct?: number; spend?: number; roas?: number; leads?: number; purchases?: number; }

/* ── output model ── */
export interface KpiCard { label: string; value: string; accent: string; sub?: string }
export interface ObjectiveBlock { key: string; label: string; color: string; spend: number; spendPct: number; cards: { label: string; value: string }[] }
export interface ChannelRow { channel: string; color: string; orders: number; revenue: number; spend: number | null; roas: number | null; ctr: number | null }
export interface FunnelStep { label: string; value: number; pct: number; color: string }
export interface Winner { icon: string; title: string; value: string; detail: string }
export interface Seg { label: string; value: number; color: string }
export interface PerfMonth { ym: string; label: string; grossSales: number; orders: number; aov: number; spend: number; roas: number; codPct: number; leads: number }
export interface Signal { type: "good" | "warn" | "bad"; metric: string; value: string; detail: string }

export interface PerfModel {
  hero: KpiCard[];
  objectives: ObjectiveBlock[];
  revenueMix: Seg[];
  payment: { prepaid: number; cod: number; codPct: number };
  blendedRoas: number;
  totalSpend: number; metaSpend: number; googleSpend: number; googlePending: boolean;
  channels: ChannelRow[];
  funnel: FunnelStep[] | null;
  winners: Winner[];
  campaigns: { name: string; status: string; objective: string; spend: number; roas: number; purchases: number; leads: number }[];
  months: PerfMonth[];
  working: Signal[];
  attention: Signal[];
  conclusion: { positives: string[]; improvements: string[] };
  hasMeta: boolean;
}

const inr = formatINR;
const pct = (n: number) => `${n}%`;

// 3-month comparison rows for the shared MonthwiseTable.
export function perfMonthRows(months: PerfMonth[]): MwRow[] {
  const hasLeads = months.some(m => m.leads > 0);
  return buildRows(months, [
    { key: "Gross Sales", get: m => m.grossSales, fmt: inr, lower: false, accent: "#F97316" },
    { key: "Orders", get: m => m.orders, fmt: n => n.toLocaleString("en-IN"), lower: false, accent: "#3B82F6" },
    { key: "AOV", get: m => m.aov, fmt: inr, lower: false },
    { key: "Ad Spend", get: m => m.spend, fmt: inr, lower: false, accent: "#EF4444" },
    { key: "Blended ROAS", get: m => m.roas, fmt: v => `${v}x`, lower: false, accent: "#22C55E" },
    { key: "COD %", get: m => m.codPct, fmt: v => `${v}%`, lower: true },
    ...(hasLeads ? [{ key: "Leads", get: (m: PerfMonth) => m.leads, fmt: (n: number) => n.toLocaleString("en-IN"), lower: false, accent: "#8B5CF6" }] : []),
  ]);
}

function normObjective(o: string): "Sales" | "Leads" | "Traffic" | "Awareness" | "Other" {
  const x = (o || "").toUpperCase();
  if (x.includes("SALES") || x.includes("CONVERSION") || x.includes("CATALOG") || x.includes("PRODUCT")) return "Sales";
  if (x.includes("LEAD")) return "Leads";
  if (x.includes("TRAFFIC") || x.includes("LINK_CLICK")) return "Traffic";
  if (x.includes("AWARENESS") || x.includes("REACH") || x.includes("BRAND") || x.includes("VIDEO") || x.includes("ENGAGE")) return "Awareness";
  return "Other";
}
const OBJ_META: Record<string, { label: string; color: string }> = {
  Sales: { label: "Sales / Conversions", color: "#22C55E" },
  Leads: { label: "Lead Generation", color: "#8B5CF6" },
  Traffic: { label: "Traffic", color: "#3B82F6" },
  Awareness: { label: "Awareness / Reach", color: "#EC4899" },
  Other: { label: "Other", color: "#94A3B8" },
};

function bestBy<T>(arr: T[], get: (x: T) => number): T | null {
  let best: T | null = null, bv = -Infinity;
  for (const x of arr) { const v = get(x); if (v > bv) { bv = v; best = x; } }
  return bv > 0 ? best : null;
}

export function buildPerfModel(input: {
  sales: SalesIn; meta: MetaIn | null; sessions: number; placement: PlacementIn | null;
  shopMonthly: MonthIn[]; metaMonthly: MonthIn[]; googleSpend: number; googleConnected: boolean;
}): PerfModel {
  const { sales, meta, sessions, placement, shopMonthly, metaMonthly, googleSpend, googleConnected } = input;
  const s = sales.kpis;
  const m = meta?.kpis ?? null;
  const hasMeta = !!m;

  const metaSpend = m?.spend ?? 0;
  const totalSpend = metaSpend + googleSpend;
  const blendedRoas = totalSpend > 0 ? +(s.grossSales / totalSpend).toFixed(2) : 0;

  const metaRevenue = m?.purchaseValue ?? 0;
  const metaOrders = m?.purchases ?? 0;
  const organicOrders = Math.max(0, s.totalOrders - metaOrders);
  const organicRevenue = Math.max(0, s.grossSales - metaRevenue);
  const codPct = s.totalOrders ? Math.round((s.codOrders / s.totalOrders) * 100) : 0;
  const unitsPerOrder = s.avgItemsPerOrder;
  const totalUnits = s.totalItems ?? 0;
  const totalLeads = m?.leads ?? 0;

  /* hero KPIs — main summary. Each card shows only when its data is available
     (e.g. Total Leads appears only when the store runs lead-gen ads). */
  const hero: KpiCard[] = [
    { label: "Gross Sales", value: inr(s.grossSales), accent: "#F97316" },
    { label: "Total Orders", value: s.totalOrders.toLocaleString("en-IN"), accent: "#3B82F6", sub: `${unitsPerOrder} items/order` },
    ...(s.grossSales > 0 ? [{ label: "AOV", value: inr(s.aov), accent: "#8B5CF6" }] : []),
    { label: "Total Ad Spend", value: inr(totalSpend), accent: "#EF4444", sub: googleSpend > 0 ? "Meta + Google" : "Meta" },
    { label: "Blended ROAS", value: blendedRoas ? `${blendedRoas}x` : "—", accent: blendedRoas >= 2 ? "#22C55E" : "#EF4444", sub: "store ÷ ad spend" },
    { label: "Units Sold", value: totalUnits ? totalUnits.toLocaleString("en-IN") : "—", accent: "#14B8A6", sub: s.distinctSkus ? `${s.distinctSkus} SKUs` : undefined },
    ...(totalLeads > 0 ? [{ label: "Total Leads", value: totalLeads.toLocaleString("en-IN"), accent: "#8B5CF6", sub: "from Meta ads" }] : []),
  ];

  /* objective-aware KPI blocks (from campaign objectives) */
  const objAgg: Record<string, { spend: number; purchases: number; purchaseValue: number; leads: number; clicks: number; impressions: number; reach: number }> = {};
  for (const c of meta?.campaigns ?? []) {
    const k = normObjective(c.objective);
    const a = objAgg[k] ?? (objAgg[k] = { spend: 0, purchases: 0, purchaseValue: 0, leads: 0, clicks: 0, impressions: 0, reach: 0 });
    a.spend += c.spend; a.purchases += c.purchases; a.purchaseValue += c.purchaseValue;
    a.leads += c.leads; a.clicks += c.clicks; a.impressions += c.impressions; a.reach += c.reach;
  }
  const objSpendTotal = Object.values(objAgg).reduce((t, a) => t + a.spend, 0) || 1;
  const objectives: ObjectiveBlock[] = (["Sales", "Leads", "Traffic", "Awareness", "Other"] as const)
    .filter(k => (objAgg[k]?.spend ?? 0) > 0)
    .map(k => {
      const a = objAgg[k];
      const meta = OBJ_META[k];
      let cards: { label: string; value: string }[] = [];
      if (k === "Sales") cards = [
        { label: "ROAS", value: a.spend > 0 ? `${(a.purchaseValue / a.spend).toFixed(2)}x` : "—" },
        { label: "Orders", value: a.purchases.toLocaleString("en-IN") },
        { label: "Cost / Order", value: a.purchases > 0 ? inr(a.spend / a.purchases) : "—" },
        { label: "Revenue", value: inr(a.purchaseValue) },
      ];
      else if (k === "Leads") cards = [
        { label: "Leads", value: a.leads.toLocaleString("en-IN") },
        { label: "Cost / Lead", value: a.leads > 0 ? inr(a.spend / a.leads) : "—" },
        { label: "Spend", value: inr(a.spend) },
      ];
      else if (k === "Traffic") cards = [
        { label: "Clicks", value: a.clicks.toLocaleString("en-IN") },
        { label: "Cost / Click", value: a.clicks > 0 ? inr(a.spend / a.clicks) : "—" },
        { label: "CTR", value: a.impressions > 0 ? pct(+(a.clicks / a.impressions * 100).toFixed(2)) : "—" },
      ];
      else if (k === "Awareness") cards = [
        { label: "Reach", value: a.reach.toLocaleString("en-IN") },
        { label: "Impressions", value: a.impressions.toLocaleString("en-IN") },
        { label: "CPM", value: a.impressions > 0 ? inr(a.spend / a.impressions * 1000) : "—" },
      ];
      else cards = [{ label: "Spend", value: inr(a.spend) }, { label: "Orders", value: a.purchases.toLocaleString("en-IN") }];
      return { key: k, label: meta.label, color: meta.color, spend: Math.round(a.spend), spendPct: +(a.spend / objSpendTotal * 100).toFixed(0), cards };
    });

  /* revenue mix */
  const revenueMix: Seg[] = [
    { label: "Meta Ads", value: Math.round(metaRevenue), color: "#3B82F6" },
    ...(googleSpend > 0 ? [{ label: "Google Ads", value: 0, color: "#EAB308" }] : []),
    { label: "Organic / Direct", value: Math.round(organicRevenue), color: "#22C55E" },
  ];

  /* channels */
  const channels: ChannelRow[] = [
    { channel: "Shopify Total", color: "#F97316", orders: s.totalOrders, revenue: s.grossSales, spend: null, roas: null, ctr: null },
    ...(m ? [{ channel: "Meta Ads", color: "#3B82F6", orders: metaOrders, revenue: Math.round(metaRevenue), spend: Math.round(metaSpend), roas: m.roas, ctr: m.ctr }] : []),
    ...(googleConnected ? [{ channel: "Google Ads", color: "#EAB308", orders: 0, revenue: 0, spend: Math.round(googleSpend), roas: null, ctr: null }] : []),
    { channel: "Organic / Direct", color: "#22C55E", orders: organicOrders, revenue: Math.round(organicRevenue), spend: null, roas: null, ctr: null },
  ];

  /* funnel */
  const funnel: FunnelStep[] | null = m ? [
    { label: "Clicks", value: m.clicks, color: "#6366F1", pct: 100 },
    { label: "Landing Page Views", value: m.lpv, color: "#3B82F6", pct: m.clicks > 0 ? Math.min(100, m.lpv / m.clicks * 100) : 0 },
    { label: "Add to Cart", value: m.atc, color: "#EAB308", pct: m.clicks > 0 ? Math.min(100, m.atc / m.clicks * 100) : 0 },
    { label: "Checkout", value: m.checkout, color: "#F97316", pct: m.clicks > 0 ? Math.min(100, m.checkout / m.clicks * 100) : 0 },
    { label: "Purchases", value: m.purchases, color: "#22C55E", pct: m.clicks > 0 ? Math.min(100, m.purchases / m.clicks * 100) : 0 },
  ] : null;

  /* placement winners (objective-aware metric: leads if lead-heavy, else purchases, else clicks) */
  const leadHeavy = (objAgg["Leads"]?.spend ?? 0) > (objAgg["Sales"]?.spend ?? 0);
  const score = (b: PlacementBucket) => leadHeavy ? (b.leads || b.purchases) : (b.purchases || b.leads);
  const resultWord = leadHeavy ? "leads" : "orders";
  const winners: Winner[] = [];
  if (placement) {
    const bp = bestBy(placement.placements, p => score(p) || p.clicks * 0.001);
    if (bp) winners.push({ icon: "📍", title: "Top Placement", value: bp.label, detail: `${score(bp) > 0 ? `${score(bp)} ${resultWord}` : `${bp.clicks.toLocaleString("en-IN")} clicks`} · ${bp.spendPct}% of spend${bp.roas > 0 ? ` · ${bp.roas}x ROAS` : ""}` });
    const ba = bestBy(placement.breakdowns.age, score);
    if (ba) winners.push({ icon: "🎯", title: "Best Age Group", value: ba.label, detail: `${score(ba)} ${resultWord}${ba.roas > 0 ? ` · ${ba.roas}x ROAS` : ""}` });
    const bg = bestBy(placement.breakdowns.gender, score);
    if (bg) winners.push({ icon: "👤", title: "Best Audience", value: bg.label, detail: `${score(bg)} ${resultWord}${bg.roas > 0 ? ` · ${bg.roas}x ROAS` : ""}` });
    const bh = bestBy(placement.breakdowns.hourly, score);
    if (bh) winners.push({ icon: "⏰", title: "Best Time of Day", value: bh.label, detail: `${score(bh)} ${resultWord} in this hour` });
    const bd = bestBy(placement.breakdowns.device, score);
    if (bd) winners.push({ icon: "📱", title: "Best Device", value: bd.label, detail: `${score(bd)} ${resultWord}${bd.roas > 0 ? ` · ${bd.roas}x ROAS` : ""}` });
  }

  /* campaigns (top by spend) */
  const campaigns = (meta?.campaigns ?? [])
    .slice()
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 8)
    .map(c => ({ name: c.name, status: c.status, objective: normObjective(c.objective), spend: Math.round(c.spend), roas: c.roas, purchases: c.purchases, leads: c.leads }));

  /* last 3 months — merge shopify + meta monthly by ym */
  const metaByYm = new Map(metaMonthly.map(x => [x.ym, x]));
  const months: PerfMonth[] = shopMonthly
    .map(sm => {
      const mm = metaByYm.get(sm.ym);
      const spend = (mm?.spend ?? 0);
      return {
        ym: sm.ym, label: sm.label,
        grossSales: sm.revenue ?? 0, orders: sm.orders ?? 0, aov: sm.aov ?? 0,
        spend, roas: spend > 0 ? +((sm.revenue ?? 0) / spend).toFixed(2) : 0,
        codPct: sm.codPct ?? 0, leads: mm?.leads ?? 0,
      };
    })
    .sort((a, b) => a.ym.localeCompare(b.ym))
    .slice(-3);

  /* signals */
  const working: Signal[] = [];
  const attention: Signal[] = [];
  if (blendedRoas >= 2) working.push({ type: "good", metric: "Blended ROAS", value: `${blendedRoas}x`, detail: `Your store earns ${inr(blendedRoas)} for every ₹1 of ad spend — marketing is profitable overall.` });
  if (m && m.roas >= 3) working.push({ type: "good", metric: "Meta ROAS", value: `${m.roas}x`, detail: "Above the 3x benchmark — eligible for budget scaling on winning campaigns." });
  if (s.totalOrders > 0) working.push({ type: "good", metric: "Orders", value: `${s.totalOrders}`, detail: `${s.totalOrders} orders at ${inr(s.aov)} AOV. ${unitsPerOrder} items/order — bundle to lift it further.` });
  if (s.returningCustomers > 0) working.push({ type: "good", metric: "Repeat Buyers", value: `${s.returningCustomers}`, detail: "Repeat purchases this period — strong retention signal. Nurture with WhatsApp / loyalty." });
  if (organicRevenue > 0) working.push({ type: "good", metric: "Organic Sales", value: inr(organicRevenue), detail: `${organicOrders} orders came without ad spend — a free, compounding channel worth growing.` });
  if (winners[0]) working.push({ type: "good", metric: winners[0].title, value: winners[0].value, detail: `Your best-performing placement — ${winners[0].detail}. Shift more budget here.` });

  if (m && m.roas < 2) attention.push({ type: "bad", metric: "Meta ROAS", value: `${m.roas}x`, detail: "Below 2x — ads are losing money. Pause the weakest campaigns, refresh creative, tighten targeting." });
  if (codPct > 50) attention.push({ type: "warn", metric: "COD Rate", value: `${codPct}%`, detail: "Over half your orders are COD — RTO risk. Offer a small prepaid discount to shift payment preference." });
  if (m && m.atcRatio < 30) attention.push({ type: "warn", metric: "Add-to-Cart Rate", value: `${m.atcRatio}%`, detail: "Low ATC — product pages may have friction (pricing clarity, social proof, load speed). Run a CRO audit." });
  if (m && m.checkoutRatio < 40) attention.push({ type: "warn", metric: "Checkout Drop-off", value: `${m.checkoutRatio}%`, detail: "Shoppers add to cart but abandon — show total cost upfront and add more payment options." });
  if (sessions > 0 && s.totalOrders / sessions < 0.01) attention.push({ type: "warn", metric: "Site Conversion", value: `${(s.totalOrders / sessions * 100).toFixed(2)}%`, detail: "Traffic isn't converting — review landing pages, speed, and product–audience fit." });
  const losing = (meta?.campaigns ?? []).filter(c => c.status === "ACTIVE" && c.spend > 0 && c.roas > 0 && c.roas < 1);
  if (losing.length) attention.push({ type: "warn", metric: "Loss-making Campaigns", value: `${losing.length} active`, detail: `${losing.length} active campaign(s) under 1x ROAS are burning budget. Pause or rework them.` });

  const conclusion = {
    positives: working.slice(0, 3).map(w => `${w.metric}: ${w.value} — ${w.detail}`),
    improvements: attention.slice(0, 3).map(a => `${a.metric}: ${a.value} — ${a.detail}`),
  };

  return {
    hero, objectives, revenueMix,
    payment: { prepaid: s.prepaidOrders, cod: s.codOrders, codPct },
    blendedRoas, totalSpend, metaSpend, googleSpend, googlePending: !googleConnected,
    channels, funnel, winners, campaigns, months, working, attention, conclusion, hasMeta,
  };
}
