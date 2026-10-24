import type { CompetitorAd, CountryInfo, GoogleAd } from "./competitor-shared";

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
  gCpc: number;            // ₹ per Google ad click (Search + Shopping + YouTube blended)
}

export type AssumptionSource = "yours" | "competitor" | "benchmark";

export interface OwnMetrics {
  cpm: number | null;      // ₹
  ctr: number | null;      // %
  cvr: number | null;      // %
  aov: number | null;      // ₹
}

// Storefront currency → ₹ (fixed, approximate - only used to size AOV)
export const FX_INR: Record<string, number> = {
  INR: 1, USD: 88, EUR: 95, GBP: 112, AED: 24, SAR: 23.5, CAD: 64, AUD: 58, SGD: 67,
};

export const BENCHMARK = { ctr: 1.0, gCpcIn: 20 }; // Indian D2C ballparks - labelled "benchmark"

// Site conversion rate falls steeply with price - a ₹500 impulse buy and a ₹50,000
// appliance don't convert alike. Indian D2C ballparks, labelled "benchmark".
export function benchmarkCvr(aovInr: number): number {
  if (aovInr <= 1000) return 2.0;
  if (aovInr <= 3000) return 1.5;
  if (aovInr <= 10000) return 1.0;
  if (aovInr <= 30000) return 0.6;
  return 0.35;
}

// Cold paid traffic converts worse than the site average (which includes brand searches and returning buyers)
const PAID_CVR_FACTOR = 0.7;

