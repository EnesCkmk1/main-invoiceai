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
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
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
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}`}
        subtitle="Here's how your invoicing is going."
        action={
          <>
            <Link to="/app/customers?new=1" className="btn-secondary"><UserPlus className="h-4 w-4" /> New Customer</Link>
            <Link to="/app/invoices/new" className="btn-primary"><Plus className="h-4 w-4" /> New Invoice</Link>
          </>
        }
      />

      {aiSummary && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-sky-50 p-4 dark:border-brand-500/20 dark:from-brand-500/10 dark:to-sky-500/10">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <p className="text-sm text-slate-700 dark:text-slate-200">{aiSummary}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label="Revenue this month" value={formatMoney(data.monthlyRevenue, data.currency)} accent="bg-emerald-100 dark:bg-emerald-500/15" />
        <StatCard icon={<Clock className="h-5 w-5 text-amber-600" />} label="Outstanding" value={formatMoney(data.outstanding, data.currency)} accent="bg-amber-100 dark:bg-amber-500/15" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-brand-600" />} label="Paid invoices" value={String(data.paidCount)} accent="bg-brand-100 dark:bg-brand-500/15" />
        <StatCard icon={<Clock className="h-5 w-5 text-rose-600" />} label="Awaiting payment" value={String(data.outstandingCount)} accent="bg-rose-100 dark:bg-rose-500/15" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue graph */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Revenue (last 6 months)</h3>
            <Link to="/app/analytics" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              Analytics <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueGraph}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} width={40} stroke="#94a3b8" className="text-xs" tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
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
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Upcoming payments</h3>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nothing due soon. Nice and clear.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcoming.map((inv) => (
                <li key={inv.id}>
                  <Link to={`/app/invoices/${inv.id}`} className="flex items-center justify-between rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{inv.customer?.name ?? inv.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Due {formatDate(inv.dueDate)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatMoney(inv.total, inv.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent activity</h3>
          <Link to="/app/invoices" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">View all</Link>
        </div>
        {data.recentInvoices.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No invoices yet. Create your first one!</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentInvoices.map((inv) => (
              <Link key={inv.id} to={`/app/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {inv.createdByAi && <Sparkles className="h-4 w-4 text-brand-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{inv.number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{inv.customer?.name ?? inv.customerName ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatMoney(inv.total, inv.currency)}</span>
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
