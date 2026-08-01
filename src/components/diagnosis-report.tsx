import { AlertTriangle, CheckCircle2, OctagonAlert, TriangleAlert, Waves, Wrench } from "lucide-react";
import type { DiagnosisResult, SecondOpinion, Verdict } from "@/lib/diagnosis-types";
import { VERDICTS, VERDICT_DOT } from "@/lib/diagnosis-types";
import { useI18n, type Dict } from "@/lib/i18n";

const VERDICT_KEY: Record<Verdict, keyof Dict> = {
  safe: "sevSafe",
  caution: "sevCaution",
  soon: "sevSoon",
  urgent: "sevUrgent",
};

const VERDICT_SUB: Record<Verdict, keyof Dict> = {
  safe: "sevSafeSub",
  caution: "sevCautionSub",
  soon: "sevSoonSub",
  urgent: "sevUrgentSub",
};

const VERDICT_STYLE: Record<Verdict, { border: string; text: string; bar: string; bg: string }> = {
  safe: { border: "border-signal-safe", text: "text-signal-safe", bar: "bg-signal-safe", bg: "bg-signal-safe/10" },
  caution: {
    border: "border-signal-caution",
    text: "text-signal-caution",
    bar: "bg-signal-caution",
    bg: "bg-signal-caution/10",
  },
  soon: { border: "border-signal-soon", text: "text-signal-soon", bar: "bg-signal-soon", bg: "bg-signal-soon/10" },
  urgent: {
    border: "border-signal-urgent",
    text: "text-signal-urgent",
    bar: "bg-signal-urgent",
    bg: "bg-signal-urgent/10",
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
            className={`rounded-xl border p-2 text-center transition-colors ${
              on ? `${style.border} ${style.bg}` : "border-border opacity-45"
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

  return (
    <div className="space-y-6">
      <div className={`panel border-l-4 ${style.border} p-5`}>
        <p className="stencil">{carLine}</p>
        <div className="mt-3 flex items-start gap-3">
          <Icon className={`mt-1 size-7 shrink-0 ${style.text}`} />
          <div>
            <h2 className={`text-2xl leading-tight ${style.text}`}>
              {VERDICT_DOT[result.verdict]} {t[VERDICT_KEY[result.verdict]]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t[VERDICT_SUB[result.verdict]]}</p>
            <p className="mt-3 text-lg text-foreground">{result.headline}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="stencil mb-1 flex justify-between">
            <span>{t.confidence}</span>
            <span>{result.confidence}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${result.confidence}%` }} />
          </div>
        </div>
      </div>

      <div>
        <p className="stencil mb-2">{t.severityScale}</p>
        <SeverityScale active={result.verdict} />
      </div>

      {result.mechanicNote ? (
        <div className="panel flex gap-3 p-4">
          <Wrench className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="stencil">{t.mechanicSays}</p>
            <p className="mt-1 text-sm whitespace-pre-line">{result.mechanicNote}</p>
          </div>
        </div>
      ) : null}

      {result.audioUsed && result.audioNote ? (
        <div className="panel flex gap-3 p-4">
          <Waves className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="stencil">{t.audioSounded}</p>
            <p className="mt-1 text-sm">{result.audioNote}</p>
          </div>
        </div>
      ) : null}

      {result.causes.length ? (
        <div>
          <p className="stencil mb-3">{t.likelyCauses}</p>
          <div className="grid gap-3">
            {result.causes.map((cause) => (
              <div key={cause.part} className="panel p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg">{cause.part}</h3>
                  <span className="font-display text-primary">{cause.likelihood}%</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${cause.likelihood}%` }} />
                </div>
                <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{cause.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.checks.length ? (
        <div className="panel p-5">
          <p className="stencil mb-3">{t.selfChecks}</p>
          <ul className="space-y-2 text-sm">
            {result.checks.map((check) => (
              <li key={check} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {check}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="panel p-5">
          <p className="stencil mb-2">{t.recommendation}</p>
          <p className="text-sm whitespace-pre-line">{result.advice}</p>
        </div>
        <div className="panel p-5">
          <p className="stencil mb-2">{t.estimatedCost}</p>
          <p className="font-display text-2xl text-primary">{result.estimatedCost}</p>
        </div>
      </div>

      {secondOpinion ? (
        <div className="panel border-l-4 border-primary p-5">
          <p className="stencil">{t.secondOpinionTitle}</p>
          <p className="mt-2 text-sm whitespace-pre-line">{secondOpinion.summary}</p>

          {secondOpinion.alternatives.length ? (
            <div className="mt-4 space-y-3">
              <p className="stencil">{t.altCauses}</p>
              {secondOpinion.alternatives.map((alt) => (
                <div key={alt.part} className="rounded-xl border border-border p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-semibold">{alt.part}</h4>
                    <span className="text-sm text-primary">{alt.likelihood}%</span>
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
              <p className="mt-1 text-sm whitespace-pre-line">{secondOpinion.extra}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{t.reportDisclaimer}</p>
    </div>
  );
}
