import type { InvoiceStatus } from "../lib/types";

const MAP: Record<InvoiceStatus, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  SENT: { label: "Sent", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  VIEWED: { label: "Viewed", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  PARTIAL: { label: "Partial", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  PAID: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  OVERDUE: { label: "Overdue", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400" },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = MAP[status] ?? MAP.DRAFT;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
