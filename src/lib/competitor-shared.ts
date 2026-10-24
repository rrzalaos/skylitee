// ── Competitor Intel — types + pure helpers shared by API routes and the page ──
// Browser-safe: no SDKs, no KV. Server-side fetching lives in competitors.ts.

const DAY = 86_400_000;
export interface Competitor {
  id: string;
  name: string;
  pageUrl?: string;   // facebook.com/<page> or an Ad Library URL
  pageId?: string;    // numeric FB page id (learned from the first ad fetch if not given)
  website?: string;   // bare domain, e.g. "brand.com"
  addedAt: string;
}

export interface CountryInfo {
  code: string;            // ISO-2, as used by Meta Ad Library
  name: string;
  eu: boolean;             // official API returns reach only for EU delivery
  dfsLocation: number;     // DataForSEO location_code
  dfsLanguage?: string;    // DataForSEO language_code (omitted = all languages)
  cpmInr: [number, number]; // Meta CPM benchmark range, ₹ per 1,000 impressions (D2C, 2026)
}

// CPM ranges are public-benchmark ballparks converted at ~₹88/$ — shown in the UI as
// editable assumptions, never as facts.
export const COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India",          eu: false, dfsLocation: 2356, dfsLanguage: "en", cpmInr: [80, 200] },
  { code: "US", name: "United States",  eu: false, dfsLocation: 2840, dfsLanguage: "en", cpmInr: [900, 1750] },
  { code: "GB", name: "United Kingdom", eu: false, dfsLocation: 2826, dfsLanguage: "en", cpmInr: [700, 1200] },
  { code: "AE", name: "UAE",            eu: false, dfsLocation: 2784,                    cpmInr: [450, 900] },
  { code: "SA", name: "Saudi Arabia",   eu: false, dfsLocation: 2682,                    cpmInr: [350, 700] },
  { code: "CA", name: "Canada",         eu: false, dfsLocation: 2124, dfsLanguage: "en", cpmInr: [750, 1400] },
  { code: "AU", name: "Australia",      eu: false, dfsLocation: 2036, dfsLanguage: "en", cpmInr: [750, 1400] },
  { code: "SG", name: "Singapore",      eu: false, dfsLocation: 2702, dfsLanguage: "en", cpmInr: [550, 1100] },
  { code: "DE", name: "Germany (EU)",   eu: true,  dfsLocation: 2276, dfsLanguage: "de", cpmInr: [550, 1100] },
  { code: "FR", name: "France (EU)",    eu: true,  dfsLocation: 2250, dfsLanguage: "fr", cpmInr: [450, 900] },
  { code: "NL", name: "Netherlands (EU)", eu: true, dfsLocation: 2528, dfsLanguage: "nl", cpmInr: [500, 1000] },
  { code: "IT", name: "Italy (EU)",     eu: true,  dfsLocation: 2380, dfsLanguage: "it", cpmInr: [350, 750] },
  { code: "ES", name: "Spain (EU)",     eu: true,  dfsLocation: 2724, dfsLanguage: "es", cpmInr: [300, 700] },
];

export function getCountry(code: string | null | undefined): CountryInfo {
  return COUNTRIES.find(c => c.code === (code ?? "").toUpperCase()) ?? COUNTRIES[0];
}

export type AdFormat = "video" | "image" | "carousel" | "text";

export interface CompetitorAd {
  id: string;               // Ad Library archive id
  pageId: string | null;
  pageName: string | null;
  startDate: string | null; // ISO
  endDate: string | null;   // ISO
  isActive: boolean;
  daysRunning: number | null;
  platforms: string[];
  body: string;
  title: string;
  linkUrl: string | null;
  cta: string | null;
  format: AdFormat;
  imageUrl: string | null;
  videoUrl: string | null;
  collationCount: number;   // how many near-identical variants Meta groups under this ad
  collationId: string | null;
  libraryUrl: string;       // public Ad Library link (stable, unlike fbcdn media URLs)
  euReach: number | null;   // official EU reach — EU countries only
}

export interface AdHooks {
  summary: string;
  offers: string[];
  hooks: string[];
  angles: string[];
}

export interface AdsPayload {
  fetchedAt: string;
  country: string;
  source: "apify" | "meta_api";
  pageId: string | null;
  pageName: string | null;
  ads: CompetitorAd[];
  hooks: AdHooks | null;
  reachMerged: boolean;     // true when EU reach from the official API was attached
}

// ── Ad-level analytics (pure — used by route + UI) ────────────────────────────

export interface AdStats {
  active: number;
  uniqueCreatives: number;        // distinct collation groups
  variations: number;             // total incl. near-duplicates (collation counts)
  launched7d: number;
  launched30d: number;
  over30d: number;                // long-running = likely profitable
  over60d: number;
  formats: Record<AdFormat, number>;
  platforms: Record<string, number>;
  medianDays: number | null;
  totalEuReach: number | null;
}

export function adStats(ads: CompetitorAd[]): AdStats {
  const now = Date.now();
  const formats: Record<AdFormat, number> = { video: 0, image: 0, carousel: 0, text: 0 };
  const platforms: Record<string, number> = {};
  const groups = new Set<string>();
  let variations = 0, launched7d = 0, launched30d = 0, over30d = 0, over60d = 0, reach = 0, reachN = 0;
  const days: number[] = [];
  for (const a of ads) {
    formats[a.format]++;
    for (const p of a.platforms) platforms[p] = (platforms[p] ?? 0) + 1;
    groups.add(a.collationId ?? a.id);
    variations += a.collationCount;
    if (a.startDate) {
      const age = (now - new Date(a.startDate).getTime()) / DAY;
      if (age <= 7) launched7d++;
      if (age <= 30) launched30d++;
    }
    if (a.daysRunning !== null) {
      days.push(a.daysRunning);
      if (a.daysRunning > 30) over30d++;
      if (a.daysRunning > 60) over60d++;
    }
    if (a.euReach) { reach += a.euReach; reachN++; }
  }
  days.sort((x, y) => x - y);
  return {
    active: ads.length,
    uniqueCreatives: groups.size,
    variations: Math.max(variations, ads.length),
    launched7d, launched30d, over30d, over60d,
    formats, platforms,
    medianDays: days.length ? days[Math.floor(days.length / 2)] : null,
    totalEuReach: reachN ? reach : null,
  };
}
