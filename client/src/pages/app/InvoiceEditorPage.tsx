import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Plus,
  Trash2,
  Wand2,
  ArrowLeft,
  Send,
  Save,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  GripVertical,
} from "lucide-react";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import type { Company, Customer, Invoice, InvoiceItem, ParsedDraft } from "../../lib/types";
import { useAuth } from "../../lib/auth";

interface DraftItem extends InvoiceItem {
  _id: string;
}

const uid = () => Math.random().toString(36).slice(2);

function emptyItem(vatRate: number): DraftItem {
  return { _id: uid(), description: "", quantity: 1, unitPrice: 0, vatRate, unit: "" };
}

export default function InvoiceEditorPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { company } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);

  const defaultVat = company?.defaultVatRate ?? 25;
  const [customerId, setCustomerId] = useState<string>(params.get("customer") ?? "");
  const [currency, setCurrency] = useState(company?.defaultCurrency ?? "DKK");
  const [items, setItems] = useState<DraftItem[]>([emptyItem(defaultVat)]);
  const [discountType, setDiscountType] = useState<"" | "percent" | "fixed">("");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentTermsDays, setPaymentTermsDays] = useState(company?.defaultPaymentTermsDays ?? 14);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState("NONE");
  const [createdByAi, setCreatedByAi] = useState(false);
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewIssues, setReviewIssues] = useState<{ level: string; message: string }[]>([]);

  // Load customers + AI status
  useEffect(() => {
    api.get<{ customers: Customer[] }>("/customers").then((r) => setCustomers(r.customers)).catch(() => {});
    api.get<{ enabled: boolean }>("/ai/status").then((r) => setAiEnabled(r.enabled || true)).catch(() => {});
  }, []);

  // Load existing invoice for edit
  useEffect(() => {
    if (!isEdit) return;
    api
      .get<{ invoice: Invoice }>(`/invoices/${id}`)
      .then((r) => {
        const inv = r.invoice;
        setCustomerId(inv.customerId ?? "");
        setCurrency(inv.currency);
        setItems(inv.items.map((it) => ({ ...it, _id: uid(), unit: it.unit ?? "" })));
        setDiscountType((inv.discountType as any) ?? "");
        setDiscountValue(inv.discountValue);
        setNotes(inv.notes ?? "");
        setRecurrence(inv.recurrence);
        setIssueDate(new Date(inv.issueDate).toISOString().slice(0, 10));
        setCreatedByAi(inv.createdByAi);
        setSavedPrompt(inv.aiPrompt ?? null);
        setLoading(false);
      })
      .catch(() => {
        toast("Invoice not found", "error");
        navigate("/app/invoices");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    const lineTotals = items.map((i) => (i.quantity || 0) * (i.unitPrice || 0));
    const subtotal = lineTotals.reduce((a, b) => a + b, 0);
    let discountTotal = 0;
    if (discountType === "percent") discountTotal = subtotal * (discountValue / 100);
    else if (discountType === "fixed") discountTotal = Math.min(discountValue, subtotal);
    const factor = subtotal > 0 ? (subtotal - discountTotal) / subtotal : 1;
    const vatTotal = items.reduce((sum, i, idx) => sum + lineTotals[idx] * factor * ((i.vatRate || 0) / 100), 0);
    return { subtotal, discountTotal, vatTotal, total: subtotal - discountTotal + vatTotal };
  }, [items, discountType, discountValue]);

  const runAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAssumptions([]);
    try {
      const res = await api.post<{ draft: ParsedDraft; matchedCustomer: Customer | null }>("/ai/parse-invoice", { prompt: aiPrompt });
      const draft = res.draft;
      setAiSource(draft.source ?? "rules");
      if (draft.items.length > 0) {
        setItems(draft.items.map((i) => ({ ...i, _id: uid(), unit: i.unit ?? "" })));
      }
      setCurrency(draft.currency);
      setPaymentTermsDays(draft.paymentTermsDays);
      if (draft.notes) setNotes(draft.notes);
      setAssumptions(draft.assumptions ?? []);
      setCreatedByAi(true);
      setSavedPrompt(aiPrompt);

      if (res.matchedCustomer) {
        setCustomerId(res.matchedCustomer.id);
        toast(`Matched existing customer: ${res.matchedCustomer.name}`, "success");
      } else if (draft.customerName) {
        // offer to create the customer
        if (confirm(`Create new customer "${draft.customerName}"?`)) {
          const created = await api.post<{ customer: Customer }>("/customers", { name: draft.customerName });
          setCustomers((c) => [created.customer, ...c]);
          setCustomerId(created.customer.id);
        }
      }
      toast("Draft created — review and edit as you like", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "AI failed", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const improveItem = async (index: number) => {
    const item = items[index];
    if (!item.description.trim()) return;
    try {
      const res = await api.post<{ improved: string }>("/ai/improve-description", { text: item.description });
      setItems((its) => its.map((it, i) => (i === index ? { ...it, description: res.improved } : it)));
      toast("Description improved", "success");
    } catch {
      toast("Could not improve description", "error");
    }
  };

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((its) => its.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const review = async () => {
    try {
      const res = await api.post<{ issues: { level: string; message: string }[] }>("/ai/review-invoice", {
        customerName: selectedCustomer?.name ?? null,
        customerEmail: selectedCustomer?.email ?? null,
        paymentTermsDays,
        items: items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, vatRate: i.vatRate })),
      });
      setReviewIssues(res.issues);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    review();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, customerId, paymentTermsDays]);

  const buildPayload = () => ({
    customerId: customerId || null,
    currency,
    issueDate,
    paymentTermsDays,
    notes: notes || null,
    discountType: discountType || null,
    discountValue,
    recurrence,
    createdByAi,
    aiPrompt: savedPrompt,
    items: items
      .filter((i) => i.description.trim() || i.unitPrice)
      .map((i) => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), vatRate: Number(i.vatRate), unit: i.unit || null })),
  });

  const save = async (send: boolean) => {
    if (!customerId) {
      toast("Please select a customer", "error");
      return;
    }
    if (buildPayload().items.length === 0) {
      toast("Add at least one line item", "error");
      return;
    }
    setSaving(true);
    try {
      let invoiceId = id;
      if (isEdit) {
        await api.put(`/invoices/${id}`, buildPayload());
      } else {
        const res = await api.post<{ invoice: Invoice }>("/invoices", buildPayload());
        invoiceId = res.invoice.id;
      }
      if (send) {
        await api.post(`/invoices/${invoiceId}/send`);
        toast("Invoice sent!", "success");
      } else {
        toast(isEdit ? "Invoice saved" : "Draft saved", "success");
      }
      navigate(`/app/invoices/${invoiceId}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-brand-600" /></div>;

  return (
    <div className="animate-fade-in">
      <Link to="/app/invoices" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Invoices
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{isEdit ? "Edit invoice" : "New invoice"}</h1>
      </div>

      {/* AI prompt */}
      {!isEdit && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-sky-50 p-5 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-sky-500/10">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Create with AI</h2>
            <span className="badge bg-white/70 text-brand-700 dark:bg-slate-900/50 dark:text-brand-300">{aiEnabled ? "beta" : "offline engine"}</span>
          </div>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Describe the invoice in plain language — AI fills in the rest. Nothing is sent automatically.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              className="input min-h-[52px] flex-1"
              placeholder="e.g. Invoice Anders Hansen for 12 hours of web development at 750 DKK/hour with 25% VAT and 14-day payment terms."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAi(); }}
            />
            <button className="btn-primary h-fit sm:self-stretch" onClick={runAi} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? <Spinner className="h-4 w-4" /> : <Zap className="h-4 w-4" />} Generate
            </button>
          </div>
          {assumptions.length > 0 && (
            <ul className="mt-3 space-y-1">
              {assumptions.map((a, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Info className="h-3 w-3" /> {a}</li>
              ))}
            </ul>
          )}
          {aiSource && <p className="mt-2 text-xs text-slate-400">Engine: {aiSource === "ai" ? "AI + rules" : "rule-based (no API key needed)"}</p>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Customer + meta */}
          <div className="card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Customer *</label>
                <div className="flex gap-2">
                  <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">Select a customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                    ))}
                  </select>
                  <Link to="/app/customers?new=1" className="btn-secondary shrink-0"><Plus className="h-4 w-4" /></Link>
                </div>
              </div>
              <div>
                <label className="label">Issue date</label>
                <input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Payment terms (days)</label>
                <input type="number" className="input" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {["DKK", "EUR", "USD", "GBP", "SEK", "NOK"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Recurrence</label>
                <select className="input" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                  <option value="NONE">One-time</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Line items</h3>
              <button className="btn-secondary" onClick={() => setItems((i) => [...i, emptyItem(defaultVat)])}><Plus className="h-4 w-4" /> Add line</button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item._id} className="grid grid-cols-12 items-start gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="col-span-12 sm:col-span-5">
                    <div className="flex items-center gap-1">
                      <GripVertical className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" />
                      <input className="input" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} />
                      <button title="Improve with AI" className="btn-ghost !px-2" onClick={() => improveItem(index)}><Wand2 className="h-4 w-4 text-brand-500" /></button>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input className="input" type="number" step="0.01" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input className="input" type="number" step="0.01" placeholder="Price" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <div className="relative">
                      <input className="input pr-6" type="number" step="0.1" placeholder="VAT" value={item.vatRate} onChange={(e) => updateItem(index, { vatRate: Number(e.target.value) })} />
                      <span className="pointer-events-none absolute right-2 top-2.5 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button className="btn-ghost !px-2 text-slate-400 hover:text-rose-500" onClick={() => setItems((its) => its.filter((_, i) => i !== index))} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="col-span-12 pl-0 text-right text-xs text-slate-400 sm:pl-6">
                    Line total: {formatMoney((item.quantity || 0) * (item.unitPrice || 0), currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes + discount */}
          <div className="card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Discount</label>
                <div className="flex gap-2">
                  <select className="input" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                    <option value="">None</option>
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed</option>
                  </select>
                  {discountType && <input className="input" type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Notes</label>
              <textarea className="input min-h-[70px]" placeholder="Notes shown on the invoice…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-6">
          <div className="card sticky top-20 p-6">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Subtotal</dt><dd className="font-medium text-slate-900 dark:text-white">{formatMoney(totals.subtotal, currency)}</dd></div>
              {totals.discountTotal > 0 && <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Discount</dt><dd className="font-medium text-rose-500">-{formatMoney(totals.discountTotal, currency)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">VAT</dt><dd className="font-medium text-slate-900 dark:text-white">{formatMoney(totals.vatTotal, currency)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800"><dt>Total</dt><dd className="text-brand-600 dark:text-brand-400">{formatMoney(totals.total, currency)}</dd></div>
            </dl>

            {reviewIssues.length > 0 && (
              <div className="mt-5 space-y-1.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><Sparkles className="h-3.5 w-3.5" /> AI check</p>
                {reviewIssues.map((issue, i) => (
                  <p key={i} className={`flex items-start gap-1.5 text-xs ${issue.level === "error" ? "text-rose-600 dark:text-rose-400" : issue.level === "warning" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {issue.level === "error" ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> : issue.level === "warning" ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />}
                    {issue.message}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-2">
              <button className="btn-primary w-full" onClick={() => save(true)} disabled={saving}><Send className="h-4 w-4" /> Save & send</button>
              <button className="btn-secondary w-full" onClick={() => save(false)} disabled={saving}><Save className="h-4 w-4" /> Save draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
