import { LANGUAGES, useI18n } from "@/lib/i18n";

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={compact ? "flex gap-1.5" : "flex flex-wrap gap-2"}>
      {LANGUAGES.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLang(option.code)}
          aria-pressed={lang === option.code}
          aria-label={option.label}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${
            lang === option.code
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border text-muted-foreground"
          }`}
        >
          <span aria-hidden="true">{option.flag}</span>
          {compact ? null : <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}
