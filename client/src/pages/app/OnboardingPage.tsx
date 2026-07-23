import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Palette,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  LogOut,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../../components/Logo";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Company } from "../../lib/types";

const STEPS = [
  { id: 1, title: "Company basics", icon: Building2, blurb: "Tell us about your business so invoices look professional from day one." },
  { id: 2, title: "Branding", icon: Palette, blurb: "Set your look — logo, colors, and default invoice settings." },
  { id: 3, title: "First invoice", icon: Sparkles, blurb: "Jump straight into AI invoice creation, or explore the dashboard first." },
] as const;

const COUNTRIES = ["Denmark", "Sweden", "Norway", "Germany", "United Kingdom", "United States", "Other"];
const CURRENCIES = ["DKK", "EUR", "USD", "GBP", "SEK", "NOK"];

export default function OnboardingPage() {
  const { user, company, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [form, setForm] = useState<Partial<Company>>({});

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name.endsWith("'s Company") ? "" : company.name,
        email: company.email ?? user?.email ?? "",
        vatNumber: company.vatNumber ?? "",
        address: company.address ?? "",
        country: company.country ?? "Denmark",
        logoUrl: company.logoUrl ?? "",
        brandColor: company.brandColor ?? "#4f46e5",
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
      toast(err instanceof ApiError ? err.message : "Failed to save", "error");
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
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to complete setup", "error");
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 1) {
      if (!form.name?.trim()) {
        toast("Company name is required", "error");
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
          brandColor: form.brandColor ?? "#4f46e5",
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

  const current = STEPS[step - 1];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Left brand panel */}
      <div className="relative hidden w-[420px] shrink-0 overflow-hidden bg-linear-to-br from-brand-600 to-sky-600 lg:block">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative flex h-full flex-col px-10 py-10 text-white">
          <Logo light />
          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">Setup</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight">Welcome to InvoiceFlow</h1>
            <p className="mt-3 text-brand-50">Three quick steps and you&apos;re ready to send your first invoice.</p>
          </div>
          <ol className="mt-10 space-y-4">
            {STEPS.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li
                  key={s.id}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    active ? "border-white/30 bg-white/15" : done ? "border-white/10 bg-white/5" : "border-transparent opacity-60"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-white text-brand-600" : active ? "bg-white/25 text-white" : "bg-white/10 text-white/70"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : s.id}
                  </span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-sm text-brand-100">{s.blurb}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Main wizard */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex dark:text-slate-400">
            Step {step} of {STEPS.length}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={logout} className="btn-ghost text-slate-500 hover:text-rose-500">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </header>

        {/* Mobile progress */}
        <div className="border-b border-slate-200 px-6 py-4 lg:hidden dark:border-slate-800">
          <div className="mb-2 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{current.title}</span>
            <span>{step}/{STEPS.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg animate-fade-in">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <current.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{current.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{current.blurb}</p>
              </div>
            </div>

            <div className="card p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && (
                    <div className="space-y-4">
                      <Field label="Company name" required>
                        <input className="input" value={form.name ?? ""} onChange={(e) => update({ name: e.target.value })} placeholder="Nordic Studio ApS" autoFocus />
                      </Field>
                      <Field label="Company email">
                        <input className="input" type="email" value={form.email ?? ""} onChange={(e) => update({ email: e.target.value })} placeholder="hello@company.dk" />
                      </Field>
                      <Field label="VAT / CVR number">
                        <input className="input" value={form.vatNumber ?? ""} onChange={(e) => update({ vatNumber: e.target.value })} placeholder="DK12345678" />
                      </Field>
                      <Field label="Address">
                        <input className="input" value={form.address ?? ""} onChange={(e) => update({ address: e.target.value })} placeholder="Vestergade 12, 1456 Copenhagen" />
                      </Field>
                      <Field label="Country">
                        <select className="input" value={form.country ?? "Denmark"} onChange={(e) => update({ country: e.target.value })}>
                          {COUNTRIES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <Field label="Logo URL">
                        <input className="input" value={form.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value })} placeholder="https://yoursite.com/logo.png" />
                      </Field>
                      {form.logoUrl && (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                          <img src={form.logoUrl} alt="Logo preview" className="h-10 max-w-[120px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <span className="text-xs text-slate-400">Logo preview</span>
                        </div>
                      )}
                      <Field label="Brand color">
                        <div className="flex items-center gap-2">
                          <input type="color" className="h-10 w-14 rounded-lg border border-slate-200 dark:border-slate-700" value={form.brandColor ?? "#4f46e5"} onChange={(e) => update({ brandColor: e.target.value })} />
                          <input className="input" value={form.brandColor ?? "#4f46e5"} onChange={(e) => update({ brandColor: e.target.value })} />
                        </div>
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Default currency">
                          <select className="input" value={form.defaultCurrency ?? "DKK"} onChange={(e) => update({ defaultCurrency: e.target.value })}>
                            {CURRENCIES.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Default VAT (%)">
                          <input type="number" className="input" value={form.defaultVatRate ?? 25} onChange={(e) => update({ defaultVatRate: Number(e.target.value) })} />
                        </Field>
                      </div>
                      <Field label="Payment terms (days)">
                        <input type="number" className="input" value={form.defaultPaymentTermsDays ?? 14} onChange={(e) => update({ defaultPaymentTermsDays: Number(e.target.value) })} />
                      </Field>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-brand-200 bg-linear-to-br from-brand-50 to-sky-50 p-4 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-sky-500/10">
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-brand-500" />
                          <h3 className="font-semibold text-slate-900 dark:text-white">Create with AI</h3>
                        </div>
                        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                          Describe your first invoice in plain language — we&apos;ll pre-fill the editor for you.
                        </p>
                        <textarea
                          className="input min-h-[100px]"
                          placeholder="e.g. Invoice Anders Hansen for 12 hours of web development at 750 DKK/hour with 25% VAT and 14-day payment terms."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <button className="btn-primary w-full py-3" onClick={() => finish("invoice")} disabled={saving || !aiPrompt.trim()}>
                        {saving ? <Spinner className="h-4 w-4" /> : <Zap className="h-4 w-4" />} Create first invoice with AI
                      </button>
                      <button className="btn-secondary w-full" onClick={() => finish("dashboard")} disabled={saving}>
                        <LayoutDashboard className="h-4 w-4" /> Skip — go to dashboard
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {step < 3 && (
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <button className="btn-ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || saving}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button className="btn-primary min-w-[120px]" onClick={next} disabled={saving}>
                    {saving ? <Spinner className="h-4 w-4" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
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

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
