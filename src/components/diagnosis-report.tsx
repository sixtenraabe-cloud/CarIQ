import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  ListChecks,
  OctagonAlert,
  Receipt,
  Stethoscope,
  TriangleAlert,
  Waves,
  Wrench,
} from "lucide-react";
import type { DiagnosisResult, SecondOpinion, Verdict } from "@/lib/diagnosis-types";
import type { Cause } from "@/lib/diagnosis-types";
import { VERDICTS, VERDICT_DOT } from "@/lib/diagnosis-types";
import { useI18n, type Dict } from "@/lib/i18n";

type TextKey = { [K in keyof Dict]: Dict[K] extends string ? K : never }[keyof Dict];

const VERDICT_KEY: Record<Verdict, TextKey> = {
  safe: "sevSafe",
  caution: "sevCaution",
  soon: "sevSoon",
  urgent: "sevUrgent",
};

const VERDICT_SUB: Record<Verdict, TextKey> = {
  safe: "sevSafeSub",
  caution: "sevCautionSub",
  soon: "sevSoonSub",
  urgent: "sevUrgentSub",
};

const VERDICT_STYLE: Record<Verdict, { border: string; text: string; bar: string; bg: string; ring: string }> = {
  safe: {
    border: "border-signal-safe",
    text: "text-signal-safe",
    bar: "bg-signal-safe",
    bg: "bg-signal-safe/10",
    ring: "stroke-signal-safe",
  },
  caution: {
    border: "border-signal-caution",
    text: "text-signal-caution",
    bar: "bg-signal-caution",
    bg: "bg-signal-caution/10",
    ring: "stroke-signal-caution",
  },
  soon: {
    border: "border-signal-soon",
    text: "text-signal-soon",
    bar: "bg-signal-soon",
    bg: "bg-signal-soon/10",
    ring: "stroke-signal-soon",
  },
  urgent: {
    border: "border-signal-urgent",
    text: "text-signal-urgent",
    bar: "bg-signal-urgent",
    bg: "bg-signal-urgent/10",
    ring: "stroke-signal-urgent",
  },
};

