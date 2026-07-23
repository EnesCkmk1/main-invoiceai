import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  FileText,
  Send,
  CreditCard,
  BarChart3,
  Bell,
  ShieldCheck,
  ChevronDown,
  Play,
  Star,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { formatMoney } from "../lib/format";

const features = [
  { icon: Sparkles, title: "AI invoice creation", desc: "Type one sentence, get a complete invoice. AI extracts customer, line items, VAT and due date." },
  { icon: FileText, title: "Beautiful PDFs", desc: "Branded, print-perfect invoices with your logo, colors, QR payment code and bank details." },
  { icon: Send, title: "Send & track", desc: "Email invoices in one click. See when they're opened, downloaded and paid." },
  { icon: CreditCard, title: "Get paid online", desc: "Card, Apple Pay, Google Pay and bank transfer. Your customer pays in seconds." },
  { icon: Bell, title: "Automatic reminders", desc: "Gentle nudges go out on time so you never chase a late payment again." },
  { icon: BarChart3, title: "Clear analytics", desc: "Revenue, payment speed, best customers and overdue invoices at a glance." },
];

const testimonials = [
  { name: "Anders H.", role: "Freelance developer", quote: "I send invoices from my phone between meetings. What used to take 15 minutes now takes 20 seconds.", rating: 5 },
  { name: "Mette S.", role: "Design agency owner", quote: "It looks like Stripe and Notion had a baby. My clients actually compliment my invoices now.", rating: 5 },
  { name: "Jonas K.", role: "Electrician", quote: "Not a clunky accounting program. Just invoicing that works. Exactly what I needed.", rating: 5 },
];

const faqs = [
  { q: "Is this an accounting program?", a: "No — and that's the point. InvoiceFlow is only for creating, sending and following up on invoices. No bookkeeping, no VAT filing, no bank reconciliation. Simpler to use, simpler to love." },
  { q: "Do I have to use the AI?", a: "Never. AI is an assistant, not a requirement. Everything works with the classic builder. AI just makes it dramatically faster when you want it." },
  { q: "How much does it cost?", a: "99 DKK per month, flat. No per-invoice fees, no surprises. Start with a 14-day free trial, no card required." },
  { q: "Can my customers pay online?", a: "Yes. Every invoice includes a secure payment link and QR code supporting card, Apple Pay, Google Pay and bank transfer." },
  { q: "Does it support VAT and multiple currencies?", a: "Absolutely. Set default VAT, apply discounts, use multiple currencies, and create credit notes and recurring invoices." },
];

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <a href="#features" className="hover:text-slate-900 dark:hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white">Pricing</a>
          <a href="#testimonials" className="hover:text-slate-900 dark:hover:text-white">Reviews</a>
          <a href="#faq" className="hover:text-slate-900 dark:hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
          <Link to="/register" className="btn-primary">Start free trial</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-linear-to-b from-brand-50/60 to-transparent dark:from-brand-500/5" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
            <Sparkles className="h-4 w-4" /> Not an accounting program — just invoicing
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
            Create invoices in
            <span className="relative whitespace-nowrap">
              <span className="bg-linear-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent"> 30 seconds.</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            The fastest way to send a professional invoice. Write one sentence, let AI do the rest,
            and get paid. Built for freelancers, consultants, tradespeople and small businesses.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#demo" className="btn-secondary px-6 py-3 text-base">
              <Play className="h-4 w-4" /> Watch demo
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            14-day free trial · No credit card · 99 DKK/month after
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          id="demo"
          className="mx-auto mt-16 max-w-3xl"
        >
          <AiDemo />
        </motion.div>
      </div>
    </section>
  );
}

function AiDemo() {
  const [step, setStep] = useState(0);
  const prompt = "Invoice Anders Hansen for 12 hours of web development at 750 DKK/hour with 25% VAT and 14-day payment terms.";
  return (
    <div className="card overflow-hidden p-1.5 shadow-2xl shadow-brand-600/10">
      <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-950">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-2">InvoiceFlow AI — New Invoice</span>
        </div>
        <div className="rounded-xl border border-brand-200 bg-white p-4 dark:border-brand-500/20 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <p className="text-sm text-slate-700 dark:text-slate-200">{prompt}</p>
          </div>
        </div>
        <button
          onClick={() => setStep((s) => (s + 1) % 2)}
          className="btn-primary mt-3 w-full"
        >
          <Zap className="h-4 w-4" /> {step === 0 ? "Generate invoice" : "Regenerate"}
        </button>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-medium">Anders Hansen</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Web development · 12 hrs × 750</span><span className="font-medium">{formatMoney(9000)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">VAT (25%)</span><span className="font-medium">{formatMoney(2250)}</span></div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold dark:border-slate-800"><span>Total</span><span className="text-brand-600 dark:text-brand-400">{formatMoney(11250)}</span></div>
          <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Ready to send · due in 14 days</div>
        </motion.div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Everything you need to get paid
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Nothing you don't. No bookkeeping bloat — just fast, beautiful invoicing.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="card p-6 transition hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const perks = [
    "Unlimited invoices & customers",
    "AI invoice creation",
    "Branded PDF with QR payment",
    "Online payments (card, Apple/Google Pay)",
    "Automatic reminders",
    "Email open & payment tracking",
    "Recurring invoices & credit notes",
    "Analytics dashboard",
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          One simple price
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Everything included. No per-invoice fees. Cancel anytime.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-md">
        <div className="card relative overflow-hidden p-8 shadow-xl">
          <div className="absolute right-6 top-6 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            Most popular
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">InvoiceFlow Pro</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-slate-900 dark:text-white">99</span>
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">DKK/month</span>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">14-day free trial · no card required</p>
          <Link to="/register" className="btn-primary mt-6 w-full py-3 text-base">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4" /> Secure payments powered by Stripe
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="bg-slate-100/60 py-20 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Loved by people who'd rather be working
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="mb-3 flex gap-0.5 text-amber-400">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-200">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-brand-500 to-sky-500 text-xs font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Frequently asked questions
        </h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium text-slate-900 dark:text-white">{f.q}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 to-sky-600 px-8 py-16 text-center shadow-2xl">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Send your first invoice today</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-50">
            Join thousands who spend less time on paperwork and more time getting paid.
          </p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 py-10 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} InvoiceFlow AI · Not an accounting program — just invoicing.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
