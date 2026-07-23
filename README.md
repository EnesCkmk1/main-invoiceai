# InvoiceFlow AI

**The fastest way to send a professional invoice.** Create and send a beautiful,
branded invoice in under 30 seconds — with an AI assistant that turns one sentence
into a complete invoice.

> **Not an accounting program — just invoicing.** No bookkeeping, no VAT filing,
> no bank reconciliation. Just create, send and get paid. For freelancers,
> consultants, tradespeople, agencies and small businesses. **99 DKK/month.**

Everything works **without AI** — the AI is an assistant that makes you dramatically
faster, never a requirement.

---

## ✨ Highlights

- **AI invoice creation** — _"Invoice Anders Hansen for 12 hours of web development
  at 750 DKK/hour with 25% VAT and 14-day payment terms."_ → a complete, editable draft.
  Works offline with a deterministic rule-based engine; upgrades automatically when an
  OpenAI key is present.
- **Classic builder** — line items, VAT per line, discounts, multiple currencies,
  recurring invoices, credit notes, duplicate.
- **Beautiful PDFs** — logo, brand colors, QR payment code, bank details, print-optimised.
- **Send & track** — email invoices with the PDF attached; track sent / opened /
  downloaded / paid; automatic reminders.
- **Online payments** — public payment page with Stripe Checkout (card, Apple Pay,
  Google Pay); bank transfer details included.
- **Dashboard & analytics** — revenue, outstanding, payment speed, best customers,
  overdue, monthly growth.
- **Premium UX** — Stripe/Linear/Notion/Apple-inspired UI, dark mode, keyboard
  shortcuts, subtle animations, mobile responsive.
- **Auth** — email/password, magic link, Google login, forgot/reset password (JWT).

## 🧱 Tech stack

| Layer     | Tech                                                          |
| --------- | ------------------------------------------------------------ |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend   | Express, TypeScript, Prisma ORM, JWT                         |
| Database  | PostgreSQL                                                   |
| PDF       | PDFKit + QRCode                                              |
| Email     | Nodemailer (SMTP)                                            |
| Payments  | Stripe (invoice payments + subscription billing)            |
| AI        | Rule-based parser (default) + optional OpenAI                |

## 📁 Structure

```
.
├── server/   # Express + Prisma API
│   ├── prisma/schema.prisma   # data model
│   ├── prisma/seed.ts         # demo data
│   └── src/                   # routes, services (ai, pdf, invoice), middleware
└── client/   # React 19 + Vite SPA
    └── src/
        ├── pages/             # landing, auth, app (dashboard, invoices, ...)
        ├── components/        # UI kit
        └── lib/               # api client, auth, theme, types
```

## 🚀 Getting started

### 1. Start PostgreSQL

```bash
docker compose up -d          # starts Postgres on localhost:5432
```

(Or use any local Postgres and update `DATABASE_URL`.)

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
npm run dev                   # http://localhost:5173 (proxies /api to :4000)
```

### Demo login

After seeding: **`demo@invoiceflow.ai`** / **`password123`**

## 🔧 Configuration

All backend config is via `server/.env` (see `.env.example`). Everything optional
except `DATABASE_URL` and `JWT_SECRET`:

- **Email** — set `SMTP_*` to actually deliver emails; otherwise messages are logged
  to the console (dev-friendly).
- **Stripe** — set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
  to enable online invoice payments and the 99 DKK/month subscription. Without them
  a demo "simulate payment" flow is used.
- **Google login** — set `GOOGLE_CLIENT_ID`.
- **AI** — set `OPENAI_API_KEY` to layer an LLM on top of the built-in parser. Not
  required; the app is fully functional without it.

## 🧪 Scripts

Backend (`server/`): `dev`, `build`, `start`, `typecheck`, `prisma:migrate`,
`prisma:deploy`, `db:seed`.
Frontend (`client/`): `dev`, `build`, `preview`, `typecheck`.

## 📌 Notes

Deployment is intentionally not configured yet.
