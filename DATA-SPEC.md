# Skylitee — Data Specification

> **What this is:** the source-of-truth for *what data each page and section should display*, and *why it matters*. Written from a data-analyst perspective so every number on the screen earns its place.

---

## 1. Who this is for & the guiding principle

**Audience:** D2C **marketers**, **founders**, and **Shopify store owners** (India-first).

**The product doctrine — "the lottery test":**
> Every screen should give the owner something they **cannot easily get anywhere else**. If a number is already one click away in Shopify Admin or Meta Ads Manager, it is *table stakes* — show it, but it is not why they log in. The reason they log in is the **blended, cross-channel, profit-aware, decision-ready** view that no single platform gives them.

So every section is tagged:
- ⭐ **EDGE** — unique, hard-to-get-elsewhere insight (this is the moat).
- ▫️ **BASE** — standard metric, expected and necessary, but not differentiating.

Rule of thumb: **a page should lead with EDGE, support with BASE.** If a page is all BASE, it's a candidate to cut or merge.

---

## 2. Global conventions (apply to every page)

| Convention | Rule |
|---|---|
| **Date range** | Single global range (Today / Yesterday / 7d / 28d / This month / Last month / Custom). Every page respects it. Timezone = store-local (Shopify), Pacific (GSC), property tz (GA4). |
| **Comparison** | Every headline KPI shows **Δ vs previous equal period** (▲/▼ %, green/red). A number without a trend is half a number. |
| **Benchmarks** | Compare to a D2C-India benchmark. **GREEN** = at/above good (say *why it works*); **RED** = below (say *why + the fix*). Never neutral-orange for "good". |
| **Accuracy** | Match the source dashboard exactly. Leads use Ads-Manager "Results" logic (not max of events). Revenue is refund-aware; test/cancelled orders excluded. |
| **Empty/again** | Never show fabricated/sample data. If a platform isn't connected, show a "Connect →" prompt, not zeros that look real. |
| **Decision line** | Every section ends with a one-line **"so what / do this"** (the action), not just the metric. |

---

## 3. ⭐ The Edge-Metric Catalog (the moat)

These are the cross-channel / profit-aware metrics that make the platform worth opening. They should appear prominently (Command Center, Financial, Attribution, Reports).

| Metric | Formula | Why it's edge | Target |
|---|---|---|---|
| **Blended ROAS / MER** | Total store revenue ÷ (Meta + Google ad spend) | No ad platform knows your *total* revenue; Meta only sees Meta-attributed sales. This is the true marketing efficiency. | ≥ break-even (below) |
| **Blended CAC** | Total ad spend ÷ **new** customers | Real cost to acquire a customer across all channels, not per-platform. | ≤ contribution/order |
| **New-Customer MER (aMER)** | New-customer revenue ÷ ad spend | Strips repeat revenue — shows if ads actually *acquire*, not harvest. | ≥ 1.5–2× |
| **Break-even ROAS** | 1 ÷ contribution-margin % | The ROAS line below which you lose money. Turns "is 2.5x good?" into a yes/no. | computed per store |
| **Contribution margin / order** | AOV − COGS − shipping − fees − RTO allocation | The real money left to pay for ads + profit. | > 0, ideally > CAC |
| **True Net Profit** | Revenue − discounts − refunds − COGS − shipping − RTO loss − COD fee − gateway fee − ad spend − overheads | Shopify shows "sales", never *profit*. This is the founder's #1 question. | positive, margin ≥ 10–15% |
| **RTO / COD risk economics** | COD orders × RTO% × (2-way shipping + handling) | India-specific cash leak nobody else quantifies. | minimise; push prepaid |
| **LTV : CAC** | (AOV × repeat freq × margin) ÷ CAC | Whether the business compounds. | ≥ 3 : 1 |
| **CAC payback (months)** | CAC ÷ (monthly contribution per customer) | How long until a customer is profitable. | ≤ 3 months |
| **Cohort retention curve** | % of each month's cohort repurchasing in month 1..N | Shows real retention, not a vanity repeat-rate. | M1 ≥ 20% |
| **Creative fatigue** | Frequency ≥ 2.5 + rising CPM + falling CTR | Tells you *which creative to kill* before it drains budget. | freq ≤ 2.5 |
| **Day-parting ROAS** | ROAS by hour-of-day and day-of-week | Lets you schedule ads to profitable windows — invisible in Ads Manager default view. | act on top/bottom |
| **Branded vs non-branded search** | GSC queries split by brand terms | Separates demand you *created* (ads/PR) from demand you *captured*. | grow non-branded |
| **Cross-platform funnel** | Ad click → session (GA4) → ATC → checkout → purchase (Shopify) | One funnel stitched across 3 tools — the leak between ad and store is where money dies. | find the drop |

