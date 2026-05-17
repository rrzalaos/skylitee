import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { kpis, currency, period } = await req.json();
  const cur = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;

  const prompt = `You are a Meta Ads performance analyst for a D2C ecommerce brand. Analyze the account data below and give exactly 4 insights.

ACCOUNT DATA (${period.from} to ${period.to}):
Spend: ${cur}${kpis.spend} | ROAS: ${kpis.roas}x | CAC: ${cur}${kpis.cac}
Orders: ${kpis.purchases} | Revenue: ${cur}${kpis.purchaseValue}
Impressions: ${(kpis.impressions ?? 0).toLocaleString()} | Reach: ${(kpis.reach ?? 0).toLocaleString()} | Frequency: ${kpis.frequency}x | CPM: ${cur}${kpis.cpm}
Clicks: ${(kpis.clicks ?? 0).toLocaleString()} | CTR: ${kpis.ctr}% | CPC: ${cur}${kpis.cpc} | Outbound Clicks: ${(kpis.outboundClicks ?? 0).toLocaleString()}
Landing Page Views: ${kpis.lpv} (LP Ratio: ${kpis.lpRatio}% of clicks)
Add to Cart: ${kpis.atc} (ATC Ratio: ${kpis.atcRatio}% of LPV) | Value: ${cur}${kpis.atcValue}
Checkout: ${kpis.checkout} (Checkout Ratio: ${kpis.checkoutRatio}% of ATC) | Value: ${cur}${kpis.checkoutValue}
Purchase Ratio: ${kpis.purchaseRatio}% | Conversion Rate: ${kpis.conversionRatio}%
Thumb Stop Ratio: ${kpis.thumbStopRatio}% | Hold Ratio: ${kpis.holdRatio}%

INDUSTRY BENCHMARKS (D2C Ecommerce):
CTR: 0.9% avg, good >1.5% | ROAS: 2.0x avg, good >3.0x | Frequency: 1-3 healthy, >5 ad fatigue
CPM: ₹150-400 India range | CPC: ₹5-25 India avg
Thumb Stop: 25% avg, good >30% | Hold Ratio: 15% avg, good >20%
LP Ratio: 65% avg, good >70% | ATC Ratio: 7% avg, good >12%
Checkout Ratio: 50% avg, good >60% | Purchase Ratio: 40% avg, good >50%
Conversion Rate: 1-2% avg

Give exactly 4 insights. Format each one exactly like this (no extra text before or after):
STRENGTH: [observation with numbers] → [what to do to leverage it]
ISSUE: [observation with numbers] → [specific fix to implement]
OPPORTUNITY: [observation with numbers] → [how to capture it]
RISK: [observation with numbers] → [how to mitigate it]

Each insight must be under 50 words. Use the actual numbers from the data. Be specific and actionable.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.content[0];
    if (content.type !== "text") throw new Error("unexpected");
    return NextResponse.json({ insights: content.text });
  } catch {
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
