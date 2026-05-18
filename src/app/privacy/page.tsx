export const metadata = { title: "Privacy Policy – Skylitee" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", color: "#18181b", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: "#71717a", marginBottom: 32 }}>Last updated: May 19, 2026 · Skylitee – Ads and Reports by Orange Sky</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. What we collect</h2>
        <p>
          Skylitee connects to your Shopify store, Google accounts (Search Console and Analytics 4), and Meta Business account to display analytics and advertising data to you. We access the following data solely to provide the dashboard functionality:
        </p>
        <ul style={{ paddingLeft: 24, marginTop: 8 }}>
          <li>Shopify: orders, products, customers (names, cities, segments), revenue metrics</li>
          <li>Google Search Console: clicks, impressions, keywords, pages</li>
          <li>Google Analytics 4: sessions, traffic sources, ecommerce events</li>
          <li>Meta Ads: campaign spend, ROAS, impressions, creative performance</li>
        </ul>
        <p style={{ marginTop: 8 }}>We do not collect or store customer email addresses, phone numbers, or payment details.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. How we use your data</h2>
        <p>
          All data is used exclusively to display analytics within your Skylitee dashboard. We do not sell, share, or transfer your data or your customers&apos; data to any third party. Data is fetched in real time from Shopify and Google/Meta APIs and is not permanently stored on our servers beyond what is required for session authentication.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Data storage and security</h2>
        <p>
          OAuth access tokens are stored in Upstash Redis (encrypted at rest) and are used only to make authenticated API requests on your behalf. All data is transmitted over HTTPS (TLS). We do not store raw customer records in our database.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Data retention</h2>
        <p>
          Access tokens are retained until you disconnect your account or uninstall the app. On uninstall, all stored tokens and shop data are permanently deleted from our system.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. GDPR compliance</h2>
        <p>
          Skylitee complies with Shopify&apos;s mandatory GDPR webhooks. Upon receiving a customer data request, customer redact, or shop redact webhook from Shopify, we process the request immediately. Since we do not store customer PII beyond authentication tokens, most redact requests are acknowledged with no further action required.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Third-party services</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li>Shopify Admin API — to read store data</li>
          <li>Google APIs — Search Console and Analytics 4</li>
          <li>Meta Marketing API — ad account data</li>
          <li>Upstash Redis — encrypted token storage</li>
          <li>Vercel — application hosting</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Your rights</h2>
        <p>
          You can disconnect any platform at any time from the Connections page in your dashboard. To request deletion of all your data, uninstall the app from your Shopify admin or contact us at the email below.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Contact</h2>
        <p>
          For any privacy-related questions, contact us at{" "}
          <a href="mailto:account@skylitee.io" style={{ color: "#f97316" }}>account@skylitee.io</a>.
        </p>
      </section>
    </main>
  );
}