---

## 4. ⭐ The Ad-Objective KPI Framework (critical)

**Principle:** *An ad is only "good" or "bad" relative to the objective it was optimized for.* Judging a Leads campaign on ROAS, or an Awareness campaign on conversions, is wrong and misleads the owner. Meta's objective is `OUTCOME_*`; we map every campaign to one of five and **show only the KPIs that matter for that objective**, with the objective's own "Result" and "Cost per Result".

### 4.1 Objective → KPI matrix

| Objective | **Result** (headline) | **Cost metric** | **Efficiency KPI** | Supporting KPIs | Benchmark (D2C India) |
|---|---|---|---|---|---|
| **Sales / Conversions** | Purchases / Orders | CAC (cost per purchase) | **ROAS** (vs break-even) | AOV, Revenue, Conv. rate, ATC→Purchase %, CTR, CPC, Frequency | ROAS ≥ break-even; target ≥ 3× |
| **Leads** | **Leads** (form + messaging + calls, = Ads-Manager "Results") | **Cost per Lead (CPL)** | Lead rate (leads ÷ clicks) | CTR, CPC, CPM, ⭐ Lead→Sale rate, ⭐ Cost per *qualified* lead | CPL ₹100–300; lead→sale ≥ 10% |
| **Traffic** | **Landing-page views** (not link clicks) | **Cost per visit (Cost/LPV)** | ⭐ LP ratio = LPV ÷ clicks | CTR, CPC, GA4 sessions, bounce %, avg session | Cost/visit ≤ ₹8; LP ratio ≥ 80% |
| **Awareness / Reach** | Reach / Impressions | **CPM** | Frequency (fatigue) | ⭐ Thumb-stop %, Hold %, ⭐ branded-search lift, ⭐ direct-traffic lift | CPM ₹100–250; Freq ≤ 2.5 |
| **Engagement** | Post engagement / messaging / 3s video views | Cost per engagement | CTR | Video thumb-stop/hold, comments/shares | CTR ≥ 1% |

> **Display rule:** the Meta Overview leads with a **Performance-by-Objective** strip — one scorecard per objective present, each showing its *own* Result + Cost-per-Result + efficiency KPI, flagged green/red. Selecting an objective swaps the KPI cards to that objective's set. Account-level "ROAS / Orders" is scoped to **conversion campaigns only**, so lead/awareness spend never drags it red.

### 4.2 The lead-funnel edge (most stores get this wrong)
For Leads accounts, show the **full lead economics**, not just CPL:
- Leads → ⭐ **Lead→Sale conversion %** (tie Shopify orders / CRM back to lead volume) → ⭐ **Cost per acquired customer from leads** → ⭐ **Revenue per lead**.
- Messaging/WhatsApp leads counted correctly (conversation-started), separated from form leads.

---

## 5. Page-by-page data specification

Legend: ⭐ EDGE · ▫️ BASE · 🎯 benchmark/flag · 👉 action line.

### 5.1 Command Center — `/dashboard`
*The 30-second "how's the business" view. Must be all signal.*
- **Hero KPIs (with Δ vs prev):** ▫️ Revenue · ⭐ Blended ROAS (MER) · ▫️ Orders · ▫️ AOV · ▫️ Total Ad Spend (Meta+Google) · ⭐ Blended CAC (replace generic 6th card). 🎯 ROAS vs break-even.
- ⭐ **Revenue vs Ad Spend** chart + **pace forecast** (projected month-end at current run-rate vs goal).
- ⭐ **Channel Performance** — per channel: spend, attributed revenue, ROAS, share of revenue; + ⭐ **organic vs paid split**.
- ⭐ **Alerts & Signals** — anomalies across all channels (ROAS drop, spend spike, COD spike, stock-out, CTR collapse). 👉 each alert links to the fix.
- ⭐ **Key Insights** — 3–5 ranked, benchmark-driven callouts. 👉 action each.
- **Add:** ⭐ **Today's profit estimate** (net, using saved cost model) — the single number a founder wants.

### 5.2 Sales Report — `/dashboard/sales`
- **KPIs:** ▫️ Gross Sales, Orders, AOV · ⭐ ROAS (conversion-scoped) · ⭐ CAC · add ⭐ **Net revenue (after refunds/discounts)** and ⭐ **% new-customer revenue**.
- ⭐ **Channel Attribution** table — Shopify total vs Meta vs Google vs Organic/Direct (orders, revenue, spend, ROAS).
- ⭐ **Payment split (COD vs Prepaid)** + 🎯 COD>50% warning + 👉 prepaid-incentive nudge (India edge).
- ▫️ Top products (qty & revenue), SKU table, top cities/states.
- ⭐ **Cross-platform conversion funnel** (sessions → ATC → checkout → purchase) with drop-off %.
- ▫️ Recent orders (with COD/prepaid + status).

