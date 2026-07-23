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
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payUrl, setPayUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<{ invoice: Invoice; payUrl: string }>(`/invoices/${id}`);
      setInvoice(res.invoice);
      setPayUrl(res.payUrl);
    } catch {
      toast("Invoice not found", "error");
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
      toast(err instanceof ApiError ? err.message : "Action failed", "error");
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
      toast("Failed to download PDF", "error");
    }
  };

  if (!invoice) return <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-brand-600" /></div>;

  const canEdit = invoice.status !== "PAID";

  return (
    <div className="animate-fade-in">
      <Link to="/app/invoices" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"><ArrowLeft className="h-4 w-4" /> Invoices</Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{invoice.number}</h1>
          <StatusBadge status={invoice.status} />
          {invoice.createdByAi && <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><Sparkles className="h-3 w-3" /> AI</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-secondary" onClick={downloadPdf}><Download className="h-4 w-4" /> PDF</button>
          {canEdit && <Link to={`/app/invoices/${id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> Edit</Link>}
          {invoice.status !== "PAID" && <button className="btn-primary" disabled={busy} onClick={() => action(() => api.post(`/invoices/${id}/send`), "Invoice sent")}><Send className="h-4 w-4" /> Send</button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice preview */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{invoice.customerName ?? "—"}</p>
                {invoice.customerAddress && <p className="whitespace-pre-line text-sm text-slate-500 dark:text-slate-400">{invoice.customerAddress}</p>}
                {invoice.customerVat && <p className="text-sm text-slate-500 dark:text-slate-400">VAT: {invoice.customerVat}</p>}
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500 dark:text-slate-400">Issued {formatDate(invoice.issueDate)}</p>
                <p className="text-slate-500 dark:text-slate-400">Due {formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <table className="mt-8 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">VAT</th>
                  <th className="pb-2 text-right">Amount</th>
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
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Subtotal</dt><dd className="font-medium text-slate-900 dark:text-white">{formatMoney(invoice.subtotal, invoice.currency)}</dd></div>
                {invoice.discountTotal > 0 && <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Discount</dt><dd className="font-medium text-rose-500">-{formatMoney(invoice.discountTotal, invoice.currency)}</dd></div>}
                <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">VAT</dt><dd className="font-medium text-slate-900 dark:text-white">{formatMoney(invoice.vatTotal, invoice.currency)}</dd></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800"><dt>Total</dt><dd className="text-brand-600 dark:text-brand-400">{formatMoney(invoice.total, invoice.currency)}</dd></div>
                {invoice.amountPaid > 0 && invoice.status !== "PAID" && <div className="flex justify-between text-emerald-600"><dt>Paid</dt><dd>{formatMoney(invoice.amountPaid, invoice.currency)}</dd></div>}
              </dl>
            </div>

            {invoice.notes && <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">{invoice.notes}</p>}
          </div>

          {/* Public link */}
          <div className="card mt-4 flex items-center justify-between p-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Public payment link</p>
              <p className="truncate text-sm text-slate-600 dark:text-slate-300">{payUrl}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary !px-3" onClick={() => { navigator.clipboard.writeText(payUrl); toast("Link copied", "success"); }}><Copy className="h-4 w-4" /></button>
              <a className="btn-secondary !px-3" href={payUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

        {/* Actions + timeline */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {invoice.status !== "PAID" && (
                <button className="btn-secondary col-span-2" disabled={busy} onClick={() => action(() => api.post(`/invoices/${id}/mark-paid`, {}), "Marked as paid")}><Check className="h-4 w-4" /> Mark as paid</button>
              )}
              <button className="btn-secondary" disabled={busy} onClick={() => action(async () => { const r = await api.post<{ invoice: Invoice }>(`/invoices/${id}/duplicate`); navigate(`/app/invoices/${r.invoice.id}/edit`); }, "Duplicated")}><Copy className="h-4 w-4" /> Duplicate</button>
              <button className="btn-secondary" disabled={busy} onClick={() => action(async () => { const r = await api.post<{ invoice: Invoice }>(`/invoices/${id}/credit-note`); navigate(`/app/invoices/${r.invoice.id}`); }, "Credit note created")}><FileMinus className="h-4 w-4" /> Credit note</button>
              {invoice.status !== "PAID" && invoice.status !== "DRAFT" && (
                <button className="btn-secondary col-span-2" disabled={busy} onClick={() => action(() => api.post(`/invoices/${id}/remind`), "Reminder sent")}><Bell className="h-4 w-4" /> Send reminder</button>
              )}
              <button className="btn-secondary col-span-2 text-rose-600" disabled={busy} onClick={() => { if (confirm("Delete this invoice?")) action(async () => { await api.del(`/invoices/${id}`); navigate("/app/invoices"); }, "Deleted"); }}><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Activity</h3>
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
              {(!invoice.events || invoice.events.length === 0) && <p className="text-sm text-slate-400">No activity yet.</p>}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
