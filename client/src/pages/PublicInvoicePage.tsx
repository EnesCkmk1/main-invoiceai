import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Download, CreditCard, CheckCircle2, Building2, ShieldCheck } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";
import { Spinner, useToast } from "../components/ui";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import type { InvoiceItem } from "../lib/types";

interface PublicInvoice {
  invoice: {
    number: string;
    type: string;
    status: string;
    currency: string;
    issueDate: string;
    dueDate: string;
    customerName?: string | null;
    customerAddress?: string | null;
    customerVat?: string | null;
    items: InvoiceItem[];
    subtotal: number;
    discountTotal: number;
    vatTotal: number;
    total: number;
    amountPaid: number;
    notes?: string | null;
  };
  company: {
    name: string;
    logoUrl?: string | null;
    brandColor?: string | null;
    vatNumber?: string | null;
    bankName?: string | null;
    bankIban?: string | null;
    bankAccount?: string | null;
    bankSwift?: string | null;
    paymentInstructions?: string | null;
  };
  paymentEnabled: boolean;
}

export default function PublicInvoicePage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const toast = useToast();
  const [data, setData] = useState<PublicInvoice | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = () =>
    api
      .get<PublicInvoice>(`/public/invoice/${token}`)
      .then(setData)
      .catch(() => setNotFound(true));

  useEffect(() => {
    load();
    if (params.get("paid") === "1") toast("Payment received — thank you!", "success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const pay = async () => {
    setPaying(true);
    try {
      if (data?.paymentEnabled) {
        const res = await api.post<{ url: string }>(`/public/invoice/${token}/pay`);
        window.location.href = res.url;
      } else {
        await api.post(`/public/invoice/${token}/simulate-pay`, { method: "card" });
        toast("Payment received — thank you!", "success");
        load();
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Payment failed", "error");
    } finally {
      setPaying(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoice not found</h1>
          <p className="mt-2 text-slate-500">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8 text-brand-600" /></div>;

  const { invoice, company } = data;
  const isPaid = invoice.status === "PAID";
  const amountDue = invoice.total - invoice.amountPaid;

  return (
    <div className="min-h-screen bg-slate-100 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        {isPaid && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" /> <span className="font-medium">This invoice has been paid. Thank you!</span>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="p-8" style={{ borderTop: `4px solid ${company.brandColor ?? "#6366f1"}` }}>
            <div className="flex items-start justify-between">
              <div>
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="mb-2 h-10" />
                ) : (
                  <div className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                    <Building2 className="h-5 w-5" style={{ color: company.brandColor ?? undefined }} /> {company.name}
                  </div>
                )}
                {company.vatNumber && <p className="text-sm text-slate-500 dark:text-slate-400">VAT: {company.vatNumber}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{invoice.type === "CREDIT_NOTE" ? "Credit Note" : "Invoice"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.number}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-between text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to</p>
                <p className="font-medium text-slate-900 dark:text-white">{invoice.customerName}</p>
                {invoice.customerAddress && <p className="whitespace-pre-line text-slate-500 dark:text-slate-400">{invoice.customerAddress}</p>}
              </div>
              <div className="text-right text-slate-500 dark:text-slate-400">
                <p>Issued {formatDate(invoice.issueDate)}</p>
                <p>Due {formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <table className="mt-8 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoice.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-2.5 text-slate-800 dark:text-slate-100">{it.description}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{it.quantity}{it.unit ? ` ${it.unit}` : ""}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{formatMoney(it.unitPrice, invoice.currency)}</td>
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
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800"><dt>Total</dt><dd style={{ color: company.brandColor ?? undefined }}>{formatMoney(invoice.total, invoice.currency)}</dd></div>
              </dl>
            </div>

            {(company.bankIban || company.bankAccount || company.paymentInstructions) && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/50">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment details</p>
                {company.bankName && <p className="text-slate-600 dark:text-slate-300">Bank: {company.bankName}</p>}
                {company.bankIban && <p className="text-slate-600 dark:text-slate-300">IBAN: {company.bankIban}</p>}
                {company.bankAccount && <p className="text-slate-600 dark:text-slate-300">Account: {company.bankAccount}</p>}
                {company.bankSwift && <p className="text-slate-600 dark:text-slate-300">SWIFT/BIC: {company.bankSwift}</p>}
                {company.paymentInstructions && <p className="mt-1 text-slate-500 dark:text-slate-400">{company.paymentInstructions}</p>}
              </div>
            )}

            {invoice.notes && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{invoice.notes}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a className="btn-secondary flex-1" href={`/api/public/invoice/${token}/pdf`} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Download PDF</a>
          {!isPaid && (
            <button className="btn-primary flex-1" onClick={pay} disabled={paying}>
              {paying ? <Spinner className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />} Pay {formatMoney(amountDue, invoice.currency)}
            </button>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Secured by InvoiceFlow AI {!data.paymentEnabled && "· demo payment mode"}
        </p>
      </div>
    </div>
  );
}
