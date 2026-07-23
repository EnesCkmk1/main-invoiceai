import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Sparkles } from "lucide-react";
import { AuthShell, AuthFooterLink, GoogleButton } from "./AuthShell";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ui";
import type { User } from "../../lib/types";

export default function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("demo@invoiceflow.ai");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [magicMode, setMagicMode] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (magicMode) {
        const res = await api.post<{ ok: boolean; devLink?: string }>("/auth/magic-link", { email });
        toast("Magic link sent — check your email", "success");
        if (res.devLink) {
          toast("Dev mode: opening link…", "info");
          window.location.href = res.devLink;
        }
      } else {
        const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
        setSession(res.token, res.user);
        navigate("/app");
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to send your next invoice in seconds.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
        </div>
        {!magicMode && (
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Password</label>
              <Link to="/forgot" className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className="input pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
          </div>
        )}
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {magicMode ? <><Sparkles className="h-4 w-4" /> Send magic link</> : loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <button onClick={() => setMagicMode((m) => !m)} className="mt-3 w-full text-center text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
        {magicMode ? "Use password instead" : "Email me a magic link instead"}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> OR <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <GoogleButton onClick={() => toast("Add a Google client ID to enable Google login", "info")} />

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
        Demo account is pre-filled — just click Log in.
      </div>

      <AuthFooterLink text="Don't have an account?" linkText="Start free trial" to="/register" />
    </AuthShell>
  );
}