export function defaultAssumptions(
  country: CountryInfo,
  own: OwnMetrics | null,
  competitorAovInr: number | null,
  ownCountry = "IN",
): { a: Assumptions; src: Record<"cpm" | "ctr" | "cvr" | "aov" | "gCpc", AssumptionSource> } {
  // The user's own CPM/CTR only describe the market they advertise in - and only when
  // they're in a normal range for it (a very cheap niche audience says nothing about a competitor's).
  const sameMarket = country.code === ownCountry;
  const [bLo, bHi] = country.cpmInr;
  const ownCpm = sameMarket && own?.cpm && own.cpm >= bLo * 0.6 && own.cpm <= bHi * 1.5 ? own.cpm : null;
  const ownCtr = sameMarket && own?.ctr ? own.ctr : null;

  const aov = competitorAovInr ?? own?.aov ?? 0;
  // Own CVR only transfers to a competitor selling at a similar price point
  const similarPrice = !competitorAovInr || (own?.aov ? competitorAovInr / own.aov >= 0.5 && competitorAovInr / own.aov <= 2 : false);
  const ownCvr = own?.cvr && similarPrice ? own.cvr : null;

  return {
    a: {
      cpm: ownCpm ? [Math.round(ownCpm * 0.8), Math.round(ownCpm * 1.25)] : country.cpmInr,
      ctr: ownCtr ?? BENCHMARK.ctr,
      cvr: ownCvr ?? benchmarkCvr(aov),
      aov,
      frequency: [1.3, 2.5],
      // click prices track the country's media cost
      gCpc: Math.round(BENCHMARK.gCpcIn * mid(country.cpmInr) / IN_CPM_MID),
    },
    src: {
      gCpc: "benchmark",
      cpm: ownCpm ? "yours" : "benchmark",
      ctr: ownCtr ? "yours" : "benchmark",
      cvr: ownCvr ? "yours" : "benchmark",
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
  // One representative per creative group - near-duplicate variants usually share a budget.
  const seen = new Set<string>();
  const creatives = ads.filter(ad => {
    const k = ad.collationId ?? ad.id;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (creatives.length === 0) return null;

  // Budgets scale with the country's media cost, but less than 1:1 (brands buy fewer impressions
  // in costly markets). Uses the country benchmark, not the editable CPM - budget size is about the
  // market, while CPM only decides how many clicks that budget buys.
  const scale = Math.pow(mid(country.cpmInr) / IN_CPM_MID, 0.7);
  let lo = 0, hi = 0, withReach = 0;
  for (const ad of creatives) {
    const days = Math.max(1, ad.daysRunning ?? 1);
    if (ad.euReach && country.eu) {
      // lifetime spend = reach × frequency × CPM, share falling in the last 30 days
      // (reach grows sub-linearly, so young ads aren't extrapolated upward)
      const share = Math.min(30, days) / days;
      lo += (ad.euReach * a.frequency[0] * a.cpm[0] / 1000) * share;
      hi += (ad.euReach * a.frequency[1] * a.cpm[1] / 1000) * share;
      withReach++;
    } else {
      // Live ads keep spending - monthly run-rate = daily budget × 30, not × days run so far
      const tier = TIERS_IN.find(t => days <= t.maxDays)!;
      lo += tier.budget[0] * scale * 30;
      hi += tier.budget[1] * scale * 30;
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

// Google per live creative (₹/day, India). Lower than Meta: on Google several ads share one
// ad group / campaign budget, and Performance Max spins out many creatives per campaign.
const GOOGLE_TIERS_IN: { maxDays: number; budget: [number, number] }[] = [
  { maxDays: 7, budget: [100, 400] },
  { maxDays: 30, budget: [200, 800] },
  { maxDays: Infinity, budget: [300, 1500] },
];

export interface GoogleSpendEstimate {
  range: Range;              // ₹ per month
  confidence: Confidence;
  method: "search_traffic" | "ad_activity";
  liveAds: number;
}

export function estimateGoogleSpend(
  ads: GoogleAd[] | null,
  liveTotal: number | null,
  searchCostInr: number,
  country: CountryInfo,
): GoogleSpendEstimate | null {
  const live = (ads ?? []).filter(a => a.isActive);
  let act: Range | null = null;
  if (live.length > 0) {
    const scale = Math.pow(mid(country.cpmInr) / IN_CPM_MID, 0.7);
    let lo = 0, hi = 0;
    for (const ad of live) {
      const tier = GOOGLE_TIERS_IN.find(t => Math.max(1, ad.daysRunning ?? 1) <= t.maxDays)!;
      lo += tier.budget[0] * scale * 30;
      hi += tier.budget[1] * scale * 30;
    }
    // Live ads past the fetch cap spend too - extrapolate from the ones we have
    const k = liveTotal && liveTotal > live.length ? liveTotal / live.length : 1;
    act = { lo: Math.round(lo * k), mid: Math.round(Math.sqrt(lo * hi) * k), hi: Math.round(hi * k) };
  }
  const search = searchCostInr > 0 ? scaleRange(searchCostInr, 0.7, 1.4) : null;
  // DataForSEO's search-click cost is a floor - it misses Shopping, PMax and YouTube
  if (act && (!search || act.mid >= search.mid)) {
    return { range: act, confidence: "Low", method: "ad_activity", liveAds: liveTotal ?? live.length };
  }
  if (search) return { range: search, confidence: "Medium", method: "search_traffic", liveAds: liveTotal ?? live.length };
  return null;
}

export interface TrafficInputs { organicTraffic: number; paidTraffic: number; paidCostInr: number }

export interface FullEstimate {
  meta: MetaSpendEstimate | null;
  google: GoogleSpendEstimate | null; // ₹/month, all Google ads
  totalSpend: Range | null;
  visits: { organic: number; googlePaid: number; meta: number } | null;
  revenue: Range | null;              // ₹/month, all channels
  paidRevenue: Range | null;          // ₹/month, from paid traffic only
  blendedRoas: Range | null;          // all revenue ÷ ad spend (MER)
  blendedMeaningful: boolean;         // false when free traffic dominates - MER then just reflects brand size
  organicShare: number;               // share of visible visits that are Google organic, 0-1
  paidRoas: Range | null;             // paid-traffic revenue ÷ ad spend
  confidence: Confidence;
  missing: string[];                  // plain-English reasons parts couldn't be estimated
}

const scaleRange = (m: number, lo = 0.6, hi = 1.6): Range => ({ lo: Math.round(m * lo), mid: Math.round(m), hi: Math.round(m * hi) });

export function estimateAll(input: {
  ads: CompetitorAd[] | null;
  googleAds: GoogleAd[] | null;
  googleLive: number | null;       // Google's own live-ad count
  traffic: TrafficInputs | null;
  country: CountryInfo;
  a: Assumptions;
}): FullEstimate {
  const { ads, googleAds, googleLive, traffic, country, a } = input;
  const missing: string[] = [];
  const meta = ads ? estimateMetaSpend(ads, country, a) : null;
  if (!ads) missing.push("No Meta ad data yet for this country.");
  else if (!meta) missing.push("No active Meta ads found in this country - Meta spend is likely ₹0 right now.");

  const google = estimateGoogleSpend(googleAds, googleLive, traffic?.paidCostInr ?? 0, country);
  if (!traffic) missing.push("No Google traffic data yet.");
  if (googleAds && !google) missing.push("No live Google ads right now - Google spend is likely ₹0.");

  const g = google?.range;
  const spendMid = (meta?.range.mid ?? 0) + (g?.mid ?? 0);
  const totalSpend = spendMid > 0
    ? { lo: (meta?.range.lo ?? 0) + (g?.lo ?? 0), mid: spendMid, hi: (meta?.range.hi ?? 0) + (g?.hi ?? 0) }
    : null;

  // Meta clicks = spend ÷ CPC, CPC = CPM ÷ (CTR% × 10)
  const cpc = mid(a.cpm) / Math.max(0.05, a.ctr * 10);
  const metaVisits = meta ? Math.round(meta.range.mid / cpc) : 0;
  // Google clicks = spend ÷ Google CPC; DataForSEO's search-ad clicks are the floor
  const googleVisits = Math.max(traffic?.paidTraffic ?? 0, g && a.gCpc > 0 ? Math.round(g.mid / a.gCpc) : 0);
  const visits = traffic || meta || google
    ? { organic: traffic?.organicTraffic ?? 0, googlePaid: googleVisits, meta: metaVisits }
    : null;

  let revenue: Range | null = null, paidRevenue: Range | null = null;
  if (visits && a.aov > 0 && a.cvr > 0) {
    const perVisit = (a.cvr / 100) * a.aov;
    const paid = (visits.googlePaid + visits.meta) * perVisit * PAID_CVR_FACTOR;
    const all = visits.organic * perVisit + paid;
    if (all > 0) revenue = scaleRange(all);
    if (paid > 0) paidRevenue = scaleRange(paid);
  } else if (visits && !(a.aov > 0)) {
    missing.push("No price data - add their website (Shopify stores only) or set an AOV to estimate revenue.");
  }

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const roas = (r: Range | null): Range | null => {
    if (!r || !totalSpend || totalSpend.mid <= 0) return null;
    const m = r.mid / totalSpend.mid;
    return { lo: r1(m * 0.6), mid: r1(m), hi: r1(m * 1.6) };
  };
  const blendedRoas = roas(revenue);
  const paidRoas = roas(paidRevenue);

  // When most visits are free Google traffic, revenue ÷ ad spend just measures brand size,
  // and their unseen spend (Shopping/PMax, influencers, marketplace ads) makes it worse.
  const totalVisits = visits ? visits.organic + visits.googlePaid + visits.meta : 0;
  const organicShare = totalVisits > 0 ? visits!.organic / totalVisits : 0;
  const blendedMeaningful = !!blendedRoas && organicShare < 0.6 && blendedRoas.mid <= 20;
  if (paidRoas && paidRoas.mid > 12) {
    missing.push(`Paid ROAS above 12x is rare - their real cost per click is probably higher or conversion lower than assumed. Adjust the assumptions if you know better.`);
  }

  // Overall confidence = weakest link; Google-only estimates are Medium at best
  const parts: Confidence[] = [];
  if (meta) parts.push(meta.confidence);
  if (google) parts.push(google.confidence);
  const confidence: Confidence =
    parts.length === 0 || parts.includes("Low") ? "Low" : parts.includes("Medium") ? "Medium" : "High";

  return { meta, google, totalSpend, visits, revenue, paidRevenue, blendedRoas, blendedMeaningful, organicShare, paidRoas, confidence, missing };
}
