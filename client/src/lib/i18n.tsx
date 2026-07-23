import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Locale } from "./translations";

const STORAGE_KEY = "locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tl: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolve(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "da";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => setLocaleState(next);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const raw = resolve(translations[locale] as Record<string, unknown>, key)
      ?? resolve(translations.en as Record<string, unknown>, key);
    const text = typeof raw === "string" ? raw : key;
    return interpolate(text, vars);
  };

  const tl = (key: string): string[] => {
    const raw = resolve(translations[locale] as Record<string, unknown>, key)
      ?? resolve(translations.en as Record<string, unknown>, key);
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  };

  return <I18nContext.Provider value={{ locale, setLocale, t, tl }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function useTL() {
  return useI18n().tl;
}
