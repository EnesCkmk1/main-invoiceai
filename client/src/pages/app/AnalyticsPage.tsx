import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Clock, Receipt, AlertTriangle, Crown } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/ui";
import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";

interface Overview {
  currency: string;
  totalRevenue: number;
  averageInvoiceValue: number;
  avgPaymentDays: number;
  overdue: { id: string; number: string; customer: string; total: number; dueDate: string }[];
  overdueTotal: number;
  topCustomers: { name: string; total: number; count: number }[];
  monthly: { label: string; revenue: number; count: number }[];
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api.get<Overview>("/analytics/overview").then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-brand-600" /></div>;

  const cur = data.currency;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Understand how your business is really doing." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label="Total revenue" value={formatMoney(data.totalRevenue, cur)} accent="bg-emerald-100 dark:bg-emerald-500/15" />
        <Stat icon={<Receipt className="h-5 w-5 text-brand-600" />} label="Avg. invoice value" value={formatMoney(data.averageInvoiceValue, cur)} accent="bg-brand-100 dark:bg-brand-500/15" />
        <Stat icon={<Clock className="h-5 w-5 text-brand-600" />} label="Avg. payment speed" value={`${data.avgPaymentDays} days`} accent="bg-brand-100 dark:bg-brand-500/15" />
        <Stat icon={<AlertTriangle className="h-5 w-5 text-rose-600" />} label="Overdue" value={formatMoney(data.overdueTotal, cur)} accent="bg-rose-100 dark:bg-rose-500/15" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-ink-900 dark:text-white">Monthly revenue (12 months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#94a3b8" className="text-xs" />
                <YAxis tickLine={false} axisLine={false} width={40} stroke="#94a3b8" className="text-xs" tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip formatter={(v) => formatMoney(Number(v ?? 0), cur)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900 dark:text-white"><Crown className="h-4 w-4 text-amber-500" /> Best customers</h3>
          {data.topCustomers.length === 0 ? (
            <p className="text-sm text-ink-400">No paid invoices yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.topCustomers.map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-500 dark:bg-ink-800 dark:text-ink-300">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{c.name}</p>
                      <p className="text-xs text-ink-400">{c.count} invoice(s)</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-900 dark:text-white">{formatMoney(c.total, cur)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-ink-200 p-5 dark:border-ink-800">
          <h3 className="font-semibold text-ink-900 dark:text-white">Overdue invoices</h3>
        </div>
        {data.overdue.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500 dark:text-ink-400">Nothing overdue. You're all caught up.</p>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {data.overdue.map((o) => (
              <a key={o.id} href={`/app/invoices/${o.id}`} className="flex items-center justify-between p-4 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{o.number}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{o.customer} · due {new Date(o.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-semibold text-rose-600">{formatMoney(o.total, cur)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
