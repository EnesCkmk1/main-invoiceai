import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthShell } from "./AuthShell";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Spinner } from "../../components/ui";
import type { User } from "../../lib/types";

export default function MagicLinkPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const res = await api.post<{ token: string; user: User }>("/auth/magic-link/verify", { token });
        setSession(res.token, res.user);
        navigate("/app");
      } catch {
        setError("This magic link is invalid or has expired.");
      }
    })();
  }, [token, setSession, navigate]);

  return (
    <AuthShell title="Signing you in" subtitle="Hang tight while we verify your magic link.">
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Spinner className="h-5 w-5 text-brand-600" /> Verifying…
        </div>
      )}
    </AuthShell>
  );
}
