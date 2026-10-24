import type { CompetitorAd, CountryInfo } from "./competitor-shared";

// ── Competitor spend & ROAS ESTIMATE model (pure, runs in the browser) ───────
// Nobody can see a competitor's real spend or revenue. This turns public signals
// (live ads, days running, EU reach, Google traffic estimates, storefront prices) into
// RANGES, using the user's own real CPM/CTR/CVR where possible. Every output carries a
// confidence level and the UI must label it "Estimate". All assumptions are editable.

export type Confidence = "High" | "Medium" | "Low";
export interface Range { lo: number; mid: number; hi: number }

export interface Assumptions {
  cpm: [number, number];   // ₹ per 1,000 impressions
  ctr: number;             // link CTR, %
  cvr: number;             // site conversion rate, %
  aov: number;             // ₹ average order value
  frequency: [number, number];
}

export type AssumptionSource = "yours" | "competitor" | "benchmark";

export interface OwnMetrics {
  cpm: number | null;      // ₹
  ctr: number | null;      // %
  cvr: number | null;      // %
  aov: number | null;      // ₹
}

// Storefront currency → ₹ (fixed, approximate — only used to size AOV)
export const FX_INR: Record<string, number> = {
  INR: 1, USD: 88, EUR: 95, GBP: 112, AED: 24, SAR: 23.5, CAD: 64, AUD: 58, SGD: 67,
};

export const BENCHMARK = { ctr: 1.0, cvr: 1.5 }; // Indian D2C ballparks — labelled "benchmark"

export function defaultAssumptions(
  country: CountryInfo,
  own: OwnMetrics | null,
  competitorAovInr: number | null,
  ownCountry = "IN",
): { a: Assumptions; src: Record<"cpm" | "ctr" | "cvr" | "aov", AssumptionSource> } {
  // The user's own CPM/CTR only describe the market they advertise in.
  const sameMarket = country.code === ownCountry;
  const ownCpm = sameMarket && own?.cpm ? own.cpm : null;
  const ownCtr = sameMarket && own?.ctr ? own.ctr : null;
  return {
    a: {
      cpm: ownCpm ? [Math.round(ownCpm * 0.8), Math.round(ownCpm * 1.25)] : country.cpmInr,
      ctr: ownCtr ?? BENCHMARK.ctr,
      cvr: own?.cvr ?? BENCHMARK.cvr,
      aov: competitorAovInr ?? own?.aov ?? 0,
      frequency: [1.3, 2.5],
    },
    src: {
      cpm: ownCpm ? "yours" : "benchmark",
      ctr: ownCtr ? "yours" : "benchmark",
      cvr: own?.cvr ? "yours" : "benchmark",
      aov: competitorAovInr ? "competitor" : own?.aov ? "yours" : "benchmark",
    },
  };
}

// Daily budget per live creative in India (₹), by how long it has been running.
// Ads that survive 30+ days are almost always profitable and being scaled.
const TIERS_IN: { maxDays: number; budget: [number, number] }[] = [
  { maxDays: 7, budget: [200, 800] },        // testing
  { maxDays: 30, budget: [400, 1500] },      // proving
  { maxDays: Infinity, budget: [800, 4000] }, // scaled winner
];
const IN_CPM_MID = 140;

export interface MetaSpendEstimate {
  range: Range;              // ₹ per month
  confidence: Confidence;
  method: "reach" | "mixed" | "ad_activity";
  creatives: number;
  reachCoverage: number;     // share of creatives with real EU reach, 0-1
}

const mid = (r: [number, number]) => (r[0] + r[1]) / 2;

