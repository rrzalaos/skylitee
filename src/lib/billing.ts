export type PlanId = "growth";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  trialDays: number;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "growth",
    name: "Skylitee Pro",
    price: 29,
    trialDays: 14,
    features: [
      "Shopify sales, orders & revenue dashboard",
      "Meta Ads — ROAS, CAC, CTR, spend & creatives",
      "Google Search Console & Analytics 4",
      "AI Insights & Chat assistant",
      "Cohort retention analysis",
      "Financial P&L calculator",
      "Goals tracker with live pace",
      "Geo, customer segments & anomaly alerts",
      "Attribution dashboard",
      "Weekly performance digest",
    ],
  },
];

export function getPlanById(id: string): Plan {
  return PLANS[0];
}
