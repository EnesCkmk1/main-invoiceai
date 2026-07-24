import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, FileText, Sparkles } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, Spinner } from "../../components/ui";
import { api } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { useI18n, useT } from "../../lib/i18n";
import type { Invoice, InvoiceStatus } from "../../lib/types";

export default function InvoicesPage() {
  const t = useT();
  const { locale } = useI18n();
  const filters = [
    { label: t("invoices.filterAll"), value: "" },
    { label: t("invoices.filterDraft"), value: "DRAFT" },
    { label: t("invoices.filterSent"), value: "SENT" },
    { label: t("invoices.filterPaid"), value: "PAID" },
    { label: t("invoices.filterOverdue"), value: "OVERDUE" },
  ];
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      const res = await api.get<{ invoices: Invoice[] }>(`/invoices?${params.toString()}`);
      setInvoices(res.invoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t("invoices.title")}
        subtitle={t("invoices.subtitle")}
        action={<Link to="/app/invoices/new" className="btn-primary"><Plus className="h-4 w-4" /> {t("nav.newInvoice")}</Link>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                status === f.value ? "bg-brand-600 text-white" : "bg-white text-ink-600 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-400" />
          <input className="input pl-10" placeholder={t("invoices.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-brand-600" /></div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={t("invoices.emptyTitle")}
          description={t("invoices.emptyDesc")}
          action={<Link to="/app/invoices/new" className="btn-primary"><Plus className="h-4 w-4" /> {t("nav.newInvoice")}</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-12 gap-4 border-b border-ink-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400 sm:grid dark:border-ink-800">
            <div className="col-span-3">{t("invoices.colInvoice")}</div>
            <div className="col-span-3">{t("invoices.colCustomer")}</div>
            <div className="col-span-2">{t("invoices.colIssued")}</div>
            <div className="col-span-2">{t("invoices.colDue")}</div>
            <div className="col-span-1 text-right">{t("invoices.colTotal")}</div>
            <div className="col-span-1 text-right">{t("invoices.colStatus")}</div>
          </div>
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                to={`/app/invoices/${inv.id}`}
                className="grid grid-cols-2 gap-2 p-4 hover:bg-ink-50 sm:grid-cols-12 sm:gap-4 sm:px-5 dark:hover:bg-ink-800/50"
              >
                <div className="col-span-3 flex items-center gap-2">
                  {inv.createdByAi && <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-500" />}
                  <span className="font-medium text-ink-800 dark:text-ink-100">{inv.number}</span>
                  {inv.type === "CREDIT_NOTE" && <span className="badge bg-ink-100 text-ink-500 dark:bg-ink-800">{t("invoices.credit")}</span>}
                </div>
                <div className="col-span-3 truncate text-sm text-ink-600 dark:text-ink-300">{inv.customer?.name ?? inv.customerName ?? "—"}</div>
                <div className="col-span-2 hidden text-sm text-ink-500 sm:block dark:text-ink-400">{formatDate(inv.issueDate, locale)}</div>
                <div className="col-span-2 hidden text-sm text-ink-500 sm:block dark:text-ink-400">{formatDate(inv.dueDate, locale)}</div>
                <div className="col-span-1 text-right text-sm font-semibold text-ink-900 dark:text-white">{formatMoney(inv.total, inv.currency)}</div>
                <div className="col-span-1 flex justify-end"><StatusBadge status={inv.status as InvoiceStatus} /></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