### 5.3 Monthly Goals — `/dashboard/goals`
- ▫️ Goal inputs (Revenue, Orders, AOV, ROAS, Ad budget) — **store server-side, not localStorage**.
- ⭐ **Pace tracker** — projected month-end vs target, "need ₹X/day to hit goal", on-track/behind per metric.
- ▫️ Last-month baseline; goal history. 👉 "to hit target, raise spend to X at current ROAS / lift AOV by Y".

### 5.4 Product Analytics — `/dashboard/products`
- ▫️ Total products, best seller, orders, low stock.
- ⭐ **Inventory & demand forecast** — sell-through rate, **days-of-stock left**, reorder-now flag. 👉 reorder/bundle action.
- ⭐ **Revenue concentration** — top-N products = X% of revenue (Pareto risk). 
- **Add:** ⭐ **Product-level margin** (using cost model) — best *sellers* vs best *earners* are different.
- **Add:** ⭐ **Return/RTO rate by product** (which SKUs bleed).

### 5.5 Customer Intel — `/dashboard/customers`
- ▫️ Total customers, New (period) · ⭐ Avg LTV · ⭐ Repeat rate (🎯 ≥25%) · ⭐ **LTV:CAC**.
- ⭐ **Segments** — new / one-time / repeat / VIP; ⭐ **time-to-second-order**.
- ⭐ **AI actions** — win-back one-timers, reward repeat, prepaid nudge.
- ▫️ Top cities by customers.
- **Add:** ⭐ **CAC payback period**.

### 5.6 Cohort Analysis — `/dashboard/cohort`
- ⭐ **Retention matrix** (month 0→N % repurchase) — *the* retention truth.
- ⭐ Revenue by cohort; ⭐ best/worst cohort, M2 churn; 👉 "+5pts retention = ₹X with zero ad spend".
- **Add:** ⭐ **cohort LTV curve** (cumulative revenue per cohort over time).

### 5.7 Geo Performance — `/dashboard/geo`
- ▫️ Top cities/states by revenue & orders; top-city share.
- **Add:** ⭐ **RTO/COD rate by city** (India edge — some pincodes/cities return far more) → 👉 restrict COD or add prepaid-only zones.
- **Add:** ⭐ **AOV & repeat rate by city** (where are the *good* customers).

### 5.8 Meta Campaigns — `/dashboard/meta`
- ⭐ **Performance by Objective** scorecards (§4) — the centrepiece.
- Objective-scoped KPI cards (Sales/Leads/Traffic/Awareness/Engagement sets per §4.1).
- ▫️ Reach/Delivery, Click performance.
- ⭐ **Conversion funnel** + ratio strip (LP/ATC/Checkout/Purchase) 🎯 each vs benchmark.
- ⭐ **What's Working / Not** diagnosis (source-tagged: Ad vs Website vs Overall).
- ⭐ **Drill-down** Campaign→AdSet→Ad→Creative with creative preview + per-ad fix advice.
- **Add:** ⭐ **incremental/marginal ROAS** on last spend increase (is scaling still profitable?).

### 5.9 Ads Placement — `/dashboard/placement`
- ⭐ Breakdown by **Placement / Age / Gender / Time / Device** — each with objective-correct Result + Cost-per-Result.
- ⭐ **Winner headline** (best placement/segment) + budget-drain flag. 👉 shift budget / exclude.
- ▫️ Spend & ROAS charts; full tables.

### 5.10 Creative Studio — `/dashboard/creative`
- ⭐ **Creative Score (0–100)** = 40% objective-efficiency + 30% CTR + 30% freshness; Scale/Keep/Refresh/Pause signal.
- ⭐ **Fatigue detection** (frequency ≥2.5, CPM rising). 👉 refresh/kill.
- ⭐ Format & hook analysis — ⭐ thumb-stop %, hold %; objective-aware result tile.
- ▫️ Creative preview + copy.

### 5.11 Time Intelligence — `/dashboard/timing`
- ⭐ **ROAS by hour-of-day** and **day-of-week** — day-parting edge.
- ⭐ Peak purchase hour, best day; worst (high-spend/low-ROAS) windows. 👉 ad-schedule recommendation.

### 5.12 Google Ads — `/dashboard/gads`
- ▫️ Spend, ROAS, Conversions, Conv. value, Clicks, Impr, CTR, CPC, Cost/conv.
- ▫️ Campaign & keyword tables. ⭐ feed into **blended** ROAS/CAC on Command Center (its real value is blending, not standalone).

