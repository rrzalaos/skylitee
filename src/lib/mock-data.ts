// ── Skylitee Mock Data ──────────────────────────────────────────────────────

export const brandInfo = {
  name: "fabonique",
  store: "fabonique.myshopify.com",
  dateRange: "Aug 1–19, 2025",
  daysElapsed: 19,
  totalDays: 31,
};

// ── KPIs ─────────────────────────────────────────────────────────────────────
export const kpis = {
  grossSales: 235576,
  grossSalesChange: 12.4,
  blendedROAS: 1.34,
  roasTarget: 1.5,
  totalOrders: 216,
  ordersChange: 9.1,
  adSpend: 175811,
  adSpendBudget: 300000,
  newCustomers: 184,
  newCustomersChange: 7.2,
  returningCustomers: 32,
  cac: 897,
  aov: 1091,
  aovChange: 3.2,
  organicRevenue: 49513,
  directRevenue: 8420,
  metaRevenue: 186063,
  revenueTarget: 450000,
};

// ── Daily Revenue Trend ───────────────────────────────────────────────────────
export const dailyRevenue = [
  { day: "Aug 1", revenue: 8200 },
  { day: "Aug 2", revenue: 11400 },
  { day: "Aug 3", revenue: 9600 },
  { day: "Aug 4", revenue: 13800 },
  { day: "Aug 5", revenue: 10500 },
  { day: "Aug 6", revenue: 15200 },
  { day: "Aug 7", revenue: 13000 },
  { day: "Aug 8", revenue: 20100 },
  { day: "Aug 9", revenue: 22700 },
  { day: "Aug 10", revenue: 19000 },
  { day: "Aug 11", revenue: 12100 },
  { day: "Aug 12", revenue: 15700 },
  { day: "Aug 13", revenue: 17600 },
  { day: "Aug 14", revenue: 22200 },
  { day: "Aug 15", revenue: 24000 },
  { day: "Aug 16", revenue: 14600 },
  { day: "Aug 17", revenue: 11200 },
  { day: "Aug 18", revenue: 12600 },
  { day: "Aug 19", revenue: 10100 },
];

// ── Conversion Funnel ─────────────────────────────────────────────────────────
export const funnel = [
  { stage: "Impressions", value: 61980, rate: null },
  { stage: "Clicks (CTR 4.7%)", value: 2906, rate: 4.7 },
  { stage: "Sessions (GA4)", value: 8340, rate: null },
  { stage: "Add to Cart (22.1%)", value: 1841, rate: 22.1 },
  { stage: "Orders (2.6% CVR)", value: 216, rate: 2.6 },
];

// ── Channels ──────────────────────────────────────────────────────────────────
export const channels = [
  { name: "Meta Ads", sales: 186063, orders: 196, roas: 1.06, aov: 949, status: "live" },
  { name: "Organic SEO", sales: 49513, orders: 20, roas: null, aov: 2476, status: "live" },
  { name: "Direct", sales: 8420, orders: 6, roas: null, aov: 1403, status: "live" },
  { name: "Google Ads", sales: 0, orders: 0, roas: null, aov: null, status: "disconnected" },
];

// ── Products ──────────────────────────────────────────────────────────────────
export const products = [
  { name: "Position Print Set", cod: 38, prepaid: 28, total: 66, revenue: 72006, codPct: 58, stock: 142, signal: "bestseller", dailySell: 3.5 },
  { name: "Embroidery Classic", cod: 28, prepaid: 29, total: 57, revenue: 62187, codPct: 49, stock: 88, signal: "good", dailySell: 3.0 },
  { name: "Combo Fabric", cod: 31, prepaid: 22, total: 53, revenue: 57823, codPct: 58, stock: 34, signal: "reorder", dailySell: 3.2 },
  { name: "Combo Embroidery", cod: 20, prepaid: 20, total: 40, revenue: 43640, codPct: 50, stock: 210, signal: "bundle", dailySell: 2.1 },
];

