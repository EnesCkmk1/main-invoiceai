import { useState } from "react";
import { Mail } from "lucide-react";
import { AuthShell, AuthFooterLink } from "./AuthShell";
import { api, ApiError } from "../../lib/api";
import { useToast } from "../../components/ui";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ ok: boolean; devLink?: string }>("/auth/forgot-password", { email });
      setSent(true);
      if (res.devLink) {
        toast("Dev mode: reset link ready", "info");
        setTimeout(() => (window.location.href = res.devLink!), 1200);
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link to choose a new password.">
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          If an account exists for <strong>{email}</strong>, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className="input pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <AuthFooterLink text="Remembered it?" linkText="Back to log in" to="/login" />
    </AuthShell>
  );
}
