import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Download,
  Check,
  Copy,
  FileMinus,
  Bell,
  Trash2,
  Pencil,
  Clock,
  Eye,
  Mail,
  CircleDollarSign,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError, getToken } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import { useI18n, useT } from "../../lib/i18n";
import type { Invoice } from "../../lib/types";

const EVENT_ICON: Record<string, React.ReactNode> = {
  CREATED: <Sparkles className="h-4 w-4" />,
  SENT: <Mail className="h-4 w-4" />,
  OPENED: <Eye className="h-4 w-4" />,
  DOWNLOADED: <Download className="h-4 w-4" />,
  PAID: <CircleDollarSign className="h-4 w-4" />,
  REMINDER_SENT: <Bell className="h-4 w-4" />,
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const t = useT();
  const { locale } = useI18n();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payUrl, setPayUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<{ invoice: Invoice; payUrl: string }>(`/invoices/${id}`);
      setInvoice(res.invoice);
      setPayUrl(res.payUrl);
    } catch {
      toast(t("invoice.notFound"), "error");
      navigate("/app/invoices");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const action = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast(successMsg, "success");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("common.actionFailed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast(t("invoice.pdfFailed"), "error");
    }
  };

  if (!invoice) return <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-brand-600" /></div>;

  const canEdit = invoice.status !== "PAID";

  return (
    <div className="animate-fade-in">
      <Link to="/app/invoices" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"><ArrowLeft className="h-4 w-4" /> {t("invoice.back")}</Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{invoice.number}</h1>
          <StatusBadge status={invoice.status} />
          {invoice.createdByAi && <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><Sparkles className="h-3 w-3" /> AI</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={downloadPdf}><Download className="h-4 w-4" /> {t("invoice.pdf")}</button>
          {canEdit && <Link to={`/app/invoices/${id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> {t("common.edit")}</Link>}
          {invoice.status !== "PAID" && <button className="btn-primary" disabled={busy} onClick={() => action(() => api.post(`/invoices/${id}/send`), t("invoice.sent"))}><Send className="h-4 w-4" /> {t("common.send")}</button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice preview */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("invoice.billTo")}</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{invoice.customerName ?? "—"}</p>
                {invoice.customerAddress && <p className="whitespace-pre-line text-sm text-slate-500 dark:text-slate-400">{invoice.customerAddress}</p>}
                {invoice.customerVat && <p className="text-sm text-slate-500 dark:text-slate-400">VAT: {invoice.customerVat}</p>}
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500 dark:text-slate-400">{t("invoice.issued", { date: formatDate(invoice.issueDate, locale) })}</p>
                <p className="text-slate-500 dark:text-slate-400">{t("invoice.due", { date: formatDate(invoice.dueDate, locale) })}</p>
              </div>
            </div>

            <table className="mt-8 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="pb-2">{t("invoice.description")}</th>
                  <th className="pb-2 text-right">{t("invoice.qty")}</th>
                  <th className="pb-2 text-right">{t("invoice.price")}</th>
                  <th className="pb-2 text-right">{t("invoice.vat")}</th>
                  <th className="pb-2 text-right">{t("invoice.amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoice.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-slate-800 dark:text-slate-100">{it.description}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{it.quantity}{it.unit ? ` ${it.unit}` : ""}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{formatMoney(it.unitPrice, invoice.currency)}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{it.vatRate}%</td>
                    <td className="py-2.5 text-right font-medium text-slate-900 dark:text-white">{formatMoney((it.quantity || 0) * (it.unitPrice || 0), invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">{t("invoice.subtotal")}</dt><dd className="font-medium text-slate-900 dark:text-white">{formatMoney(invoice.subtotal, invoice.currency)}</dd></div>
                {invoice.discountTotal > 0 && <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">{t("invoice.discount")}</dt><dd className="font-medium text-rose-500">-{formatMoney(invoice.discountTotal, invoice.currency)}</dd></div>}
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">{t("invoice.vat")}</dt><dd className="font-medium text-slate-900 dark:text-white">{formatMoney(invoice.vatTotal, invoice.currency)}</dd></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800"><dt>{t("invoice.total")}</dt><dd className="text-brand-600 dark:text-brand-400">{formatMoney(invoice.total, invoice.currency)}</dd></div>
                {invoice.amountPaid > 0 && invoice.status !== "PAID" && <div className="flex justify-between text-emerald-600"><dt>{t("invoice.paid")}</dt><dd>{formatMoney(invoice.amountPaid, invoice.currency)}</dd></div>}
              </dl>
            </div>

            {invoice.notes && <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">{invoice.notes}</p>}
          </div>

          {/* Public link */}
          <div className="card mt-4 flex items-center justify-between p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">{t("invoice.publicLink")}</p>
              <p className="truncate text-sm text-slate-600 dark:text-slate-300">{payUrl}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary px-3!" onClick={() => { navigator.clipboard.writeText(payUrl); toast(t("invoice.linkCopied"), "success"); }}><Copy className="h-4 w-4" /></button>
              <a className="btn-secondary px-3!" href={payUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

        {/* Actions + timeline */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">{t("invoice.actions")}</h3>
            <div className="grid grid-cols-2 gap-2">
              {invoice.status !== "PAID" && (
                <button className="btn-secondary col-span-2" disabled={busy} onClick={() => action(() => api.post(`/invoices/${id}/mark-paid`, {}), t("invoice.markedPaid"))}><Check className="h-4 w-4" /> {t("invoice.markPaid")}</button>
              )}
              <button className="btn-secondary" disabled={busy} onClick={() => action(async () => { const r = await api.post<{ invoice: Invoice }>(`/invoices/${id}/duplicate`); navigate(`/app/invoices/${r.invoice.id}/edit`); }, t("invoice.duplicated"))}><Copy className="h-4 w-4" /> {t("invoice.duplicate")}</button>
              <button className="btn-secondary" disabled={busy} onClick={() => action(async () => { const r = await api.post<{ invoice: Invoice }>(`/invoices/${id}/credit-note`); navigate(`/app/invoices/${r.invoice.id}`); }, t("invoice.creditCreated"))}><FileMinus className="h-4 w-4" /> {t("invoice.creditNote")}</button>
              {invoice.status !== "PAID" && invoice.status !== "DRAFT" && (
                <button className="btn-secondary col-span-2" disabled={busy} onClick={() => action(() => api.post(`/invoices/${id}/remind`), t("invoice.reminderSent"))}><Bell className="h-4 w-4" /> {t("invoice.sendReminder")}</button>
              )}
              <button className="btn-secondary col-span-2 text-rose-600" disabled={busy} onClick={() => { if (confirm(t("invoice.deleteConfirm"))) action(async () => { await api.del(`/invoices/${id}`); navigate("/app/invoices"); }, t("invoice.deleted")); }}><Trash2 className="h-4 w-4" /> {t("common.delete")}</button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">{t("invoice.activity")}</h3>
            <ol className="space-y-4">
              {(invoice.events ?? []).map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {EVENT_ICON[ev.type] ?? <Clock className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-800 dark:text-slate-100">{ev.type.toLowerCase().replace("_", " ")}</p>
                    <p className="text-xs text-slate-400">{new Date(ev.createdAt).toLocaleString()}{ev.meta ? ` · ${ev.meta}` : ""}</p>
                  </div>
                </li>
              ))}
              {(!invoice.events || invoice.events.length === 0) && <p className="text-sm text-slate-400">{t("invoice.noActivity")}</p>}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
