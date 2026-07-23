import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ui";
import type { User } from "../../lib/types";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>("/auth/reset-password", { token, password });
      setSession(res.token, res.user);
      toast("Password updated", "success");
      navigate("/app");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Invalid or expired link", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Enter a new password for your account.">
      {!token ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          Missing reset token. Please use the link from your email.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className="input pl-10" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