### 5.13 Search Console — `/dashboard/gsc`
- ▫️ Clicks, Impressions, CTR, Avg position (🎯 CTR ≥2%, pos ≤10).
- ⭐ **Branded vs non-branded** split (demand created vs captured).
- ⭐ **CTR opportunities** — high-impression/low-CTR queries = "free clicks" if title/meta improved. 👉 rewrite metas.
- ▫️ Top queries/pages, devices, countries, sitemap health.

### 5.14 Analytics GA4 — `/dashboard/ga4`
- ▫️ Sessions, Users, New/Returning, Bounce, Avg session.
- ⭐ **Channel mix** + ⭐ **ecommerce funnel** (view→ATC→checkout→purchase rates) — site-side leak detection.
- ▫️ Geo, landing pages. ⭐ **Landing-page conversion** (which LPs convert vs bounce).

### 5.15 Attribution — `/dashboard/attribution`
- ⭐ Revenue by source (Meta / Google / Organic / Direct) + % of total.
- ⭐ **Paid vs organic**; ⭐ pixel funnel rates; ⭐ cross-platform funnel.
- ⭐ Campaign attribution table. 👉 "X% of revenue is organic — paid is over/under-credited".

### 5.16 Financial P&L — `/dashboard/financial`
*The founder's profit truth. Highest-edge page.*
- ▫️ Cost inputs (COGS, shipping, RTO%, RTO cost, overheads, gateway %, COD %) — **store server-side**.
- ⭐ **Full P&L:** money in → fulfilment costs → RTO loss → fees → gross profit → ad spend → overheads → **Net profit** (₹ + margin %).
- ⭐ **Break-even ROAS**, ⭐ contribution/order, ⭐ "where your ₹100 goes", ⭐ per-order economics (incl. CAC, profit/order, LTV).
- 👉 plain-English verdict: profitable / RTO eating ads / ads not yet profitable.

### 5.17 Weekly Digest — `/dashboard/weekly`
- ⭐ Week-vs-week headline + WoW deltas; top campaigns; ⭐ **prioritised action items**; next-week forecast. (Fix dead PDF button + COD calc.)

### 5.18 Anomaly Feed — `/dashboard/anomaly`
- ⭐ Cross-channel anomalies (not Shopify-only): ROAS drop, CPM spike, CTR collapse, COD spike, stock-out, refund spike. Severity-ranked. 👉 each → fix.

### 5.19 Custom Report Builder — `/dashboard/reports/builder`
- Pick blocks (Sales/Customers/Meta/GA4/GSC/AI) → ordered → date range → ⭐ **white-label PDF** (logo, color, client name). Save templates. (Add later: image charts, CSV, scheduled email, **Financial P&L block once COGS is server-side**.)

### 5.20 Reports (SEO / Performance / Meta / Traffic / Financial / AI)
- Print/export-styled, benchmark-signal layout. ⭐ value = the **"What's Working / Needs Attention"** advice + clean shareable PDF. Consolidate the pure print-duplicates (SEO/Meta/Traffic) into the Custom Builder over time.

### 5.21 AI surfaces (Insights / Chat / AI Report)
- ⭐ **AI Insights/Report** — scored (0–100), exec summary, working/not-working, ranked recommendations *grounded in the store's real numbers* (the "advisor in your pocket" edge). Consolidate the two insight surfaces.
- ⭐ **Chat** — natural-language Q&A over live store data ("which city has worst RTO?", "which creative to kill?").

### 5.22 Account — Profile / Connections / Pricing / Admin
- **Profile:** personal, brand identity, target audience (feeds AI benchmarking), business/contact, password. ⭐ **store cost model here** (COGS etc.) so P&L works everywhere.
- **Connections:** connect/disconnect Shopify, Meta, GSC, GA4, Google Ads + account/property selection.
- **Pricing:** plan, subscribe, redeem access code.
- **Admin (owner):** Overview, ⭐ **Stores** (store-centric: owner, users+roles, connections, applied code, age), Users, Analytics, Access Codes.

---

## 6. Priority gaps to add (highest edge-per-effort)
1. ⭐ **Server-side cost model** (move COGS/goals off localStorage) → unlocks profit everywhere + P&L report block.
2. ⭐ **Net profit on Command Center** (today/period) — the founder's #1 number.
3. ⭐ **Blended CAC + LTV:CAC + payback** surfaced on Command Center / Customers.
4. ⭐ **RTO/COD economics by city & product** (India moat).
5. ⭐ **Lead→Sale economics** for Leads accounts (cost per *acquired customer*, not just CPL).
6. ⭐ **Branded vs non-branded search** + **CTR opportunities** on GSC.
7. ⭐ **Incremental/marginal ROAS** for scaling decisions.
8. Fix/replace: Benchmarking (mock data), Weekly PDF + COD bug, consolidate duplicate AI/report pages.

---

*Maintained as the data contract for Skylitee. When building a page, this defines what to show and why; when reviewing, it defines what's missing.*
