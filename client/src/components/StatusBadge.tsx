import type { InvoiceStatus } from "../lib/types";
import { useT } from "../lib/i18n";

const CLS: Record<InvoiceStatus, string> = {
  DRAFT: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  VIEWED: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  CANCELLED: "bg-ink-100 text-ink-500 line-through dark:bg-ink-800 dark:text-ink-400",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const t = useT();
  const cls = CLS[status] ?? CLS.DRAFT;
  return <span className={`badge ${cls}`}>{t(`status.${status}`)}</span>;
}
