import { Languages } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LOCALES, type Locale } from "../lib/translations";

export function LanguageToggle({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();

  const cycle = () => {
    const idx = LOCALES.findIndex((l) => l.code === locale);
    const next = LOCALES[(idx + 1) % LOCALES.length].code as Locale;
    setLocale(next);
  };

  if (compact) {
    return (
      <button onClick={cycle} aria-label="Toggle language" className="btn-ghost h-9 px-2! text-xs font-semibold uppercase">
        {locale}
      </button>
    );
  }

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
      className="input h-9 w-auto min-w-[7rem] py-1 text-sm"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

export function LanguageToggleIcon() {
  const { locale, setLocale } = useI18n();
  const next = locale === "da" ? "en" : "da";

  return (
    <button
      onClick={() => setLocale(next)}
      aria-label={`Switch to ${next === "da" ? "Danish" : "English"}`}
      className="btn-ghost h-9 w-9 px-0!"
      title={next === "da" ? "Dansk" : "English"}
    >
      <Languages className="h-5 w-5" />
    </button>
  );
}
