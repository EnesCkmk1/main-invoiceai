import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export function Logo({ to = "/", compact = false, light = false }: { to?: string; compact?: boolean; light?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5 font-bold tracking-tight">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
          light
            ? "bg-white/10 text-white ring-1 ring-white/20"
            : "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
        }`}
      >
        <FileText className="h-4 w-4" strokeWidth={2} />
      </span>
      {!compact && (
        <span className={`text-[15px] ${light ? "text-white" : "text-ink-900 dark:text-white"}`}>
          InvoiceFlow
          <span className={`ml-1 font-semibold ${light ? "text-brand-300" : "text-brand-600 dark:text-brand-400"}`}>
            AI
          </span>
        </span>
      )}
    </Link>
  );
}
