export type PlanId = "free" | "growth" | "scale";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;        // USD per month
  trialDays: number;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    trialDays: 0,
    features: [
      "Shopify sales dashboard",
      "Monthly goals tracker",
      "Basic product analytics",
      "Customer overview",
      "7-day data history",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 29,
    trialDays: 14,
    highlight: true,
    features: [
      "Everything in Free",
      "Meta Ads analytics",
      "Google GSC + GA4",
      "AI Insights & Assistant",
      "Cohort retention analysis",
      "Full attribution",
      "Financial P&L",
      "90-day data history",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 79,
    trialDays: 14,
    features: [
      "Everything in Growth",
      "Unlimited data history",
      "Weekly email digest",
      "Priority support",
      "Early access to new features",
    ],
  },
];

export function getPlanById(id: string): Plan {
  return PLANS.find(p => p.id === id) ?? PLANS[0];
}