// ── Meta Campaigns ────────────────────────────────────────────────────────────
export const metaCampaigns = [
  { name: "OS|CBO69|Position Print", status: "active", spend: 2446, impressions: 5726, clicks: 366, ctr: 6.39, cpm: 427, a2c: 45, orders: 3, aov: 851, roas: 1.04, signal: "monitor" },
  { name: "OS|CBO68|Combo Fabric", status: "paused", spend: 2310, impressions: 1949, clicks: 119, ctr: 6.11, cpm: 1185, a2c: 3, orders: 0, aov: null, roas: 0, signal: "pause" },
  { name: "OS|CBO|COMBO", status: "paused", spend: 6689, impressions: 5907, clicks: 363, ctr: 6.15, cpm: 1132, a2c: 17, orders: 3, aov: 2034, roas: 0.91, signal: "review" },
  { name: "cb1|embroidery", status: "paused", spend: 3227, impressions: 17445, clicks: 1175, ctr: 6.74, cpm: 185, a2c: 10, orders: 0, aov: null, roas: 0, signal: "pause" },
  { name: "Sales|Embroidery", status: "paused", spend: 4776, impressions: 17045, clicks: 575, ctr: 3.37, cpm: 280, a2c: 24, orders: 0, aov: null, roas: 0, signal: "kill" },
  { name: "OS|CBO67|28/7/25", status: "active", spend: 19622, impressions: 61980, clicks: 2906, ctr: 4.69, cpm: 317, a2c: 99, orders: 18, aov: 1666, roas: 1.53, signal: "scale" },
];

// ── Placement ─────────────────────────────────────────────────────────────────
export const placements = [
  { name: "Facebook Feed", purchases: 66, pct: 100 },
  { name: "Instagram Feed", purchases: 56, pct: 85 },
  { name: "IG Reels", purchases: 35, pct: 53 },
  { name: "FB Reels", purchases: 17, pct: 26 },
  { name: "IG Stories", purchases: 9, pct: 14 },
];

export const ageGroups = [
  { age: "35–44", purchases: 59, pct: 100 },
  { age: "45–54", purchases: 56, pct: 95 },
  { age: "65+", purchases: 27, pct: 46 },
  { age: "25–34", purchases: 26, pct: 44 },
  { age: "55–64", purchases: 18, pct: 30 },
];

// ── Creatives ─────────────────────────────────────────────────────────────────
export const creatives = [
  { name: "CBO67 Reels · Position Print", days: 8, freq: 1.1, ctr: 5.2, roas: 1.82, score: 92, action: "scale", type: "video" },
  { name: "Combo Fabric carousel", days: 12, freq: 1.4, ctr: 4.8, roas: 1.34, score: 74, action: "keep", type: "carousel" },
  { name: "Position Print video", days: 18, freq: 1.9, ctr: 4.1, roas: 1.12, score: 58, action: "refresh", type: "video" },
  { name: "Embroidery static image", days: 28, freq: 2.8, ctr: 2.9, roas: 0.61, score: 18, action: "pause", type: "image" },
];

// ── GSC Keywords ──────────────────────────────────────────────────────────────
export const gscKeywords = [
  { query: "fabric sets online", clicks: 840, impressions: 12400, ctr: 6.8, position: 3.2, trend: "up" },
  { query: "buy embroidery dress", clicks: 620, impressions: 9800, ctr: 6.3, position: 7.1, trend: "up" },
  { query: "cotton print fabric", clicks: 490, impressions: 7200, ctr: 6.8, position: 9.4, trend: "flat" },
  { query: "ethnic combo set", clicks: 310, impressions: 5100, ctr: 6.1, position: 14, trend: "flat" },
  { query: "position print dress", clicks: 280, impressions: 4600, ctr: 6.1, position: 5.8, trend: "up" },
  { query: "fabonique brand", clicks: 610, impressions: 980, ctr: 62.2, position: 1.1, trend: "up" },
];

export const gscKpis = {
  clicks: 4820, clicksChange: 18.3,
  impressions: 142000, impressionsChange: 9.1,
  ctr: 3.39, ctrChange: 0.4,
  avgPosition: 8.2, positionChange: -1.9,
};

// ── GA4 ───────────────────────────────────────────────────────────────────────
export const ga4Kpis = {
  sessions: 8340, sessionsChange: 14.2,
  users: 6820,
  avgSession: "1m 42s",
  bounceRate: 68,
};

export const ga4Funnel = [
  { stage: "Sessions", value: 8340 },
  { stage: "PDP views (78%)", value: 6505 },
  { stage: "Add to cart (28%)", value: 1821 },
  { stage: "Checkout (40%)", value: 728 },
  { stage: "Payment entered (61%)", value: 444 },
  { stage: "Purchase (2.6% CVR)", value: 216 },
];

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerKpis = {
  total: 6820, totalChange: 14.2,
  avgLtv: 2180,
  repeatRate: 18.4,
  championsLtv: 4480,
};

