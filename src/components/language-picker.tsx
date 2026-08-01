import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { Flag } from "@/components/flag";

export function LanguagePicker({ align = "end" }: { align?: "start" | "end" }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang)!;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.chooseLanguage}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-lg leading-none transition-colors hover:border-primary/60"
      >
        <Flag code={current.code} className="h-4 w-6" />
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      {open ? (
        <ul
          className={`absolute z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {LANGUAGES.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                onClick={() => {
                  setLang(option.code);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary"
              >
                <Flag code={option.code} className="h-4 w-6" />
                <span className="flex-1">{option.label}</span>
                {option.code === lang ? <Check className="size-4 text-primary" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