const VERDICT_ICON: Record<Verdict, typeof CheckCircle2> = {
  safe: CheckCircle2,
  caution: AlertTriangle,
  soon: TriangleAlert,
  urgent: OctagonAlert,
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { t } = useI18n();
  const style = VERDICT_STYLE[verdict] ?? VERDICT_STYLE.caution;
  const key = VERDICT_KEY[verdict] ?? "sevCaution";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${style.border} ${style.text} ${style.bg}`}
    >
      <span aria-hidden="true">{VERDICT_DOT[verdict] ?? "🟡"}</span>
      {t[key]}
    </span>
  );
}

function ConfidenceRing({ value, className }: { value: number; className: string }) {
  const size = 74;
  const r = 31;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-secondary" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className={`fill-none ${className}`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground text-[15px] font-bold"
      >
        {pct}%
      </text>
    </svg>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: typeof CheckCircle2;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="size-4" />
        </span>
        <p className="stencil">{title}</p>
      </div>
      {children}
    </section>
  );
}

function SeverityScale({ active }: { active: Verdict }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-4 gap-2">
      {VERDICTS.map((level) => {
        const style = VERDICT_STYLE[level];
        const on = level === active;
        return (
          <div
            key={level}
            className={`rounded-xl border p-2 text-center transition-all ${
              on ? `${style.border} ${style.bg} scale-[1.03]` : "border-border opacity-40"
            }`}
          >
            <div className="text-base leading-none" aria-hidden="true">
              {VERDICT_DOT[level]}
            </div>
            <p className={`mt-1 text-[11px] leading-tight font-semibold ${on ? style.text : "text-muted-foreground"}`}>
              {t[VERDICT_KEY[level]]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CauseCard({ cause, rank }: { cause: Cause; rank: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const brief = cause.summary || cause.explanation.split(/(?<=\.)\s/)[0] || cause.explanation;
  const hasMore = Boolean(cause.explanation && cause.explanation.trim() !== brief.trim());

  return (
    <div className="tile lift p-4">
      <div className="flex items-start gap-3">
        <span className="font-display mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-xs text-primary">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base leading-tight">{cause.part}</h3>
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="font-display text-primary">{cause.likelihood}%</span>
              <span className="text-[11px] text-muted-foreground">{t.likelihoodLabel}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
              style={{ width: `${cause.likelihood}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{brief}</p>
          {hasMore ? (
            <>
              {open ? (
                <p className="mt-2 border-l-2 border-primary/40 pl-3 text-sm whitespace-pre-line text-muted-foreground">
                  {cause.explanation}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                {open ? t.showLess : t.showMore}
                <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DiagnosisReport({
  result,
  carLine,
  secondOpinion,
}: {
  result: DiagnosisResult;
  carLine: string;
  secondOpinion?: SecondOpinion | null;
}) {
  const { t } = useI18n();
  const style = VERDICT_STYLE[result.verdict] ?? VERDICT_STYLE.caution;
  const Icon = VERDICT_ICON[result.verdict] ?? AlertTriangle;
  const causes = [...result.causes.filter((c) => c.likelihood >= 5)].sort(
    (a, b) => b.likelihood - a.likelihood,
  );

  return (
    <div className="space-y-5">
      {result.mismatch ? (
        <div className="panel flex gap-3 border-l-4 border-signal-caution p-4">
          <HelpCircle className="mt-0.5 size-5 shrink-0 text-signal-caution" />
          <div>
            <p className="font-semibold text-signal-caution">{t.mismatchTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.mismatch || t.mismatchFallback}</p>
          </div>
        </div>
      ) : null}

      <section className={`surface rise relative overflow-hidden border-l-4 p-5 ${style.border}`}>
        <div className={`pointer-events-none absolute -top-16 -right-12 size-48 rounded-full blur-3xl ${style.bg}`} />
        <div className="relative">
          <p className="stencil">{carLine}</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className={`inline-flex items-center gap-2 ${style.text}`}>
                <Icon className="size-6 shrink-0" />
                <h2 className="text-2xl leading-tight">{t[VERDICT_KEY[result.verdict]]}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t[VERDICT_SUB[result.verdict]]}</p>
            </div>
            <div className="text-center">
              <ConfidenceRing value={result.confidence} className={style.ring} />
              <p className="stencil mt-1 text-[10px]">{t.confidence}</p>
            </div>
          </div>
          <p className="mt-4 text-lg leading-snug text-foreground">{result.headline}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t.confidenceHint}</p>
          <div className="mt-5">
            <p className="stencil mb-2">{t.severityScale}</p>
            <SeverityScale active={result.verdict} />
          </div>
        </div>
      </section>

      {result.mechanicNote ? (
        <SectionCard icon={Wrench} title={t.mechanicSays}>
          <div className="space-y-2">
            {result.mechanicNote
              .split(/(?<=[.!?])\s+/)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 3)
              .map((s) => (
                <p key={s} className="text-[15px] leading-relaxed text-foreground/90">
                  {s}
                </p>
              ))}
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {result.lampName ? (
          <div className="surface border-l-4 border-signal-caution p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-signal-caution/12 text-signal-caution">
                <AlertTriangle className="size-4" />
              </span>
              <p className="stencil">{t.lampTitle}</p>
            </div>
            <p className="font-semibold">{result.lampName}</p>
            {result.lampMeaning ? (
              <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{result.lampMeaning}</p>
            ) : null}
          </div>
        ) : null}

        {result.audioUsed && result.audioNote ? (
          <SectionCard icon={Waves} title={t.audioSounded}>
            <p className="text-sm leading-relaxed">{result.audioNote}</p>
          </SectionCard>
        ) : null}
      </div>

      {causes.length ? (
        <div>
          <p className="stencil mb-3">{t.likelyCauses}</p>
          <div className="grid gap-3">
            {causes.map((cause, i) => (
              <CauseCard key={cause.part} cause={cause} rank={i + 1} />
            ))}
          </div>
        </div>
      ) : null}

      {result.checks.length ? (
        <SectionCard icon={ListChecks} title={t.selfChecks}>
          <ul className="space-y-2.5 text-sm">
            {result.checks.map((check, i) => (
              <li key={check} className="flex gap-3 rounded-lg bg-secondary/40 p-3">
                <span className="font-display grid size-5 shrink-0 place-items-center rounded-md bg-primary/15 text-[11px] text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{check}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard icon={Stethoscope} title={t.recommendation}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{result.advice}</p>
        </SectionCard>
        <SectionCard icon={Receipt} title={t.estimatedCost} className="flex flex-col justify-between">
          <div>
            <p className="font-display brand-text text-3xl">{result.estimatedCost}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.costIncludesLabour}</p>
          </div>
        </SectionCard>
      </div>

      {secondOpinion ? (
        <section className="surface border-l-4 border-primary p-5">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
              <Stethoscope className="size-4" />
            </span>
            <p className="stencil">{t.secondOpinionTitle}</p>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line">{secondOpinion.summary}</p>

          {secondOpinion.alternatives.length ? (
            <div className="mt-4 space-y-3">
              <p className="stencil">{t.altCauses}</p>
              {secondOpinion.alternatives.map((alt) => (
                <div key={alt.part} className="tile p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-semibold">{alt.part}</h4>
                    <span className="font-display text-sm text-primary">{alt.likelihood}%</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase">
                    {alt.stance === "more" ? t.moreLikely : alt.stance === "less" ? t.lessLikely : t.agrees}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{alt.why}</p>
                </div>
              ))}
            </div>
          ) : null}

          {secondOpinion.extra ? (
            <div className="mt-4">
              <p className="stencil">{t.extraDetail}</p>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{secondOpinion.extra}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">{t.reportDisclaimer}</p>
    </div>
  );
}
