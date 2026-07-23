import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2, MapPin, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "../../components/StatusBadge";
import { Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { formatDate, formatMoney } from "../../lib/format";
import type { Customer } from "../../lib/types";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    api.get<{ customer: Customer }>(`/customers/${id}`).then((r) => setCustomer(r.customer)).catch(() => toast("Customer not found", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const remove = async () => {
    if (!confirm("Delete this customer? Their invoices will be kept.")) return;
    try {
      await api.del(`/customers/${id}`);
      toast("Customer deleted", "success");
      navigate("/app/customers");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete", "error");
    }
  };

  if (!customer) return <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-brand-600" /></div>;

  return (
    <div className="animate-fade-in">
      <Link to="/app/customers" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"><ArrowLeft className="h-4 w-4" /> Customers</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-fit p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
          {customer.contactPerson && <p className="text-sm text-slate-500 dark:text-slate-400">{customer.contactPerson}</p>}
          <div className="mt-5 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            {customer.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {customer.email}</p>}
            {customer.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {customer.phone}</p>}
            {customer.vatNumber && <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" /> {customer.vatNumber}</p>}
            {(customer.address || customer.city) && (
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /> <span>{[customer.address, [customer.zip, customer.city].filter(Boolean).join(" "), customer.country].filter(Boolean).join(", ")}</span></p>
            )}
          </div>
          {customer.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {customer.tags.map((t) => <span key={t} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t}</span>)}
            </div>
          )}
          {customer.notes && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">{customer.notes}</p>}
          <div className="mt-5 flex gap-2">
            <Link to={`/app/invoices/new?customer=${customer.id}`} className="btn-primary flex-1"><Plus className="h-4 w-4" /> New invoice</Link>
            <button onClick={remove} className="btn-secondary !px-3 text-rose-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Invoices</h3>
          </div>
          {!customer.invoices || customer.invoices.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No invoices for this customer yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {customer.invoices.map((inv) => (
                <Link key={inv.id} to={`/app/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{inv.number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(inv.issueDate)}</p>
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
    </div>
  );
}
