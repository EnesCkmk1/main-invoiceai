import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="border-b border-ink-200 bg-white/70 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/70">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-white">{title}</h1>
        <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-brand-600 dark:prose-a:text-brand-400">
          {children}
        </div>
        <p className="mt-12 text-sm text-ink-500 dark:text-ink-400">
          <Link to="/" className="text-brand-600 hover:underline dark:text-brand-400">← Back to home</Link>
        </p>
      </main>
      <footer className="border-t border-ink-200 py-8 dark:border-ink-800">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 text-sm text-ink-500 dark:text-ink-400">
          <Link to="/privacy" className="hover:text-ink-900 dark:hover:text-white">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-ink-900 dark:hover:text-white">Terms of Service</Link>
          <span>© {new Date().getFullYear()} InvoiceFlow AI</span>
        </div>
      </footer>
    </div>
  );
}
