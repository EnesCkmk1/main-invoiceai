import type { InvoiceStatus } from "../lib/types";
import { useT } from "../lib/i18n";

const CLS: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  VIEWED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  CANCELLED: "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const t = useT();
  const cls = CLS[status] ?? CLS.DRAFT;
  return <span className={`badge ${cls}`}>{t(`status.${status}`)}</span>;
}
