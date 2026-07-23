import { useEffect, useState } from "react";
import { Building2, Palette, CreditCard, FileText, Sparkles, Save, BadgeCheck } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Company } from "../../lib/types";

type Tab = "company" | "branding" | "payment" | "defaults" | "templates" | "billing";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "company", label: "Company", icon: <Building2 className="h-4 w-4" /> },
  { id: "branding", label: "Branding", icon: <Palette className="h-4 w-4" /> },
  { id: "payment", label: "Payment", icon: <CreditCard className="h-4 w-4" /> },
  { id: "defaults", label: "Defaults", icon: <Sparkles className="h-4 w-4" /> },
  { id: "templates", label: "Templates", icon: <FileText className="h-4 w-4" /> },
  { id: "billing", label: "Subscription", icon: <BadgeCheck className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const toast = useToast();
  const { refresh } = useAuth();
  const [tab, setTab] = useState<Tab>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [billing, setBilling] = useState<{ status: string; active: boolean; billingEnabled: boolean; trialEndsAt?: string | null } | null>(null);

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
      toast("Settings saved", "success");
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const startCheckout = async () => {
    try {
      const res = await api.post<{ url: string }>("/billing/checkout");
      window.location.href = res.url;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Billing is not configured yet", "error");
    }
  };

  if (!company) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-brand-600" /></div>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Make every invoice look unmistakably yours."
        action={tab !== "billing" ? <button className="btn-primary" onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</button> : undefined}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                tab === t.id ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">
          <div className="card p-6">
            {tab === "company" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name"><input className="input" value={company.name} onChange={(e) => update({ name: e.target.value })} /></Field>
                <Field label="CVR / VAT number"><input className="input" value={company.vatNumber ?? ""} onChange={(e) => update({ vatNumber: e.target.value })} /></Field>
                <Field label="Email"><input className="input" value={company.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></Field>
                <Field label="Phone"><input className="input" value={company.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></Field>
                <Field label="Address" full><input className="input" value={company.address ?? ""} onChange={(e) => update({ address: e.target.value })} /></Field>
                <Field label="Zip"><input className="input" value={company.zip ?? ""} onChange={(e) => update({ zip: e.target.value })} /></Field>
                <Field label="City"><input className="input" value={company.city ?? ""} onChange={(e) => update({ city: e.target.value })} /></Field>
                <Field label="Country"><input className="input" value={company.country} onChange={(e) => update({ country: e.target.value })} /></Field>
              </div>
            )}

            {tab === "branding" && (
              <div className="space-y-5">
                <Field label="Logo URL"><input className="input" placeholder="https://…" value={company.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Brand color">
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-14 rounded-lg border border-slate-200 dark:border-slate-700" value={company.brandColor} onChange={(e) => update({ brandColor: e.target.value })} />
                      <input className="input" value={company.brandColor} onChange={(e) => update({ brandColor: e.target.value })} />
                    </div>
                  </Field>
                  <Field label="Accent color">
                    <div className="flex items-center gap-2">
                      <input type="color" className="h-10 w-14 rounded-lg border border-slate-200 dark:border-slate-700" value={company.accentColor} onChange={(e) => update({ accentColor: e.target.value })} />
                      <input className="input" value={company.accentColor} onChange={(e) => update({ accentColor: e.target.value })} />
                    </div>
                  </Field>
                </div>
                <Field label="Signature"><textarea className="input min-h-[80px]" value={company.signature ?? ""} onChange={(e) => update({ signature: e.target.value })} /></Field>
              </div>
            )}

            {tab === "payment" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bank name"><input className="input" value={company.bankName ?? ""} onChange={(e) => update({ bankName: e.target.value })} /></Field>
                <Field label="Account number"><input className="input" value={company.bankAccount ?? ""} onChange={(e) => update({ bankAccount: e.target.value })} /></Field>
                <Field label="IBAN"><input className="input" value={company.bankIban ?? ""} onChange={(e) => update({ bankIban: e.target.value })} /></Field>
                <Field label="SWIFT / BIC"><input className="input" value={company.bankSwift ?? ""} onChange={(e) => update({ bankSwift: e.target.value })} /></Field>
                <Field label="Payment instructions" full><textarea className="input min-h-[80px]" value={company.paymentInstructions ?? ""} onChange={(e) => update({ paymentInstructions: e.target.value })} /></Field>
              </div>
            )}

            {tab === "defaults" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Default VAT (%)"><input type="number" className="input" value={company.defaultVatRate} onChange={(e) => update({ defaultVatRate: Number(e.target.value) })} /></Field>
                <Field label="Default payment terms (days)"><input type="number" className="input" value={company.defaultPaymentTermsDays} onChange={(e) => update({ defaultPaymentTermsDays: Number(e.target.value) })} /></Field>
                <Field label="Default currency">
                  <select className="input" value={company.defaultCurrency} onChange={(e) => update({ defaultCurrency: e.target.value })}>
                    {["DKK", "EUR", "USD", "GBP", "SEK", "NOK"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Invoice prefix"><input className="input" value={company.invoicePrefix} onChange={(e) => update({ invoicePrefix: e.target.value })} /></Field>
                <Field label="Default invoice notes" full><textarea className="input min-h-[80px]" value={company.invoiceNotes ?? ""} onChange={(e) => update({ invoiceNotes: e.target.value })} /></Field>
              </div>
            )}

            {tab === "templates" && (
              <div className="space-y-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Use <code className="rounded-sm bg-slate-100 px-1 dark:bg-slate-800">{"{number}"}</code>, <code className="rounded-sm bg-slate-100 px-1 dark:bg-slate-800">{"{company}"}</code> and <code className="rounded-sm bg-slate-100 px-1 dark:bg-slate-800">{"{payUrl}"}</code> as placeholders.</p>
                <Field label="Email subject"><input className="input" value={company.emailSubjectTemplate ?? ""} onChange={(e) => update({ emailSubjectTemplate: e.target.value })} placeholder="Invoice {number} from {company}" /></Field>
                <Field label="Email body (HTML)"><textarea className="input min-h-[160px] font-mono text-xs" value={company.emailBodyTemplate ?? ""} onChange={(e) => update({ emailBodyTemplate: e.target.value })} placeholder="<p>Hi, please find your invoice attached…</p>" /></Field>
              </div>
            )}

            {tab === "billing" && billing && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-brand-200 bg-linear-to-br from-brand-50 to-sky-50 p-6 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-sky-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">InvoiceFlow Pro</p>
                      <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">99 <span className="text-base font-medium text-slate-500">DKK/month</span></p>
                    </div>
                    <span className={`badge ${billing.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700"}`}>
                      {billing.status}
                    </span>
                  </div>
                  {billing.trialEndsAt && billing.status === "trialing" && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Your free trial ends on {new Date(billing.trialEndsAt).toLocaleDateString()}.</p>
                  )}
                  <button className="btn-primary mt-5" onClick={startCheckout}>
                    <CreditCard className="h-4 w-4" /> {billing.status === "active" ? "Manage subscription" : "Subscribe now"}
                  </button>
                  {!billing.billingEnabled && <p className="mt-3 text-xs text-slate-400">Add Stripe keys to enable live billing.</p>}
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
