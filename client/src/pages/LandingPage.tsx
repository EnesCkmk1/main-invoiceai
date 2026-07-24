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
import { LanguageToggleIcon } from "../components/LanguageToggle";
import { formatMoney } from "../lib/format";
import { useT, useTL } from "../lib/i18n";

function Nav() {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/60 bg-white/70 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-600 md:flex dark:text-ink-300">
          <a href="#features" className="hover:text-ink-900 dark:hover:text-white">{t("nav.features")}</a>
          <a href="#pricing" className="hover:text-ink-900 dark:hover:text-white">{t("nav.pricing")}</a>
          <a href="#testimonials" className="hover:text-ink-900 dark:hover:text-white">{t("nav.reviews")}</a>
          <a href="#faq" className="hover:text-ink-900 dark:hover:text-white">{t("nav.faq")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggleIcon />
          <ThemeToggle />
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">{t("nav.login")}</Link>
          <Link to="/register" className="btn-primary">{t("nav.startTrial")}</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const t = useT();
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-linear-to-b from-ink-100/80 to-transparent dark:from-ink-900/50" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm font-medium text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300">
            <Sparkles className="h-4 w-4 text-brand-600" strokeWidth={2} /> {t("landing.badge")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink-900 sm:text-6xl dark:text-white">
            {t("landing.heroTitle")}
            <span className="relative whitespace-nowrap">
              <span className="text-brand-600 dark:text-brand-400">{t("landing.heroHighlight")}</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600 dark:text-ink-300">{t("landing.heroSubtitle")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              {t("nav.startTrial")} <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#demo" className="btn-secondary px-6 py-3 text-base">
              <Play className="h-4 w-4" /> {t("landing.watchDemo")}
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">{t("landing.trialNote")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <AiDemo />
        </motion.div>
      </div>
    </section>
  );
}

function AiDemo() {
  const t = useT();
  const [step, setStep] = useState(0);
  return (
    <div className="card overflow-hidden p-1 shadow-lg shadow-ink-900/5">
      <div className="rounded-xl bg-ink-50 p-5 dark:bg-ink-950">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-ink-400">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-2">{t("landing.demoTitle")}</span>
        </div>
        <div className="rounded-xl border border-brand-200 bg-white p-4 dark:border-brand-500/20 dark:bg-ink-900">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" strokeWidth={2} />
            <p className="text-sm text-ink-700 dark:text-ink-200">{t("landing.demoPrompt")}</p>
          </div>
        </div>
        <button onClick={() => setStep((s) => (s + 1) % 2)} className="btn-primary mt-3 w-full">
          <Zap className="h-4 w-4" /> {step === 0 ? t("landing.generate") : t("landing.regenerate")}
        </button>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2 rounded-xl border border-ink-200 bg-white p-4 text-left text-sm dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex justify-between"><span className="text-ink-500">{t("landing.customer")}</span><span className="font-medium">Anders Hansen</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Web development · 12 hrs × 750</span><span className="font-medium">{formatMoney(9000)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">{t("landing.vat25")}</span><span className="font-medium">{formatMoney(2250)}</span></div>
          <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold dark:border-ink-800"><span>{t("landing.total")}</span><span className="text-brand-600 dark:text-brand-400">{formatMoney(11250)}</span></div>
          <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> {t("landing.readyToSend")}</div>
        </motion.div>
      </div>
    </div>
  );
}

function VideoDemo() {
  const t = useT();
  const tl = useTL();
  const bullets = tl("landing.demoBullets");
  return (
    <section id="demo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl dark:text-white">{t("landing.videoTitle")}</h2>
        <p className="mt-4 text-lg text-ink-600 dark:text-ink-300">{t("landing.videoSubtitle")}</p>
      </div>
      <div className="mx-auto mt-10 max-w-4xl">
        <div className="card overflow-hidden p-1 shadow-lg shadow-ink-900/5">
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-950">
            <div className="mb-3 flex items-center gap-2 px-2 text-xs font-medium text-ink-400">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2">{t("landing.demoWindow")}</span>
            </div>
            <video
              controls
              playsInline
              preload="metadata"
              poster="/demo-poster.jpg"
              className="w-full rounded-lg"
              aria-label={t("landing.videoLabel")}
            >
              <source src="/demo.mp4" type="video/mp4" />
              {t("landing.videoUnsupported")}
            </video>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500 dark:text-ink-400">
          {bullets.map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" strokeWidth={2} /> {b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const t = useT();
  const features = [
    { icon: Sparkles, title: t("landing.featureAiTitle"), desc: t("landing.featureAiDesc") },
    { icon: FileText, title: t("landing.featurePdfTitle"), desc: t("landing.featurePdfDesc") },
    { icon: Send, title: t("landing.featureSendTitle"), desc: t("landing.featureSendDesc") },
    { icon: CreditCard, title: t("landing.featurePayTitle"), desc: t("landing.featurePayDesc") },
    { icon: Bell, title: t("landing.featureRemindTitle"), desc: t("landing.featureRemindDesc") },
    { icon: BarChart3, title: t("landing.featureAnalyticsTitle"), desc: t("landing.featureAnalyticsDesc") },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl dark:text-white">{t("landing.featuresTitle")}</h2>
        <p className="mt-4 text-lg text-ink-600 dark:text-ink-300">{t("landing.featuresSubtitle")}</p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="card p-6 transition hover:shadow-md"
          >
            <div className="icon-box-accent mb-4 h-11 w-11 rounded-xl">
              <f.icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const t = useT();
  const tl = useTL();
  const perks = tl("landing.perks");
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl dark:text-white">{t("landing.pricingTitle")}</h2>
        <p className="mt-4 text-lg text-ink-600 dark:text-ink-300">{t("landing.pricingSubtitle")}</p>
      </div>
      <div className="mx-auto mt-12 max-w-md">
        <div className="card relative overflow-hidden p-8 shadow-xl">
          <div className="absolute right-6 top-6 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {t("landing.mostPopular")}
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t("landing.proName")}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-ink-900 dark:text-white">99</span>
            <span className="text-lg font-medium text-ink-500 dark:text-ink-400">{t("landing.perMonth")}</span>
          </div>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("landing.trialCard")}</p>
          <Link to="/register" className="btn-primary mt-6 w-full py-3 text-base">
            {t("nav.startTrial")} <ArrowRight className="h-4 w-4" />
          </Link>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink-700 dark:text-ink-300">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2} /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <ShieldCheck className="h-4 w-4" strokeWidth={2} /> {t("landing.stripeNote")}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = useT();
  const testimonials = [
    { name: t("landing.testimonial1Name"), role: t("landing.testimonial1Role"), quote: t("landing.testimonial1Quote") },
    { name: t("landing.testimonial2Name"), role: t("landing.testimonial2Role"), quote: t("landing.testimonial2Quote") },
    { name: t("landing.testimonial3Name"), role: t("landing.testimonial3Role"), quote: t("landing.testimonial3Quote") },
  ];
  return (
    <section id="testimonials" className="scroll-mt-20 bg-ink-100/60 py-20 dark:bg-ink-900/40">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl dark:text-white">{t("landing.testimonialsTitle")}</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="card p-6">
              <div className="mb-3 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" strokeWidth={2} />
                ))}
              </div>
              <p className="text-ink-700 dark:text-ink-200">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-xs font-bold text-white dark:bg-ink-700">
                  {item.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{item.role}</p>
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
  const t = useT();
  const faqs = [
    { q: t("landing.faq1q"), a: t("landing.faq1a") },
    { q: t("landing.faq2q"), a: t("landing.faq2a") },
    { q: t("landing.faq3q"), a: t("landing.faq3a") },
    { q: t("landing.faq4q"), a: t("landing.faq4a") },
    { q: t("landing.faq5q"), a: t("landing.faq5a") },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl dark:text-white">{t("landing.faqTitle")}</h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium text-ink-900 dark:text-white">{f.q}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-ink-400 transition ${open === i ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-ink-600 dark:text-ink-300">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  const t = useT();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 px-8 py-16 text-center dark:bg-ink-950">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("landing.ctaTitle")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-50">{t("landing.ctaSubtitle")}</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50">
            {t("nav.startTrial")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-ink-200 py-10 dark:border-ink-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {t("landing.footer", { year: new Date().getFullYear() })}
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
      <VideoDemo />
      <Features />
      <Pricing />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
