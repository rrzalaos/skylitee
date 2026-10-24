# Competitor Intel — Final Scope (not built yet)

Agreed with Rishi on 2026-10-24. Build later, when Rishi says go.

## Decisions
- **Meta only** to start. Google Ads spy (Transparency Center via SerpApi, ~$75/mo) is deferred.
- **Cheap data plan**: shared cache across stores (same competitor fetched once for everyone), weekly refresh for ads, monthly for traffic, manual "Refresh now" button, per-plan competitor limit (e.g. Basic 3 / Pro 10) or sell as paid add-on.
- **Never show estimates as real data.** Every derived number = range + confidence badge + "Estimate" label + visible/editable assumptions. "Not enough data" instead of guessing for small sites.

## Page: Competitor Intel (3 tabs) + country selector
User adds competitors (brand name / FB page / website). Country selector: India, USA, UK, UAE, EU countries, etc.

### Tab 1 — Meta Ad Spy
- All active ads per competitor: creative, copy, format (video/image/carousel), platforms, start date
- **Days running** (60+ days ≈ profitable/scaled — best proxy for spend)
- Active ad count, launch velocity (testing speed), duplicate variations (scaling signal)
- AI extraction of offers/hooks from copy (Claude Haiku, <₹0.10/ad)
- Side-by-side vs user's own Meta ads (existing Skylitee data)
- Store creatives ourselves (fbcdn URLs expire) — Vercel Blob or similar

**Data source by region**
- **EU (27 countries)**: official Meta Ad Library API (`ads_archive`) — FREE, returns real reach (`eu_total_reach`, age/country/gender breakdown), payer/beneficiary. Needs one-time identity verification on the Meta dev account. UK is NOT covered (post-Brexit).
- **India / USA / UK / UAE / rest**: official API returns nothing for commercial ads → third-party scraper (Apify or similar, ~$1–5 per 1,000 ads). Grey area vs Meta ToS (risk sits with the scraper vendor).

### Tab 2 — Traffic Intel (DataForSEO, per country)
- Estimated monthly organic traffic + 6–12 mo trend
- Top keywords & pages; **keyword gap** (they rank, you don't)
- Google paid keywords + estimated Google Ads budget
- Side-by-side vs user's REAL GSC + GA4 data
- Limits: "paid" = Google search ads only (no affordable source for Meta-driven traffic); small sites may return no data; no conversion/revenue data
- Cost: pay-as-you-go ~₹1–2 per lookup; one-time ~$50 (~₹4,500) min deposit
- Rejected: SimilarWeb API (lakhs/yr), Semrush/Ahrefs API (₹40k+/mo)

### Tab 3 — Estimated Spend & ROAS
- **Google spend**: DataForSEO estimated paid traffic cost (more reliable half)
- **Meta spend**:
  - EU ads: reach × country CPM benchmark → **High confidence**
  - Other countries: active ads × days running × variations × country CPM/budget benchmarks → **Low confidence** (often 2–3x off)
- **Revenue**: est. traffic (organic + Google paid + Meta estimate) × CVR (Indian D2C 1–2%) × AOV
- **Prices / bestsellers**: public Shopify endpoints (`/products.json`, `/collections/all?sort_by=best-selling`) — real price points, not guesses
- **ROAS** = est. revenue ÷ est. spend, shown as a range
- **USP — calibrate with user's real numbers**: use the user's own CPM, CVR, AOV from Meta + Shopify (same niche) instead of generic benchmarks — "If they perform like you, est. ROAS 1.8–2.6x". Only valid for countries the user advertises in.
- Country-specific CPMs (US ≈ 5–10x India)
- Can't see their discounts, COD RTO, or repeat customers → real ROAS likely lower than estimate; say so in UI

## Cost estimate (approx — re-verify vendor prices before building)
| Usage | Monthly cost |
|---|---|
| Rishi only, 5 competitors, Meta weekly + traffic monthly | ~₹100–550 |
| 50 stores × 5 competitors (with shared cache, less) | ~₹3,000–15,000 |
| EU ads | Free (official API) |
| One-time | ~₹4,500 DataForSEO deposit |

## Before building
- Re-check current pricing: Apify FB Ad Library actor, DataForSEO Labs, Meta API access requirements
- Complete Meta developer identity verification (for EU Ad Library API)
- Decide plan limits / add-on price
- Follow existing patterns: `getAuthorizedShop`, `requireShopPermission`, KV cache, Promise.allSettled, portal tooltips, responsive grids, benchmark GREEN/RED flagging
