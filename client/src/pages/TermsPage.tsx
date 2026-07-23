import { LegalLayout } from "../components/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p><strong>Last updated:</strong> 23 July 2026</p>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of InvoiceFlow AI (&quot;Service&quot;),
        operated from Denmark. By creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        InvoiceFlow AI is invoicing software — not an accounting, bookkeeping or tax filing system.
        You are responsible for the accuracy of invoices, VAT calculations and compliance with applicable
        Danish and EU regulations.
      </p>

      <h2>2. Account and eligibility</h2>
      <p>
        You must provide accurate registration information and keep your credentials secure.
        You must be at least 18 years old and authorised to enter into binding agreements on behalf of
        your business where applicable.
      </p>

      <h2>3. Subscription and pricing</h2>
      <p>
        Paid plans are billed monthly (currently 99 DKK/month unless otherwise stated). Prices include Danish VAT
        where applicable. Subscriptions renew automatically until cancelled. A free trial may be offered at our discretion.
      </p>

      <h2>4. Payments</h2>
      <p>
        Subscription fees are processed via Stripe. Online invoice payments to your customers are also processed
        through Stripe; payout terms follow Stripe&apos;s policies. We are not a bank or payment institution.
      </p>

      <h2>5. Your content</h2>
      <p>
        You retain ownership of data you upload (customers, invoices, logos). You grant us a limited licence to
        host, process and transmit that data solely to provide the Service, including sending emails and generating PDFs on your behalf.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful, fraudulent or misleading invoicing.</li>
        <li>Send spam or unsolicited bulk email through our platform.</li>
        <li>Attempt to breach security, reverse engineer or overload our systems.</li>
        <li>Resell or sublicense the Service without written permission.</li>
      </ul>

      <h2>7. Availability and support</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted access. Maintenance, third-party outages
        or force majeure may affect the Service. Support is provided via email on a reasonable-efforts basis.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by Danish law, InvoiceFlow AI is not liable for indirect, incidental or
        consequential damages, lost profits or data loss. Our total liability for any claim is limited to the
        fees paid by you in the twelve (12) months preceding the claim. Nothing in these Terms limits liability
        that cannot be limited under mandatory consumer or Danish law.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may cancel your subscription at any time. We may suspend or terminate accounts that violate these Terms
        or pose a security risk. Upon termination you may export your data within a reasonable period before deletion.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms. Material changes will be communicated via email or in-app notice.
        Continued use after changes take effect constitutes acceptance.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by Danish law. Disputes shall be subject to the exclusive jurisdiction of the
        courts of Denmark, without prejudice to mandatory consumer protection rules in your country of residence.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:legal@invoiceflow.ai">legal@invoiceflow.ai</a>
      </p>
    </LegalLayout>
  );
}
