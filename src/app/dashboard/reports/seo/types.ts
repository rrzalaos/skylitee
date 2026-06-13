// Shared types for the SEO report (on-screen page + printable PDF layout).

export interface GSCData {
  site: string;
  period: { startDate: string; endDate: string };
  kpis: { clicks: number; impressions: number; ctr: number; avgPosition: number };
  keywords: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
  devices: { device: string; clicks: number; impressions: number; ctr: number }[];
  countries: { country: string; clicks: number; impressions: number; ctr: number }[];
  daily: { date: string; clicks: number; impressions: number }[];
  branded: { brandLabel: string; brandedClicks: number; brandedImpr: number; nonBrandedClicks: number; nonBrandedImpr: number };
  positionBuckets: { label: string; clicks: number; impressions: number; keywords: number }[];
}

export interface GA4Data {
  organic: { sessions: number; users: number; bounceRate: number; avgSessionSec: number; purchases: number; revenue: number; engagementRate: number } | null;
  organicLandingPages: { page: string; sessions: number; bounceRate: number; purchases: number; revenue: number }[];
}

export interface MonthlyMonth { ym: string; label: string; clicks: number; impressions: number; ctr: number; position: number }

// GA4 month-wise row (ym is "YYYYMM"); `organic` = Organic-Search sessions that month.
export interface GA4MonthlyMonth { ym: string; label: string; sessions: number; users: number; organic: number; revenue: number; purchases: number; convRate: number }
