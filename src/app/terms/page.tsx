export const metadata = { title: "Terms of Service — Skylitee" };

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", color: "#18181b", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: "#71717a", marginBottom: 32 }}>Last updated: May 19, 2026 · Skylitee – Ads and Reports by Orange Sky</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Acceptance of Terms</h2>
        <p>By installing or using Skylitee, you agree to these Terms of Service. If you do not agree, do not use the app.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Description of Service</h2>
        <p>Skylitee is an analytics dashboard that connects to your Shopify store, Meta Ads account, Google Search Console, and Google Analytics 4 to display unified reporting data. The service is provided as-is and subject to availability.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Account and Access</h2>
        <p>Access to Skylitee is granted through Shopify OAuth. You are responsible for maintaining the security of your Shopify account. You may not share access credentials or allow unauthorized parties to access your dashboard.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Billing and Payments</h2>
        <p>Skylitee Pro is available at $29 USD per month with a 14-day free trial. All billing is managed by Shopify through their standard app billing system. You authorize Shopify to charge your account upon trial expiry. Subscriptions renew automatically every 30 days unless cancelled.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Cancellation</h2>
        <p>You may cancel your subscription at any time from your Shopify admin. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Data Usage</h2>
        <p>Skylitee accesses your store data solely to display analytics within your dashboard. We do not sell, share, or transfer your data to third parties. See our Privacy Policy for full details.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>7. Limitation of Liability</h2>
        <p>Skylitee is provided as an analytics tool only. We are not liable for any business decisions made based on data displayed in the dashboard. We do not guarantee accuracy of third-party data (Shopify, Meta, Google) shown in the app.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>8. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>9. Contact</h2>
        <p>For questions about these terms, contact <a href="mailto:account@skylitee.io" style={{ color: "#f97316" }}>account@skylitee.io</a>.</p>
      </section>
    </main>
  );
}