export const rfmSegments = [
  { icon: "🏆", name: "Champions", count: 412, ltv: 4480, potential: 1846000, action: "Retain", color: "green" },
  { icon: "💎", name: "Loyal", count: 834, ltv: 2840, potential: 2368000, action: "Grow", color: "blue" },
  { icon: "🌱", name: "Potential", count: 1240, ltv: 1620, potential: 2009000, action: "Nurture", color: "teal" },
  { icon: "⚠️", name: "At Risk", count: 680, ltv: 1091, potential: 742000, action: "Win back", color: "amber" },
  { icon: "😴", name: "Dormant", count: 920, ltv: 540, potential: 497000, action: "Last push", color: "red" },
  { icon: "🆕", name: "New", count: 2734, ltv: null, potential: null, action: "Nurture", color: "purple" },
];

// ── Cohort ────────────────────────────────────────────────────────────────────
export const cohortData = [
  { month: "Mar 2025", customers: 342, retention: [100, 28, 18, 14, 11, 9] },
  { month: "Apr 2025", customers: 418, retention: [100, 31, 20, 15, 12, null] },
  { month: "May 2025", customers: 384, retention: [100, 24, 16, 11, null, null] },
  { month: "Jun 2025", customers: 512, retention: [100, 33, 22, null, null, null] },
  { month: "Jul 2025", customers: 628, retention: [100, 29, null, null, null, null] },
  { month: "Aug 2025", customers: 184, retention: [100, null, null, null, null, null] },
];

// ── Geo ───────────────────────────────────────────────────────────────────────
export const geoData = [
  { city: "Mumbai", orders: 68, revenue: 125120, aov: 1840, roas: 1.62, codPct: 38, signal: "scale" },
  { city: "Bengaluru", orders: 52, revenue: 88504, aov: 1702, roas: 1.82, codPct: 31, signal: "best_roas" },
  { city: "Delhi NCR", orders: 34, revenue: 36094, aov: 1062, roas: 1.28, codPct: 62, signal: "high_cod" },
  { city: "Hyderabad", orders: 22, revenue: 22402, aov: 1018, roas: 1.14, codPct: 55, signal: "optimise" },
  { city: "Pune", orders: 18, revenue: 18940, aov: 1052, roas: 1.21, codPct: 48, signal: "growing" },
  { city: "Jaipur", orders: 12, revenue: 10680, aov: 890, roas: 1.08, codPct: 78, signal: "tier2" },
  { city: "Surat", orders: 10, revenue: 8820, aov: 882, roas: 1.05, codPct: 71, signal: "tier2" },
];

export const stateRevenue = [
  { state: "Maharashtra", pct: 34 },
  { state: "Karnataka", pct: 22 },
  { state: "Delhi NCR", pct: 15 },
  { state: "Telangana", pct: 9 },
  { state: "Rajasthan", pct: 6 },
  { state: "Others", pct: 14 },
];

// ── Attribution ───────────────────────────────────────────────────────────────
export const attributionPaths = [
  { path: ["Meta Ad", "PDP", "Purchase"], orders: 88, pct: 41 },
  { path: ["Organic", "Meta Retarget", "Purchase"], orders: 54, pct: 25 },
  { path: ["Organic", "Purchase"], orders: 38, pct: 18 },
  { path: ["Meta", "Abandon", "Email", "Buy"], orders: 22, pct: 10 },
];

export const attributionModels = [
  { channel: "Meta Ads", lastClick: 186063, linear: 162400, timeDecay: 174200 },
  { channel: "Organic SEO", lastClick: 49513, linear: 68900, timeDecay: 54800 },
  { channel: "Direct", lastClick: 8420, linear: 11200, timeDecay: 9100 },
  { channel: "Email", lastClick: 4200, linear: 8400, timeDecay: 6100 },
];

// ── Financial ─────────────────────────────────────────────────────────────────
export const financials = {
  grossRevenue: 235576,
  returnsEst: 25400,
  netRevenue: 210176,
  cogs: 89519,
  grossProfit: 120657,
  adSpend: 175811,
  logistics: 18560,
  platformFees: 4204,
  netContribution: -77918,
  grossMargin: 62,
  ltvCac: 2.43,
};

