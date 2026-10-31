export const metadata = { title: "Privacy Policy – Skylitee" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", color: "#18181b", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#71717a", marginBottom: 32 }}>Last updated: October 31, 2026 · Skylitee – Ads and Reports by Orange Sky</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. What we collect</h2>
        <p>
          Skylitee connects to your Shopify store, Google accounts (Search Console, Analytics 4 and Google Ads), and Meta Business account to display analytics and advertising data to you. We access the following data solely to provide the dashboard functionality:
        </p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li>Shopify: orders, products, customers (names, cities, segments), revenue metrics</li>
          <li>Google Search Console: clicks, impressions, keywords, pages</li>
          <li>Google Analytics 4: sessions, traffic sources, ecommerce events</li>
          <li>Google Ads: accessible ad account IDs, campaign spend, clicks, impressions, conversions, keywords</li>
          <li>Meta Ads: campaign spend, ROAS, impressions, creative performance</li>
        </ul>
        <p style={{ marginTop: 8 }}>We do not collect or store customer email addresses, phone numbers, or payment details.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. How we use your data</h2>
        <p>
          All data is used exclusively to display analytics and reports within your Skylitee dashboard. We do not sell, share, or transfer your data or your customers&apos; data to any third party. Data is fetched from Shopify and Google/Meta APIs and may be cached for a short time (typically minutes to hours) to keep the dashboard fast; it is not otherwise stored on our servers.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Google user data</h2>
        <p>
          When you connect a Google account, Skylitee requests read-only access to Search Console (webmasters.readonly) and Analytics (analytics.readonly), and access to Google Ads (adwords). We use this access only to read your reporting data and show it to you in your dashboard. Skylitee does not create, edit, pause or delete any Google Ads campaigns, ads, budgets or settings.
        </p>
        <p style={{ marginTop: 8 }}>
          Skylitee&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" style={{ color: "#f97316" }}>Google API Services User Data Policy</a>, including the Limited Use requirements. Specifically, we do not use Google user data for advertising, we do not sell it, we do not use it to train AI or machine learning models, and no person reads it unless you ask us to for support, it is needed for security, or the law requires it.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Data storage and security</h2>
        <p>
          OAuth access tokens are stored in Upstash Redis (encrypted at rest) and are used only to make authenticated API requests on your behalf. All data is transmitted over HTTPS (TLS). We do not store raw customer records in our database.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Data retention</h2>
        <p>
          Access tokens are retained until you disconnect your account or uninstall the app. Disconnecting a Google or Meta account from the Connections page deletes its stored token. On uninstall, all stored tokens and shop data are permanently deleted from our system.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. GDPR compliance</h2>
        <p>
          Skylitee complies with Shopify&apos;s mandatory GDPR webhooks. Upon receiving a customer data request, customer redact, or shop redact webhook from Shopify, we process the request immediately. Since we do not store customer PII beyond authentication tokens, most redact requests are acknowledged with no further action required.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Third-party services</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li>Shopify Admin API - to read store data</li>
          <li>Google APIs - Search Console, Analytics 4 and Google Ads</li>
          <li>Meta Marketing API - ad account data</li>
          <li>Upstash Redis - encrypted token storage</li>
          <li>Vercel - application hosting</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Your rights</h2>
        <p>
          You can disconnect any platform at any time from the Connections page in your dashboard. You can also remove Skylitee&apos;s access to your Google account at any time from{" "}
          <a href="https://myaccount.google.com/permissions" style={{ color: "#f97316" }}>myaccount.google.com/permissions</a>. To request deletion of all your data, uninstall the app from your Shopify admin or contact us at the email below.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>9. Contact</h2>
        <p>
          For any privacy-related questions, contact us at{" "}
          <a href="mailto:account@skylitee.io" style={{ color: "#f97316" }}>account@skylitee.io</a>.
        </p>
      </section>
    </main>
  );
}
