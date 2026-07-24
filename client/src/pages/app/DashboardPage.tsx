import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  UserPlus,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Spinner } from "../../components/ui";
import { api } from "../../lib/api";
import { formatMoney, formatDate } from "../../lib/format";
import type { Invoice } from "../../lib/types";
import { useAuth } from "../../lib/auth";
import { useI18n, useT } from "../../lib/i18n";

interface DashboardData {
  currency: string;
  monthlyRevenue: number;
  outstanding: number;
  outstandingCount: number;
  paidCount: number;
  revenueGraph: { label: string; revenue: number }[];
  recentInvoices: (Invoice & { customer?: { name: string } | null })[];
  upcoming: (Invoice & { customer?: { name: string } | null })[];
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-xl font-bold text-ink-900 sm:text-2xl dark:text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const t = useT();
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/analytics/dashboard").then(setData).catch(() => {});
    api.get<{ summary: string }>("/ai/monthly-summary").then((r) => setAiSummary(r.summary)).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t("dashboard.welcome", { name: user?.name?.split(" ")[0] ?? "" })}
        subtitle={t("dashboard.subtitle")}
        action={
          <>
            <Link to="/app/customers?new=1" className="btn-secondary min-h-11 flex-1 sm:flex-none"><UserPlus className="h-4 w-4" /> {t("dashboard.newCustomer")}</Link>
            <Link to="/app/invoices/new" className="btn-primary min-h-11 flex-1 sm:flex-none"><Plus className="h-4 w-4" /> {t("nav.newInvoice")}</Link>
          </>
        }
      />

      {aiSummary && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200/80 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <p className="text-sm text-ink-700 dark:text-ink-200">{aiSummary}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label={t("dashboard.revenueMonth")} value={formatMoney(data.monthlyRevenue, data.currency)} accent="bg-emerald-100 dark:bg-emerald-500/15" />
        <StatCard icon={<Clock className="h-5 w-5 text-amber-600" />} label={t("dashboard.outstanding")} value={formatMoney(data.outstanding, data.currency)} accent="bg-amber-100 dark:bg-amber-500/15" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-brand-600" />} label={t("dashboard.paidInvoices")} value={String(data.paidCount)} accent="bg-brand-100 dark:bg-brand-500/15" />
        <StatCard icon={<Clock className="h-5 w-5 text-rose-600" />} label={t("dashboard.awaitingPayment")} value={String(data.outstandingCount)} accent="bg-rose-100 dark:bg-rose-500/15" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue graph */}
        <div className="card p-4 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink-900 dark:text-white">{t("dashboard.revenueChart")}</h3>
            <Link to="/app/analytics" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              {t("dashboard.analytics")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueGraph} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} stroke="#94a3b8" interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} width={36} stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip
                  formatter={(v) => formatMoney(Number(v ?? 0), data.currency)}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming payments */}
        <div className="card p-4 sm:p-6">
          <h3 className="mb-4 font-semibold text-ink-900 dark:text-white">{t("dashboard.upcoming")}</h3>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-400">{t("dashboard.nothingDue")}</p>
          ) : (
            <ul className="space-y-3">
              {data.upcoming.map((inv) => (
                <li key={inv.id}>
                  <Link to={`/app/invoices/${inv.id}`} className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-ink-50 dark:hover:bg-ink-800">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{inv.customer?.name ?? inv.customerName}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{t("dashboard.due", { date: formatDate(inv.dueDate, locale) })}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink-900 dark:text-white">{formatMoney(inv.total, inv.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 p-4 sm:p-5 dark:border-ink-800">
          <h3 className="font-semibold text-ink-900 dark:text-white">{t("dashboard.recentActivity")}</h3>
          <Link to="/app/invoices" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">{t("dashboard.viewAll")}</Link>
        </div>
        {data.recentInvoices.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500 dark:text-ink-400">{t("dashboard.noInvoices")}</p>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {data.recentInvoices.map((inv) => (
              <Link key={inv.id} to={`/app/invoices/${inv.id}`} className="flex flex-col gap-2 p-4 hover:bg-ink-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-ink-800/50">
                <div className="flex min-w-0 items-center gap-3">
                  {inv.createdByAi && <Sparkles className="h-4 w-4 shrink-0 text-brand-500" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{inv.number}</p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{inv.customer?.name ?? inv.customerName ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="text-sm font-semibold text-ink-900 dark:text-white">{formatMoney(inv.total, inv.currency)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
