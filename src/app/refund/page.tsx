export const metadata = { title: "Refund Policy — Skylitee" };

export default function RefundPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", color: "#18181b", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Refund Policy</h1>
      <p style={{ color: "#71717a", marginBottom: 32 }}>Last updated: May 19, 2026 · Skylitee – Ads and Reports by Orange Sky</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1. Free Trial</h2>
        <p>Skylitee offers a 14-day free trial with full access to all features. No credit card is required during the trial period. We encourage you to fully evaluate the app during this time before subscribing.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2. Subscription Charges</h2>
        <p>After the free trial, a subscription charge of $29 USD per month is applied through Shopify Billing. By approving the subscription in your Shopify admin, you agree to this recurring charge.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>3. Refund Eligibility</h2>
        <p>We do not offer refunds for subscription charges once they have been processed, as we provide a generous 14-day free trial to evaluate the service. If you believe you were charged in error, please contact us within 7 days of the charge and we will review your case.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>4. Cancellation</h2>
        <p>You may cancel your subscription at any time from your Shopify admin under Apps → Skylitee. Your access will continue until the end of the current billing period. No further charges will be made after cancellation.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>5. Exceptional Cases</h2>
        <p>If you experience a technical issue that prevented you from accessing the app for an extended period, please contact us. We will review such cases individually and may offer a credit or partial refund at our discretion.</p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>6. Contact</h2>
        <p>For refund requests or billing questions, contact <a href="mailto:support@skylitee.io" style={{ color: "#f97316" }}>support@skylitee.io</a>.</p>
      </section>
    </main>
  );
}
