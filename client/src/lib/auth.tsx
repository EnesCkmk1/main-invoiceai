import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import type { Company, User } from "./types";

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }
    try {
      const { user, company } = await api.get<{ user: User; company: Company }>("/auth/me");
      setUser(user);
      setCompany(company);
    } catch {
      clearToken();
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const setSession = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    refresh();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, setSession, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