export function estimateMetaSpend(ads: CompetitorAd[], country: CountryInfo, a: Assumptions): MetaSpendEstimate | null {
  // One representative per creative group — near-duplicate variants usually share a budget.
  const seen = new Set<string>();
  const creatives = ads.filter(ad => {
    const k = ad.collationId ?? ad.id;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (creatives.length === 0) return null;

  // Budgets scale with media cost, but less than 1:1 (brands buy fewer impressions in costly markets)
  const scale = Math.pow(mid(a.cpm) / IN_CPM_MID, 0.7);
  let lo = 0, hi = 0, withReach = 0;
  for (const ad of creatives) {
    const days = Math.max(1, ad.daysRunning ?? 1);
    if (ad.euReach && country.eu) {
      // lifetime spend = reach × frequency × CPM, normalised to the last 30 days
      const share = Math.min(30, days) / days;
      lo += (ad.euReach * a.frequency[0] * a.cpm[0] / 1000) * share;
      hi += (ad.euReach * a.frequency[1] * a.cpm[1] / 1000) * share;
      withReach++;
    } else {
      const tier = TIERS_IN.find(t => days <= t.maxDays)!;
      const activeDays = Math.min(30, days);
      lo += tier.budget[0] * scale * activeDays;
      hi += tier.budget[1] * scale * activeDays;
    }
  }
  const coverage = withReach / creatives.length;
  return {
    range: { lo: Math.round(lo), mid: Math.round(Math.sqrt(lo * hi)), hi: Math.round(hi) },
    confidence: coverage >= 0.7 ? "High" : coverage > 0 ? "Medium" : "Low",
    method: coverage >= 0.7 ? "reach" : coverage > 0 ? "mixed" : "ad_activity",
    creatives: creatives.length,
    reachCoverage: coverage,
  };
}

export interface TrafficInputs { organicTraffic: number; paidTraffic: number; paidCostInr: number }

export interface FullEstimate {
  meta: MetaSpendEstimate | null;
  google: Range | null;               // ₹/month, Google search ads
  totalSpend: Range | null;
  visits: { organic: number; googlePaid: number; meta: number } | null;
  revenue: Range | null;              // ₹/month, all channels
  paidRevenue: Range | null;          // ₹/month, from paid traffic only
  blendedRoas: Range | null;          // all revenue ÷ ad spend (MER)
  paidRoas: Range | null;             // paid-traffic revenue ÷ ad spend
  confidence: Confidence;
  missing: string[];                  // plain-English reasons parts couldn't be estimated
}

const scaleRange = (m: number, lo = 0.6, hi = 1.6): Range => ({ lo: Math.round(m * lo), mid: Math.round(m), hi: Math.round(m * hi) });

export function estimateAll(input: {
  ads: CompetitorAd[] | null;
  traffic: TrafficInputs | null;
  country: CountryInfo;
  a: Assumptions;
}): FullEstimate {
  const { ads, traffic, country, a } = input;
  const missing: string[] = [];
  const meta = ads ? estimateMetaSpend(ads, country, a) : null;
  if (!ads) missing.push("No Meta ad data yet for this country.");
  else if (!meta) missing.push("No active Meta ads found in this country — Meta spend is likely ₹0 right now.");

  const google = traffic && traffic.paidCostInr > 0 ? scaleRange(traffic.paidCostInr, 0.7, 1.4) : null;
  if (!traffic) missing.push("No Google traffic data yet.");

  const spendMid = (meta?.range.mid ?? 0) + (google?.mid ?? 0);
  const totalSpend = spendMid > 0
    ? { lo: (meta?.range.lo ?? 0) + (google?.lo ?? 0), mid: spendMid, hi: (meta?.range.hi ?? 0) + (google?.hi ?? 0) }
    : null;

  // Meta clicks = spend ÷ CPC, CPC = CPM ÷ (CTR% × 10)
  const cpc = mid(a.cpm) / Math.max(0.05, a.ctr * 10);
  const metaVisits = meta ? Math.round(meta.range.mid / cpc) : 0;
  const visits = traffic || meta
    ? { organic: traffic?.organicTraffic ?? 0, googlePaid: traffic?.paidTraffic ?? 0, meta: metaVisits }
    : null;

  let revenue: Range | null = null, paidRevenue: Range | null = null;
  if (visits && a.aov > 0 && a.cvr > 0) {
    const perVisit = (a.cvr / 100) * a.aov;
    const all = (visits.organic + visits.googlePaid + visits.meta) * perVisit;
    const paid = (visits.googlePaid + visits.meta) * perVisit;
    if (all > 0) revenue = scaleRange(all);
    if (paid > 0) paidRevenue = scaleRange(paid);
  } else if (visits && !(a.aov > 0)) {
    missing.push("No price data — add their website (Shopify stores only) or set an AOV to estimate revenue.");
  }

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const roas = (r: Range | null): Range | null => {
    if (!r || !totalSpend || totalSpend.mid <= 0) return null;
    const m = r.mid / totalSpend.mid;
    return { lo: r1(m * 0.6), mid: r1(m), hi: r1(m * 1.6) };
  };
  const blendedRoas = roas(revenue);
  const paidRoas = roas(paidRevenue);

  // Overall confidence = weakest link; Google-only estimates are Medium at best
  const parts: Confidence[] = [];
  if (meta) parts.push(meta.confidence);
  if (google) parts.push("Medium");
  const confidence: Confidence =
    parts.length === 0 || parts.includes("Low") ? "Low" : parts.includes("Medium") ? "Medium" : "High";

  return { meta, google, totalSpend, visits, revenue, paidRevenue, blendedRoas, paidRoas, confidence, missing };
}
