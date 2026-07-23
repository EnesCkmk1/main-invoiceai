import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../components/Logo";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Check } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left: form */}
      <div className="flex w-full flex-col px-6 lg:w-1/2 lg:px-16">
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 to-sky-600 lg:block">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-extrabold leading-tight">
            Create invoices in<br />30 seconds.
          </h2>
          <p className="mt-4 max-w-md text-lg text-brand-50">
            The fastest way to send a professional invoice. Not an accounting program — just invoicing.
          </p>
          <ul className="mt-8 space-y-3">
            {["AI invoice creation", "Beautiful branded PDFs", "Get paid online instantly", "99 DKK/month, all included"].map((f) => (
              <li key={f} className="flex items-center gap-3 text-brand-50">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-4 w-4" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary w-full">
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
      </svg>
      Continue with Google
    </button>
  );
}

export function AuthFooterLink({ text, linkText, to }: { text: string; linkText: string; to: string }) {
  return (
    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
      {text}{" "}
      <Link to={to} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
        {linkText}
      </Link>
    </p>
  );
}
