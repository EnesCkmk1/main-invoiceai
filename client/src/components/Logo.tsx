import { Link } from "react-router-dom";

export function Logo({ to = "/", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-extrabold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M6 4h12v2H6zM6 9h12v2H6zM6 14h8v2H6z" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg text-slate-900 dark:text-white">
          InvoiceFlow <span className="text-brand-600 dark:text-brand-400">AI</span>
        </span>
      )}
    </Link>
  );
}
