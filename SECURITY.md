# Security policy

InvoiceFlow AI is a portfolio project. Please do not include real customer data,
API keys, payment details or other secrets in bug reports.

## Reporting a vulnerability

Open a private GitHub security advisory for this repository when possible. If
that is unavailable, open an issue with the smallest reproducible description
and write `security` in the title. Do not publish exploit details before a fix
is available.

The maintainer will acknowledge reports as soon as practical and will document
the remediation in the release notes.

## Security boundaries

The application includes input validation, security headers, rate limiting,
hashed one-time tokens and Stripe webhook signature verification. Production
deployments still need secret management, HTTPS, database backups, monitoring,
access reviews and a separate threat model. The demo account is not suitable
for sensitive data.
