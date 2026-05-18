export const metadata = { title: "Cookie Policy — Skylitee" };

export default function CookiesPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", color: "#18181b", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Cookie Policy</h1>
      <p style={{ color: "#71717a", marginBottom: 32 }}>Last updated: May 19, 2026 · Skylitee – Ads and Reports by Orange Sky</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. What are cookies?</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help us keep you logged in and remember your preferences.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Cookies we use</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f5f5f4" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Cookie</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Purpose</th>
              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "shopify_shop", purpose: "Identifies your Shopify store for session lookup", duration: "30 days" },
              { name: "shopify_state", purpose: "OAuth state verification (security)", duration: "Session" },
              { name: "google_gsc_token", purpose: "Google Search Console auth fallback", duration: "30 days" },
              { name: "google_ga4_token", purpose: "Google Analytics 4 auth fallback", duration: "30 days" },
              { name: "meta_token", purpose: "Meta Ads auth fallback", duration: "60 days" },
              { name: "skylitee-theme", purpose: "Remembers your dark/light mode preference", duration: "Persistent" },
            ].map(c => (
              <tr key={c.name} style={{ borderBottom: "1px solid #e5e5e5" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>{c.name}</td>
                <td style={{ padding: "8px 12px", color: "#52525b" }}>{c.purpose}</td>
                <td style={{ padding: "8px 12px", color: "#71717a" }}>{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Third-party cookies</h2>
        <p>We do not use advertising cookies or tracking pixels on our dashboard. The Shopify App Store listing page may use Shopify&apos;s own cookies, which are governed by Shopify&apos;s cookie policy.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Managing cookies</h2>
        <p>You can clear cookies at any time through your browser settings. Note that clearing the <code>shopify_shop</code> cookie will log you out of Skylitee and require you to reinstall the app to regain access.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Contact</h2>
        <p>For questions about our cookie usage, contact <a href="mailto:account@skylitee.io" style={{ color: "#f97316" }}>account@skylitee.io</a>.</p>
      </section>
    </main>
  );
}
