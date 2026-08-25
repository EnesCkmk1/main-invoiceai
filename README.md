<div align="center">

# InvoiceFlow AI

**The fastest way to send a professional invoice.**

Create and send a beautiful, branded invoice in under 30 seconds — with an AI
assistant that turns a single sentence into a complete, editable draft.

[Live demo](https://invoiceflow-ai-eosin.vercel.app) · [Highlights](#highlights) · [Tech stack](#tech-stack) · [Getting started](#getting-started) · [Configuration](#configuration)

</div>

---

> **Invoicing, not accounting.** No bookkeeping, no VAT filing, no bank
> reconciliation — just create, send and get paid. Built for freelancers,
> consultants, tradespeople, agencies and small businesses.

Everything works **without AI**. The AI is an assistant that makes you
dramatically faster — never a requirement. When no OpenAI key is present, a
deterministic rule-based engine handles the same natural-language prompts
offline.

## Live demo

**[invoiceflow-ai-eosin.vercel.app](https://invoiceflow-ai-eosin.vercel.app)**

```
Email:    demo@invoiceflow.ai
Password: password123
```

> Shared public demo account — please don't store anything sensitive in it.

Hosted on Vercel (Express API + Vite SPA served from the same origin) with
Neon Postgres.

## Highlights

- **AI invoice creation** — _"Invoice Anders Hansen for 12 hours of web
  development at 750 DKK/hour with 25% VAT and 14-day terms"_ → a complete,
  editable draft. Runs offline via a rule-based parser; upgrades automatically
  when an OpenAI key is configured.
- **Classic builder** — line items, per-line VAT, discounts, multiple
  currencies, recurring invoices, credit notes, duplicate.
- **Beautiful PDFs** — logo, brand colours, QR payment code, bank details,
  print-optimised.
- **Send & track** — email invoices with the PDF attached; track sent / opened
  / downloaded / paid; automatic reminders.
- **Online payments** — public payment page with Stripe Checkout (card, Apple
  Pay, Google Pay); bank-transfer details included.
- **Dashboard & analytics** — revenue, outstanding, payment speed, best
  customers, overdue, monthly growth.
- **Premium UX** — Stripe/Linear/Notion/Apple-inspired UI, dark mode, keyboard
  shortcuts, subtle animations, fully responsive.
- **Auth** — email/password, magic link, Google login, forgot/reset password
  (JWT).

## Tech stack

| Layer    | Tech                                                              |
| -------- | ---------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend  | Express 5, TypeScript, Prisma ORM, Zod, JWT                      |
| Database | PostgreSQL (Neon in production)                                  |
| PDF      | PDFKit + QRCode                                                  |
| Email    | Nodemailer (SMTP)                                                |
| Payments | Stripe — invoice payments + subscription billing                |
| AI       | Rule-based parser (default) + optional OpenAI                    |

## Project structure

```
.
├── server/                     # Express + Prisma API
│   ├── prisma/schema.prisma    # data model
│   ├── prisma/seed.ts          # demo data
│   └── src/
│       ├── routes/             # auth, invoices, customers, billing, ai, …
│       ├── services/           # ai parser, pdf, invoice calc
│       ├── middleware/         # auth
│       └── lib/                # prisma, stripe, mailer, jwt, http
└── client/                     # React 19 + Vite SPA
    └── src/
        ├── pages/              # landing, auth, app (dashboard, invoices, …)
        ├── components/         # UI kit
        └── lib/                # api client, auth, theme, types
```

## Getting started

**Prerequisites:** Node 22.x and Docker (or any local PostgreSQL).

### 1. Start PostgreSQL

```bash
docker compose up -d          # Postgres on localhost:5432
```

Or point `DATABASE_URL` at any existing Postgres instance.

### 2. Backend

```bash
cd server
cp .env.example .env          # adjust as needed
npm install
npm run prisma:migrate        # create tables
npm run db:seed               # optional demo data
npm run dev                   # http://localhost:4000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api → :4000)
```

After seeding, sign in with **`demo@invoiceflow.ai`** / **`password123`**.

## Configuration

All backend config lives in `server/.env` (see
[`.env.example`](server/.env.example)). Only `DATABASE_URL` and `JWT_SECRET`
are required — everything else is optional and the app degrades gracefully.

| Variable                                                     | Purpose                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `DATABASE_URL` **(required)**                                | PostgreSQL connection string                                               |
| `JWT_SECRET` **(required)**                                  | Signing key — must be ≥ 32 random chars in production                       |
| `SMTP_*`                                                     | Deliver real emails; otherwise messages are logged to the console          |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Enable online payments + subscription billing; a demo flow is used without |
| `GOOGLE_CLIENT_ID`                                           | Enable Google sign-in                                                      |
| `OPENAI_API_KEY`, `OPENAI_MODEL`                             | Layer an LLM on top of the built-in parser (not required)                  |

## Scripts

**Backend** (`server/`): `dev`, `build`, `start`, `typecheck`,
`prisma:migrate`, `prisma:deploy`, `db:seed`
**Frontend** (`client/`): `dev`, `build`, `preview`, `typecheck`

CI (GitHub Actions) type-checks and builds both packages and fails the build on
any new high/critical npm advisory.

## Security

- **Dependencies** — runtime packages verified CVE-free against the npm advisory
  DB and OSV.dev, permissive licenses only (MIT/ISC/BSD/Apache-2.0); CI blocks
  new high/critical advisories.
- **Headers & limits** — `helmet` security headers, JSON body capped at 1 MB,
  `x-powered-by` disabled.
- **Rate limiting** — global API limiter plus strict limits on
  login/register/magic-link/reset (brute-force protection) and AI endpoints.
- **Auth hardening** — production refuses to boot without a strong `JWT_SECRET`;
  magic-link and reset tokens are stored **hashed (SHA-256)**, single-use, with
  short expiry; passwords are bcrypt-hashed; Google login is disabled unless a
  `GOOGLE_CLIENT_ID` is set (token audience always verified).
- **Payments** — the demo "simulate payment" endpoint is hard-disabled in
  production; Stripe webhooks are signature-verified against the raw body.
- **Enumeration** — forgot-password always responds identically; login errors
  never reveal whether an email exists.

**Documented trade-offs:** the JWT is kept in `localStorage` (simple, but relies
on XSS protection — consider httpOnly cookies + CSRF tokens before a real
launch), and magic-link sign-in auto-creates accounts by design.

## License

Released under the [MIT License](LICENSE).