// ── Benchmarking ──────────────────────────────────────────────────────────────
export const benchmarks = [
  { metric: "Meta ROAS", yours: "1.06", avg: "1.4", top10: "2.8+", rank: "bottom30" },
  { metric: "CTR (Meta)", yours: "4.7%", avg: "2.1%", top10: "5.0%+", rank: "top20" },
  { metric: "CPM", yours: "₹317", avg: "₹420", top10: "₹200↓", rank: "top30" },
  { metric: "CAC", yours: "₹897", avg: "₹650", top10: "₹350↓", rank: "bottom40" },
  { metric: "AOV", yours: "₹1,091", avg: "₹980", top10: "₹1,600+", rank: "mid40" },
  { metric: "Organic % revenue", yours: "21%", avg: "18%", top10: "40%+", rank: "aboveavg" },
  { metric: "COD ratio", yours: "54%", avg: "45%", top10: "25%↓", rank: "belowavg" },
  { metric: "Repeat purchase rate", yours: "18%", avg: "25%", top10: "40%+", rank: "belowavg" },
];

// ── Anomalies ─────────────────────────────────────────────────────────────────
export const anomalies = {
  critical: [
    { title: "ROAS dropped 23% in last 48 hours — CBO69", desc: "Expected ROAS: 1.28. Actual: 0.98. Possible cause: creative fatigue (frequency hit 2.1) or audience saturation. Suggested action: pause and test new creative variant.", meta: "Detected 2h ago · Meta Ads · Confidence 94%", type: "critical" },
    { title: "Combo Fabric selling 3.2× faster than restocked rate", desc: "Velocity spiked from 1.8 to 3.2 orders/day after Meta campaign went live. At this pace, stockout in 10.6 days. Immediately reorder minimum 150 units.", meta: "Detected 4h ago · Shopify · Confidence 97%", type: "critical" },
    { title: "Mobile bounce spiked 12pts on Position Print page", desc: "Bounce went from 54% → 66% in 3 days. Likely cause: slow image load (page size increased after new product photos). Compress images immediately — est. CVR impact: −0.4%.", meta: "Detected 6h ago · GA4 · Confidence 88%", type: "warning" },
  ],
  positive: [
    { title: "Organic CTR spiked 40% — 'fabric sets' keyword", desc: "GSC shows 'fabric sets online' CTR jumped from 4.8% to 6.8% after product page update. Replicate this approach on other product pages immediately.", meta: "Detected 1d ago · GSC · Confidence 91%", type: "positive" },
    { title: "Repeat purchase rate up 18% this week", desc: "32 returning customers placed orders vs 27 last week. Cohort from June 2025 is showing strong retention. Nurture this cohort with loyalty offers.", meta: "Detected 12h ago · Shopify · Confidence 85%", type: "info" },
  ],
};

// ── AI Insights ───────────────────────────────────────────────────────────────
export const aiInsights = [
  { type: "scale", title: "Scale CBO67 by 20% every 3 days — it's learning", body: "ROAS 1.53, CTR improving week-over-week. Algorithm exited learning phase. Safe to scale: ₹9K → ₹10.8K → ₹12.9K → ₹15.5K. Do NOT change targeting or creative.", color: "blue" },
  { type: "danger", title: "Pause CBO68 immediately — CPM 4× benchmark", body: "CPM ₹1,185 vs benchmark ₹280. Zero orders from ₹2,310 spend. Every day active = ₹120 wasted with zero return. Pause and reallocate to CBO67.", color: "red" },
  { type: "warning", title: "Creative fatigue alert — Embroidery static (28 days)", body: "Frequency 2.8, CTR declining 0.3pts/week. Prepare 2 new creatives. Audience has seen this ad an average of 2.8 times — diminishing returns confirmed.", color: "amber" },
  { type: "audience", title: "Duplicate CBO67 for 25–34 female segment", body: "Your 35–44 female segment converts at 2.1× average. 25–34 female is currently underspent — similar buying patterns but only 26 orders. New CBO with identical creative targeting 25–34 could add 30–40 orders/month.", color: "purple" },
  { type: "seo", title: "3 keywords in striking distance — run ads now", body: "\"buy embroidery dress\" (pos 7.1), \"cotton print fabric\" (pos 9.4), \"embroidery salwar\" (pos 8.6) — all have commercial intent. Google Ads on these at exact match = est. ROAS 2.4+.", color: "teal" },
  { type: "customer", title: "Your best customers spend 4.1× more — nurture them", body: "Top 20% customers (Champions segment) have LTV ₹4,480 vs store avg ₹1,091. Create a VIP WhatsApp group with early access to new drops. Cost: ₹0. Expected revenue lift: ₹18–25K/month.", color: "pink" },
];

