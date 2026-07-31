import { AlertTriangle, CheckCircle2, OctagonAlert, Waves } from "lucide-react";
import type { DiagnosisResult, Verdict } from "@/lib/diagnosis-types";
import { VERDICT_LABEL } from "@/lib/diagnosis-types";

const VERDICT_STYLE: Record<Verdict, { border: string; text: string; bar: string }> = {
  safe: { border: "border-signal-safe", text: "text-signal-safe", bar: "bg-signal-safe" },
  caution: { border: "border-signal-caution", text: "text-signal-caution", bar: "bg-signal-caution" },
  urgent: { border: "border-signal-urgent", text: "text-signal-urgent", bar: "bg-signal-urgent" },
};

const VERDICT_ICON: Record<Verdict, typeof CheckCircle2> = {
  safe: CheckCircle2,
  caution: AlertTriangle,
  urgent: OctagonAlert,
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const style = VERDICT_STYLE[verdict];
  const Icon = VERDICT_ICON[verdict];
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2 py-1 font-display text-xs tracking-widest uppercase ${style.border} ${style.text}`}
    >
      <Icon className="size-3.5" />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function DiagnosisReport({
  result,
  carLine,
}: {
  result: DiagnosisResult;
  carLine: string;
}) {
  const style = VERDICT_STYLE[result.verdict];
  const Icon = VERDICT_ICON[result.verdict];

  return (
    <div className="space-y-6">
      <div className={`panel border-l-4 ${style.border} p-6`}>
        <p className="stencil">{carLine}</p>
        <div className="mt-3 flex items-start gap-4">
          <Icon className={`mt-1 size-8 shrink-0 ${style.text}`} />
          <div>
            <h2 className={`text-3xl leading-none ${style.text}`}>{VERDICT_LABEL[result.verdict]}</h2>
            <p className="mt-2 text-lg text-foreground">{result.headline}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="stencil mb-1 flex justify-between">
            <span>Säkerhet</span>
            <span>{result.confidence}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary">
            <div className={`h-full ${style.bar}`} style={{ width: `${result.confidence}%` }} />
          </div>
        </div>
      </div>

      {result.audioUsed && result.audioNote ? (
        <div className="panel flex gap-3 p-4">
          <Waves className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="stencil">Så lät inspelningen</p>
            <p className="mt-1 text-sm">{result.audioNote}</p>
          </div>
        </div>
      ) : null}

      {result.causes.length ? (
        <div>
          <p className="stencil mb-3">Troliga orsaker</p>
          <div className="grid gap-3">
            {result.causes.map((cause) => (
              <div key={cause.part} className="panel p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg">{cause.part}</h3>
                  <span className="font-display text-primary">{cause.likelihood}%</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cause.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {result.checks.length ? (
        <div className="panel p-5">
          <p className="stencil mb-3">Kontroller du kan göra själv</p>
          <ul className="space-y-2 text-sm">
            {result.checks.map((check) => (
              <li key={check} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 bg-primary" />
                {check}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="panel p-5">
          <p className="stencil mb-2">Rekommendation</p>
          <p className="text-sm whitespace-pre-line">{result.advice}</p>
        </div>
        <div className="panel p-5">
          <p className="stencil mb-2">Ungefärlig reparationskostnad</p>
          <p className="font-display text-2xl text-primary">{result.estimatedCost}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Detta är en AI-bedömning, inte en verkstadsbesiktning. Bromsar, styrning och överhettning
        ska alltid kontrolleras av en mekaniker.
      </p>
    </div>
  );
}