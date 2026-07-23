import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Plus,
  LogOut,
  Menu,
  X,
  Sparkles,
  Keyboard,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../lib/auth";
import { initials } from "../lib/format";
import { Modal } from "../components/ui";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/invoices", label: "Invoices", icon: FileText, end: false },
  { to: "/app/customers", label: "Customers", icon: Users, end: false },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, end: false },
  { to: "/app/settings", label: "Settings", icon: Settings, end: false },
];

export function AppLayout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if (typing) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        navigate("/app/invoices/new");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        navigate("/app/customers?new=1");
      } else if (e.key === "g") {
        // sequence handled crudely: press g then d/i
      } else if (e.key === "?") {
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center px-6">
        <Logo to="/app" />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <NavLink to="/app/invoices/new" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
          <Sparkles className="h-4 w-4" /> New Invoice
        </NavLink>
      </div>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-brand-500 to-sky-500 text-sm font-bold text-white">
            {user ? initials(user.name) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{company?.name}</p>
          </div>
          <button onClick={logout} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm lg:px-8 dark:border-slate-800 dark:bg-slate-900/80">
          <button className="btn-ghost h-9 w-9 px-0! lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-400 lg:flex dark:border-slate-800">
            Press <kbd className="rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">N</kbd> for new invoice
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <button className="btn-ghost h-9 w-9 px-0!" onClick={() => setShortcutsOpen(true)} aria-label="Shortcuts">
              <Keyboard className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <button className="btn-primary" onClick={() => navigate("/app/invoices/new")}>
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard shortcuts">
        <div className="space-y-3 text-sm">
          {[
            ["N", "New invoice"],
            ["C", "New customer"],
            ["?", "Show this help"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">{label}</span>
              <kbd className="rounded-sm bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">{key}</kbd>
            </div>
          ))}
        </div>
        <button className="btn-secondary mt-6 w-full" onClick={() => setShortcutsOpen(false)}>
          <X className="h-4 w-4" /> Close
        </button>
      </Modal>
    </div>
  );
}
