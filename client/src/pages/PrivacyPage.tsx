import { LegalLayout } from "../components/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p><strong>Last updated:</strong> 23 July 2026</p>
      <p>
        InvoiceFlow AI (&quot;we&quot;, &quot;us&quot;) is operated from Denmark and provides invoicing software
        for freelancers and small businesses. This Privacy Policy explains how we collect, use and protect
        personal data in accordance with the EU General Data Protection Regulation (GDPR) and Danish data
        protection law.
      </p>

      <h2>1. Data controller</h2>
      <p>
        InvoiceFlow AI<br />
        Email: <a href="mailto:privacy@invoiceflow.ai">privacy@invoiceflow.ai</a>
      </p>

      <h2>2. What data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address, password hash (if applicable), and company profile details you provide.</li>
        <li><strong>Invoice data:</strong> customer names, contact details, invoice line items, payment status and related business information you enter.</li>
        <li><strong>Usage data:</strong> log data, device/browser information, IP address and pages visited when you use our service.</li>
        <li><strong>Payment data:</strong> subscription and invoice payment information processed by Stripe (we do not store full card numbers).</li>
        <li><strong>Waitlist:</strong> email address if you join our waitlist.</li>
      </ul>

      <h2>3. How we use your data</h2>
      <p>We process personal data to:</p>
      <ul>
        <li>Provide, maintain and improve the InvoiceFlow AI service.</li>
        <li>Send invoices and payment reminders on your behalf to your customers.</li>
        <li>Process subscriptions and invoice payments via Stripe.</li>
        <li>Send service-related emails (account, security, product updates).</li>
        <li>Comply with legal obligations and prevent fraud or abuse.</li>
        <li>Analyse aggregated usage (via privacy-friendly analytics when enabled).</li>
      </ul>

      <h2>4. Legal basis (GDPR)</h2>
      <ul>
        <li><strong>Contract (Art. 6(1)(b)):</strong> to deliver the service you signed up for.</li>
        <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> security, product improvement and analytics.</li>
        <li><strong>Consent (Art. 6(1)(a)):</strong> marketing emails and optional waitlist communications where applicable.</li>
        <li><strong>Legal obligation (Art. 6(1)(c)):</strong> accounting and tax records where required.</li>
      </ul>

      <h2>5. Processors and transfers</h2>
      <p>
        We use trusted sub-processors including hosting (Vercel), database (Neon/PostgreSQL), email (SMTP provider),
        payments (Stripe) and optional error monitoring (Sentry). Data is primarily stored in the EU/EEA.
        Where data is transferred outside the EEA, we rely on appropriate safeguards such as Standard Contractual Clauses.
      </p>

      <h2>6. Retention</h2>
      <p>
        We retain account and invoice data while your subscription is active and for a reasonable period afterwards
        to comply with legal obligations. You may request deletion of your account subject to legal retention requirements.
      </p>

      <h2>7. Your rights</h2>
      <p>Under GDPR you have the right to access, rectify, erase, restrict processing, data portability and to object.
        You may also lodge a complaint with Datatilsynet (Danish Data Protection Agency).</p>

      <h2>8. Security</h2>
      <p>
        We use encryption in transit (HTTPS), access controls and industry-standard practices to protect your data.
        No method of transmission over the Internet is 100% secure.
      </p>

      <h2>9. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management. Optional analytics (Plausible) may be
        enabled without cross-site tracking cookies when configured.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy questions or to exercise your rights, contact{" "}
        <a href="mailto:privacy@invoiceflow.ai">privacy@invoiceflow.ai</a>.
      </p>
    </LegalLayout>
  );
}
