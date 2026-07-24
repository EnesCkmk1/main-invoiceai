import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Palette,
  FilePenLine,
  ArrowRight,
  ArrowLeft,
  Check,
  LogOut,
  Wand2,
  LayoutDashboard,
  Mail,
  Hash,
  MapPin,
  Globe,
  ImageIcon,
  Coins,
  Percent,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../../components/Logo";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggleIcon } from "../../components/LanguageToggle";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useT } from "../../lib/i18n";
import type { Company } from "../../lib/types";

const COUNTRIES = [
  { value: "Denmark", key: "denmark" },
  { value: "Sweden", key: "sweden" },
  { value: "Norway", key: "norway" },
  { value: "Germany", key: "germany" },
  { value: "United Kingdom", key: "uk" },
  { value: "United States", key: "us" },
  { value: "Other", key: "other" },
] as const;
const CURRENCIES = ["DKK", "EUR", "USD", "GBP", "SEK", "NOK"];

const STEP_ICONS = [Building2, Palette, FilePenLine] as const;

export default function OnboardingPage() {
  const t = useT();
  const { user, company, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [form, setForm] = useState<Partial<Company>>({});

  const steps = [
    { id: 1, title: t("onboarding.step1Title"), blurb: t("onboarding.step1Blurb"), icon: STEP_ICONS[0] },
    { id: 2, title: t("onboarding.step2Title"), blurb: t("onboarding.step2Blurb"), icon: STEP_ICONS[1] },
    { id: 3, title: t("onboarding.step3Title"), blurb: t("onboarding.step3Blurb"), icon: STEP_ICONS[2] },
  ];

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name.endsWith("'s Company") ? "" : company.name,
        email: company.email ?? user?.email ?? "",
        vatNumber: company.vatNumber ?? "",
        address: company.address ?? "",
        country: company.country ?? "Denmark",
        logoUrl: company.logoUrl ?? "",
        brandColor: company.brandColor ?? "#0d9488",
        defaultCurrency: company.defaultCurrency ?? "DKK",
        defaultVatRate: company.defaultVatRate ?? 25,
        defaultPaymentTermsDays: company.defaultPaymentTermsDays ?? 14,
      });
    }
  }, [company, user?.email]);

  const update = (patch: Partial<Company>) => setForm((f) => ({ ...f, ...patch }));

  const saveStep = async (patch: Partial<Company>) => {
    setSaving(true);
    try {
      await api.put("/company", patch);
      await refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("onboarding.saveFailed"), "error");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const finish = async (destination: "dashboard" | "invoice") => {
    setSaving(true);
    try {
      await api.put("/company", { onboardingCompleted: true });
      await refresh();
      if (destination === "invoice" && aiPrompt.trim()) {
        navigate(`/app/invoices/new?ai=${encodeURIComponent(aiPrompt.trim())}`);
      } else {
        navigate("/app");
      }
    } catch {
      toast(t("onboarding.completeFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 1) {
      if (!form.name?.trim()) {
        toast(t("onboarding.nameRequired"), "error");
        return;
      }
      try {
        await saveStep({
          name: form.name.trim(),
          email: form.email?.trim() || null,
          vatNumber: form.vatNumber?.trim() || null,
          address: form.address?.trim() || null,
          country: form.country ?? "Denmark",
        });
        setStep(2);
      } catch {
        /* toast shown */
      }
      return;
    }
    if (step === 2) {
      try {
        await saveStep({
          logoUrl: form.logoUrl?.trim() || null,
          brandColor: form.brandColor ?? "#0d9488",
          defaultCurrency: form.defaultCurrency ?? "DKK",
          defaultVatRate: form.defaultVatRate ?? 25,
          defaultPaymentTermsDays: form.defaultPaymentTermsDays ?? 14,
        });
        setStep(3);
      } catch {
        /* toast shown */
      }
    }
  };

  const current = steps[step - 1];
  const StepIcon = current.icon;

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Left panel — solid ink, no gradient */}
      <aside className="relative hidden w-[400px] shrink-0 border-r border-ink-800 bg-ink-950 lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col px-8 py-8">
          <Logo light />
          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">{t("onboarding.setup")}</p>
            <h1 className="mt-3 text-2xl font-bold leading-snug text-white">{t("onboarding.welcome")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">{t("onboarding.intro")}</p>
          </div>
          <ol className="mt-10 space-y-2">
            {steps.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              const Icon = s.icon;
              return (
                <li
                  key={s.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-3 transition ${
                    active ? "bg-white/8 ring-1 ring-white/10" : done ? "opacity-80" : "opacity-40"
                  }`}
                >
                  <span
                    className={`icon-box mt-0.5 h-8 w-8 rounded-md ${
                      done
                        ? "bg-brand-600 text-white dark:bg-brand-600"
                        : active
                          ? "bg-white/10 text-white"
                          : "bg-white/5 text-ink-500"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" strokeWidth={2} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{s.blurb}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="border-t border-ink-800 px-8 py-5">
          <p className="text-xs text-ink-500">InvoiceFlow AI · 99 kr./md.</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-ink-200 px-5 dark:border-ink-800">
          <div className="lg:hidden">
            <Logo />
          </div>
          <p className="hidden text-sm text-ink-500 lg:block dark:text-ink-400">
            {t("onboarding.stepOf", { step: String(step), total: String(steps.length) })}
          </p>
          <div className="flex items-center gap-1">
            <LanguageToggleIcon />
            <ThemeToggle />
            <button onClick={logout} className="btn-ghost min-h-10 text-ink-500 hover:text-rose-600">
              <LogOut className="h-4 w-4" strokeWidth={2} /> {t("onboarding.logOut")}
            </button>
          </div>
        </header>

        {/* Mobile progress */}
        <div className="border-b border-ink-200 px-5 py-3 lg:hidden dark:border-ink-800">
          <div className="mb-2 flex justify-between text-xs font-medium text-ink-500">
            <span>{current.title}</span>
            <span>{step}/{steps.length}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${(step / steps.length) * 100}%` }} />
          </div>
        </div>

        <main className="flex flex-1 items-start justify-center px-5 py-8 sm:items-center sm:py-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="mb-6 flex items-center gap-3">
              <span className="icon-box-accent h-11 w-11">
                <StepIcon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-ink-900 dark:text-white">{current.title}</h2>
                <p className="text-sm text-ink-500 dark:text-ink-400">{current.blurb}</p>
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {step === 1 && (
                    <div className="space-y-4">
                      <IconField label={t("onboarding.companyName")} icon={Building2} required>
                        <input className="input" value={form.name ?? ""} onChange={(e) => update({ name: e.target.value })} placeholder={t("onboarding.namePlaceholder")} autoFocus />
                      </IconField>
                      <IconField label={t("onboarding.companyEmail")} icon={Mail}>
                        <input className="input" type="email" value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} placeholder={t("onboarding.emailPlaceholder")} />
                      </IconField>
                      <IconField label={t("onboarding.vat")} icon={Hash}>
                        <input className="input" value={form.vatNumber ?? ""} onChange={(e) => update({ vatNumber: e.target.value })} placeholder={t("onboarding.vatPlaceholder")} />
                      </IconField>
                      <IconField label={t("onboarding.address")} icon={MapPin}>
                        <input className="input" value={form.address ?? ""} onChange={(e) => update({ address: e.target.value })} placeholder={t("onboarding.addressPlaceholder")} />
                      </IconField>
                      <IconField label={t("onboarding.country")} icon={Globe}>
                        <select className="input" value={form.country ?? "Denmark"} onChange={(e) => update({ country: e.target.value })}>
                          {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {t(`onboarding.countries.${c.key}`)}
                            </option>
                          ))}
                        </select>
                      </IconField>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <IconField label={t("onboarding.logoUrl")} icon={ImageIcon}>
                        <input className="input" value={form.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value })} placeholder={t("onboarding.logoPlaceholder")} />
                      </IconField>
                      {form.logoUrl && (
                        <div className="flex items-center gap-3 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
                          <img src={form.logoUrl} alt="" className="h-9 max-w-[100px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <span className="text-xs text-ink-400">{t("onboarding.logoPreview")}</span>
                        </div>
                      )}
                      <IconField label={t("onboarding.brandColor")} icon={Palette}>
                        <div className="flex items-center gap-2">
                          <input type="color" className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200 dark:border-ink-700" value={form.brandColor ?? "#0d9488"} onChange={(e) => update({ brandColor: e.target.value })} />
                          <input className="input font-mono text-xs" value={form.brandColor ?? "#0d9488"} onChange={(e) => update({ brandColor: e.target.value })} />
                        </div>
                      </IconField>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <IconField label={t("onboarding.defaultCurrency")} icon={Coins}>
                          <select className="input" value={form.defaultCurrency ?? "DKK"} onChange={(e) => update({ defaultCurrency: e.target.value })}>
                            {CURRENCIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </IconField>
                        <IconField label={t("onboarding.defaultVat")} icon={Percent}>
                          <input type="number" className="input" value={form.defaultVatRate ?? 25} onChange={(e) => update({ defaultVatRate: Number(e.target.value) })} />
                        </IconField>
                      </div>
                      <IconField label={t("onboarding.paymentTerms")} icon={CalendarDays}>
                        <input type="number" className="input" value={form.defaultPaymentTermsDays ?? 14} onChange={(e) => update({ defaultPaymentTermsDays: Number(e.target.value) })} />
                      </IconField>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-brand-200/80 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
                        <div className="mb-2 flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-brand-600" strokeWidth={2} />
                          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{t("onboarding.createWithAi")}</h3>
                        </div>
                        <p className="mb-3 text-sm text-ink-600 dark:text-ink-300">{t("onboarding.aiDesc")}</p>
                        <textarea
                          className="input min-h-[96px] resize-none"
                          placeholder={t("onboarding.aiPlaceholder")}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <button className="btn-primary w-full py-2.5" onClick={() => finish("invoice")} disabled={saving || !aiPrompt.trim()}>
                        {saving ? <Spinner className="h-4 w-4" /> : <Wand2 className="h-4 w-4" strokeWidth={2} />} {t("onboarding.createFirst")}
                      </button>
                      <button className="btn-secondary w-full" onClick={() => finish("dashboard")} disabled={saving}>
                        <LayoutDashboard className="h-4 w-4" strokeWidth={2} /> {t("onboarding.skipDashboard")}
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {step < 3 && (
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink-100 pt-5 dark:border-ink-800">
                  <button className="btn-ghost min-h-10" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || saving}>
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} /> {t("onboarding.back")}
                  </button>
                  <button className="btn-primary min-h-10 min-w-[120px]" onClick={next} disabled={saving}>
                    {saving ? <Spinner className="h-4 w-4" /> : <>{t("onboarding.continue")} <ArrowRight className="h-4 w-4" strokeWidth={2} /></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function IconField({
  label,
  icon: Icon,
  children,
  required,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-ink-400" strokeWidth={2} />
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
