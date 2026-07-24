import { useEffect, useState } from "react";
import { Building2, Palette, CreditCard, FileText, Sparkles, Save, BadgeCheck } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { LanguageToggle } from "../../components/LanguageToggle";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n, useT } from "../../lib/i18n";
import { LOCALES } from "../../lib/translations";
import type { Company } from "../../lib/types";

type Tab = "company" | "branding" | "payment" | "defaults" | "templates" | "billing";

export default function SettingsPage() {
  const toast = useToast();
  const { refresh } = useAuth();
  const t = useT();
  const { locale } = useI18n();
  const [tab, setTab] = useState<Tab>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [billing, setBilling] = useState<{ status: string; active: boolean; billingEnabled: boolean; trialEndsAt?: string | null } | null>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "company", label: t("settings.tabCompany"), icon: <Building2 className="h-4 w-4" /> },
    { id: "branding", label: t("settings.tabBranding"), icon: <Palette className="h-4 w-4" /> },
    { id: "payment", label: t("settings.tabPayment"), icon: <CreditCard className="h-4 w-4" /> },
    { id: "defaults", label: t("settings.tabDefaults"), icon: <Sparkles className="h-4 w-4" /> },
    { id: "templates", label: t("settings.tabTemplates"), icon: <FileText className="h-4 w-4" /> },
    { id: "billing", label: t("settings.tabBilling"), icon: <BadgeCheck className="h-4 w-4" /> },
  ];

  useEffect(() => {
    api.get<{ company: Company }>("/company").then((r) => setCompany(r.company)).catch(() => {});
    api.get<any>("/billing/status").then(setBilling).catch(() => {});
  }, []);

  const update = (patch: Partial<Company>) => setCompany((c) => (c ? { ...c, ...patch } : c));

  const save = async () => {
    if (!company) return;
    setSaving(true);
    try {
      await api.put("/company", company);
      toast(t("settings.saved"), "success");
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("settings.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const startCheckout = async () => {
    try {
      const res = await api.post<{ url: string }>("/billing/checkout");
      window.location.href = res.url;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("settings.billingNotConfigured"), "error");
    }
  };

  if (!company) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-brand-600" /></div>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        action={tab !== "billing" ? <button className="btn-primary" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? t("common.saving") : t("settings.saveChanges")}</button> : undefined}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                tab === item.id ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          <div className="card p-6">
            {tab === "company" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("settings.companyName")}><input className="input" value={company.name} onChange={(e) => update({ name: e.target.value })} /></Field>
                <Field label={t("settings.vatNumber")}><input className="input" value={company.vatNumber ?? ""} onChange={(e) => update({ vatNumber: e.target.value })} /></Field>
                <Field label={t("auth.email")}><input className="input" value={company.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></Field>
                <Field label={t("settings.phone")}><input className="input" value={company.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></Field>
                <Field label={t("settings.address")} full><input className="input" value={company.address ?? ""} onChange={(e) => update({ address: e.target.value })} /></Field>
                <Field label={t("settings.zip")}><input className="input" value={company.zip ?? ""} onChange={(e) => update({ zip: e.target.value })} /></Field>
                <Field label={t("settings.city")}><input className="input" value={company.city ?? ""} onChange={(e) => update({ city: e.target.value })} /></Field>
                <Field label={t("settings.country")}><input className="input" value={company.country} onChange={(e) => update({ country: e.target.value })} /></Field>
              </div>
            )}

            {tab === "branding" && (
              <div className="space-y-5">
                <Field label={t("settings.logoUrl")}><input className="input" placeholder="https://…" value={company.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("settings.brandColor")}>
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-14 rounded-lg border border-ink-200 dark:border-ink-700" value={company.brandColor} onChange={(e) => update({ brandColor: e.target.value })} />
                      <input className="input" value={company.brandColor} onChange={(e) => update({ brandColor: e.target.value })} />
                    </div>
                  </Field>
                  <Field label={t("settings.accentColor")}>
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-14 rounded-lg border border-ink-200 dark:border-ink-700" value={company.accentColor} onChange={(e) => update({ accentColor: e.target.value })} />
                      <input className="input" value={company.accentColor} onChange={(e) => update({ accentColor: e.target.value })} />
                    </div>
                  </Field>
                </div>
                <Field label={t("settings.signature")}><textarea className="input min-h-[80px]" value={company.signature ?? ""} onChange={(e) => update({ signature: e.target.value })} /></Field>
              </div>
            )}

            {tab === "payment" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("settings.bankName")}><input className="input" value={company.bankName ?? ""} onChange={(e) => update({ bankName: e.target.value })} /></Field>
                <Field label={t("settings.accountNumber")}><input className="input" value={company.bankAccount ?? ""} onChange={(e) => update({ bankAccount: e.target.value })} /></Field>
                <Field label={t("settings.iban")}><input className="input" value={company.bankIban ?? ""} onChange={(e) => update({ bankIban: e.target.value })} /></Field>
                <Field label={t("settings.swift")}><input className="input" value={company.bankSwift ?? ""} onChange={(e) => update({ bankSwift: e.target.value })} /></Field>
                <Field label={t("settings.paymentInstructions")} full><textarea className="input min-h-[80px]" value={company.paymentInstructions ?? ""} onChange={(e) => update({ paymentInstructions: e.target.value })} /></Field>
              </div>
            )}

            {tab === "defaults" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("settings.uiLanguage")}><LanguageToggle /></Field>
                <Field label={t("settings.invoiceLanguage")}>
                  <select className="input" value={company.locale ?? "da"} onChange={(e) => update({ locale: e.target.value })}>
                    {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </Field>
                <Field label={t("settings.defaultVat")}><input type="number" className="input" value={company.defaultVatRate} onChange={(e) => update({ defaultVatRate: Number(e.target.value) })} /></Field>
                <Field label={t("settings.defaultTerms")}><input type="number" className="input" value={company.defaultPaymentTermsDays} onChange={(e) => update({ defaultPaymentTermsDays: Number(e.target.value) })} /></Field>
                <Field label={t("settings.defaultCurrency")}>
                  <select className="input" value={company.defaultCurrency} onChange={(e) => update({ defaultCurrency: e.target.value })}>
                    {["DKK", "EUR", "USD", "GBP", "SEK", "NOK"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={t("settings.invoicePrefix")}><input className="input" value={company.invoicePrefix} onChange={(e) => update({ invoicePrefix: e.target.value })} /></Field>
                <Field label={t("settings.defaultNotes")} full><textarea className="input min-h-[80px]" value={company.invoiceNotes ?? ""} onChange={(e) => update({ invoiceNotes: e.target.value })} /></Field>
              </div>
            )}

            {tab === "templates" && (
              <div className="space-y-5">
                <p className="text-sm text-ink-500 dark:text-ink-400">{t("settings.templateHint")}</p>
                <Field label={t("settings.emailSubject")}><input className="input" value={company.emailSubjectTemplate ?? ""} onChange={(e) => update({ emailSubjectTemplate: e.target.value })} placeholder={t("settings.emailSubjectPlaceholder")} /></Field>
                <Field label={t("settings.emailBody")}><textarea className="input min-h-[160px] font-mono text-xs" value={company.emailBodyTemplate ?? ""} onChange={(e) => update({ emailBodyTemplate: e.target.value })} placeholder={t("settings.emailBodyPlaceholder")} /></Field>
              </div>
            )}

            {tab === "billing" && billing && (
              <div className="space-y-5">
                <div className="rounded-xl border border-brand-200/80 bg-brand-50/50 p-6 dark:border-brand-500/20 dark:bg-brand-500/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{t("landing.proName")}</p>
                      <p className="mt-1 text-3xl font-extrabold text-ink-900 dark:text-white">99 <span className="text-base font-medium text-ink-500">{t("landing.perMonth")}</span></p>
                    </div>
                    <span className={`badge ${billing.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700"}`}>
                      {billing.status}
                    </span>
                  </div>
                  {billing.trialEndsAt && billing.status === "trialing" && (
                    <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">{t("settings.trialEnds", { date: new Date(billing.trialEndsAt).toLocaleDateString(locale === "da" ? "da-DK" : "en-GB") })}</p>
                  )}
                  <button className="btn-primary mt-5" onClick={startCheckout}>
                    <CreditCard className="h-4 w-4" /> {billing.status === "active" ? t("settings.manageSub") : t("settings.subscribe")}
                  </button>
                  {!billing.billingEnabled && <p className="mt-3 text-xs text-ink-400">{t("settings.stripeHint")}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
