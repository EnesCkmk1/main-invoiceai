import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, Users, Mail, Building2, Tag } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState, Modal, Spinner, useToast } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { initials } from "../../lib/format";
import type { Customer } from "../../lib/types";

const empty = {
  name: "",
  vatNumber: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  country: "Denmark",
  paymentTermsDays: "" as string | number,
  notes: "",
  tags: [] as string[],
};

export default function CustomersPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const load = async (search = "") => {
    setLoading(true);
    try {
      const res = await api.get<{ customers: Customer[] }>(`/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      setCustomers(res.customers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (params.get("new") === "1") {
      openCreate();
      params.delete("new");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openCreate() {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      vatNumber: c.vatNumber ?? "",
      contactPerson: c.contactPerson ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      city: c.city ?? "",
      zip: c.zip ?? "",
      country: c.country,
      paymentTermsDays: c.paymentTermsDays ?? "",
      notes: c.notes ?? "",
      tags: c.tags ?? [],
    });
    setOpen(true);
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        paymentTermsDays: form.paymentTermsDays === "" ? null : Number(form.paymentTermsDays),
      };
      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
        toast("Customer updated", "success");
      } else {
        await api.post("/customers", payload);
        toast("Customer created", "success");
      }
      setOpen(false);
      load(q);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle="Your customer database — reuse them across invoices."
        action={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> New Customer</button>}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-10" placeholder="Search by name, email, VAT…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-brand-600" /></div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No customers yet"
          description="Add your first customer, or just create an invoice and we'll save them automatically."
          action={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> New Customer</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={c.id} className="card group p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-800 text-sm font-bold text-white dark:bg-ink-700">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/app/customers/${c.id}`} className="block truncate font-semibold text-slate-900 hover:text-brand-600 dark:text-white">{c.name}</Link>
                    {c.contactPerson && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.contactPerson}</p>}
                  </div>
                </div>
                <button onClick={() => openEdit(c)} className="text-xs font-medium text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-brand-600">Edit</button>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                {c.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {c.email}</p>}
                {c.vatNumber && <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {c.vatNumber}</p>}
              </div>
              {c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Tag className="h-3 w-3" /> {t}</span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
                <span>{c._count?.invoices ?? 0} invoice(s)</span>
                <Link to={`/app/invoices/new?customer=${c.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">New invoice →</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit customer" : "New customer"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Company / name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">CVR / VAT</label>
              <input className="input" value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Contact person</label>
              <input className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="label">Zip</label>
              <input className="input" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment terms (days)</label>
              <input className="input" type="number" value={form.paymentTermsDays} onChange={(e) => setForm({ ...form, paymentTermsDays: e.target.value })} placeholder="Default" />
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t) => (
                <span key={t} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {t}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="ml-1 text-brand-400 hover:text-brand-600">×</button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add a tag and press Enter" />
              <button type="button" className="btn-secondary" onClick={addTag}>Add</button>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[70px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create customer"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