// ── Timing heatmap data ───────────────────────────────────────────────────────
export const heatmapData = [
  [0.2, 0.3, 0.4, 0.3, 0.4, 1.2, 1.4],
  [0.1, 0.2, 0.3, 0.2, 0.3, 0.8, 1.0],
  [0.3, 0.4, 0.5, 0.4, 0.5, 1.5, 1.8],
  [0.8, 0.9, 1.0, 0.9, 1.1, 2.2, 2.5],
  [1.4, 1.5, 1.6, 1.5, 1.8, 3.2, 3.8],
  [1.8, 2.0, 2.1, 2.0, 2.4, 4.1, 4.2],
  [2.2, 2.4, 2.5, 2.4, 3.0, 3.8, 3.5],
  [1.6, 1.8, 1.9, 1.8, 2.2, 2.8, 2.4],
  [1.0, 1.1, 1.2, 1.1, 1.4, 1.8, 1.6],
  [0.5, 0.6, 0.7, 0.6, 0.8, 1.0, 0.9],
];
export const heatmapHours = ["8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm"];
export const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Dashboard summary used by AI chat ────────────────────────────────────────
export const dashboardContext = `
Skylitee Analytics Summary for fabonique (Aug 1–19, 2025):

FINANCIAL PERFORMANCE:
- Gross Sales: ₹2,35,576 (+12.4% MoM)
- Blended ROAS: 1.34 (target: 1.5, break-even: 1.85)
- Total Orders: 216 (+9.1% MoM)
- AOV: ₹1,091
- Ad Spend: ₹1,75,811 / ₹3,00,000 budget (59% used)
- New Customers: 184, CAC: ₹897
- Net Contribution: -₹77,918 (currently unprofitable)

CHANNEL BREAKDOWN:
- Meta Ads: ₹1,86,063 revenue, ROAS 1.06 (below target)
- Organic SEO: ₹49,513 revenue, AOV ₹2,476 (highest quality)
- Direct: ₹8,420
- Google Ads: NOT CONNECTED (estimated ₹40–60K missed)

META CAMPAIGNS:
- CBO67: ROAS 1.53, ₹19,622 spend — SCALE this
- CBO68: ROAS 0.00, ₹2,310 spend — PAUSE this
- CBO69: ROAS 1.04, monitoring
- 3 paused campaigns with zero conversions wasted ₹14,692

TOP PRODUCTS:
- Position Print Set: 66 orders, ₹72,006, stock 142 (safe)
- Embroidery Classic: 57 orders, ₹62,187, stock 88 (monitor)
- Combo Fabric: 53 orders, ₹57,823, stock 34 (REORDER URGENTLY — 10 days)
- Combo Embroidery: 40 orders, ₹43,640, stock 210 (overstocked)

CUSTOMERS (6,820 total):
- Champions (412): LTV ₹4,480 — send VIP early access
- Loyal (834): LTV ₹2,840
- At Risk (680): LTV ₹1,091 — win-back campaign needed
- Dormant (920): LTV ₹540 — last-chance offer
- New (2,734): need nurture sequence

GOOGLE SEARCH CONSOLE:
- Total clicks: 4,820 (+18.3% MoM)
- "fabric sets online": pos 3.2, 840 clicks
- "buy embroidery dress": pos 7.1 (striking distance for Google Ads)
- "ethnic combo set": pos 14 (needs SEO fix)

GA4 WEBSITE:
- Sessions: 8,340, Bounce rate: 68% (mobile high)
- Checkout → Payment drop: 39% (biggest leak = ₹3.1L in lost orders)
- Returning users convert 3.8× more than new users

KEY URGENT ACTIONS:
1. Connect Google Ads — est. ₹40–60K immediate impact
2. Reorder Combo Fabric (150 units) — 10 days to stockout
3. Pause Embroidery static creative (frequency 2.8)
4. Scale CBO67 by 20%
5. Launch ₹75 prepaid incentive to reduce 54% COD ratio
`;
