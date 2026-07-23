import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { AuthShell, AuthFooterLink, GoogleButton } from "./AuthShell";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ui";
import type { User } from "../../lib/types";

export default function RegisterPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password });
      setSession(res.token, res.user);
      toast("Welcome to InvoiceFlow! Your 14-day trial has started.", "success");
      navigate("/app");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Start your free trial" subtitle="14 days free. No credit card required.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-10" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> OR <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <GoogleButton onClick={() => toast("Add a Google client ID to enable Google login", "info")} />

      <AuthFooterLink text="Already have an account?" linkText="Log in" to="/login" />
    </AuthShell>
  );
}
