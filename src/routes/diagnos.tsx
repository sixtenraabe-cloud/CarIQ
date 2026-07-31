import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AudioRecorder, type AudioClip } from "@/components/audio-recorder";
import { DiagnosisReport } from "@/components/diagnosis-report";
import { analyzeSymptoms, saveDiagnosis } from "@/lib/diagnose.functions";
import { carSummary, type DiagnosisResult } from "@/lib/diagnosis-types";
import { useCar } from "@/lib/car-store";
import { useAuth } from "@/hooks/use-auth";

type Search = { tag?: string };

export const Route = createFileRoute("/diagnos")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tag: typeof search.tag === "string" ? search.tag : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ny diagnos — BilHjälpen AI" },
      {
        name: "description",
        content: "Beskriv problemet, spela in ljudet och få en AI-bedömning av din bil.",
      },
      { property: "og:title", content: "Ny diagnos — BilHjälpen AI" },
      { property: "og:description", content: "Fyra snabba steg till en bedömning av bilen." },
    ],
  }),
  component: Diagnos,
});

const PROBLEMS: Record<string, string> = {
  noise: "Min bil låter konstigt",
  warning: "Varningslampa lyser",
  nostart: "Bilen fungerar inte",
  performance: "Dålig prestanda / kraft",
  brakes: "Bromsar / fjädring / styrning",
  other: "Annat problem",
};

const WHERE = ["Fram", "Bak", "Motorn", "Under bilen", "Vet inte"];
const WHEN = ["Vid start", "Vid körning", "Vid bromsning", "Vid svängning", "Hela tiden", "Annat"];

function Diagnos() {
  const { tag } = Route.useSearch();
  const navigate = useNavigate();
  const { car } = useCar();
  const { user } = useAuth();
  const analyze = useServerFn(analyzeSymptoms);
  const save = useServerFn(saveDiagnosis);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(tag ? 2 : 1);
  const [problem, setProblem] = useState(tag && PROBLEMS[tag] ? PROBLEMS[tag] : "");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [symptom, setSymptom] = useState("");
  const [clip, setClip] = useState<AudioClip | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const tags = [problem, where && `Ljud/känsla: ${where}`, when && `Uppträder: ${when}`].filter(
    Boolean,
  ) as string[];

  const description = symptom.trim() || tags.join(", ");

  const back = () => {
    if (step === 1) void navigate({ to: "/" });
    else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const run = async () => {
    if (!car) {
      toast.error("Lägg till din bil i garaget först.");
      return;
    }
    if (description.length < 3) {
      toast.error("Berätta lite om problemet först.");
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const output = await analyze({
        data: {
          car,
          tags,
          symptom: description,
          audio: clip ? { base64: clip.base64, mediaType: clip.mediaType } : null,
        },
      });
      setResult(output);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("429")
          ? "För många förfrågningar just nu — försök igen om en stund."
          : message.includes("402")
            ? "AI-krediterna är slut för den här arbetsytan."
            : "Kunde inte analysera. Försök igen.",
      );
    } finally {
      setLoading(false);
    }
  };

  const persist = async () => {
    if (!result || !car) return;
    setSaving(true);
    try {
      await save({
        data: {
          carSummary: carSummary(car),
          symptom: description,
          tags,
          hadAudio: result.audioUsed,
          result: {
            verdict: result.verdict,
            headline: result.headline,
            confidence: result.confidence,
            causes: result.causes,
            checks: result.checks,
            advice: result.advice,
            estimatedCost: result.estimatedCost,
          },
        },
      });
      setSaved(true);
      toast.success("Sparad i din historik.");
    } catch {
      toast.error("Kunde inte spara rapporten.");
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setResult(null);
    setStep(1);
    setProblem("");
    setWhere("");
    setWhen("");
    setSymptom("");
    setClip(null);
    setSaved(false);
  };

  const titles = ["Vad är problemet?", "Beskriv problemet", "Spela in ljud", "Resultat"];

  return (
    <main className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={back}
          aria-label="Tillbaka"
          className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-xl">{titles[step - 1]}</h1>
      </header>

      {step < 4 ? (
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  n <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {n}
              </span>
              {n < 4 ? (
                <span className={`h-0.5 flex-1 ${n < step ? "bg-primary" : "bg-secondary"}`} />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!car && step < 4 ? (
        <Link to="/garage" className="tile mb-5 block p-4 text-sm">
          Du har ingen bil sparad ännu — <span className="text-primary">lägg till din bil</span> för
          en mer träffsäker bedömning.
        </Link>
      ) : null}

      {step === 1 ? (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PROBLEMS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setProblem(label);
                setStep(2);
              }}
              className={`tile min-h-24 p-4 text-left text-sm font-semibold ${
                problem === label ? "border-primary bg-primary/15" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <div>
            <p className="stencil mb-2">Var kommer det ifrån?</p>
            <div className="grid grid-cols-2 gap-2">
              {WHERE.map((option) => (
                <Chip key={option} active={where === option} onClick={() => setWhere(option)}>
                  {option}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="stencil mb-2">När märks det?</p>
            <div className="grid grid-cols-3 gap-2">
              {WHEN.map((option) => (
                <Chip key={option} active={when === option} onClick={() => setWhen(option)}>
                  {option}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="stencil mb-2">Beskriv med egna ord</p>
            <Textarea
              rows={4}
              maxLength={2000}
              placeholder="Ett malande ljud från vänster fram som ökar med hastigheten och försvinner när jag bromsar."
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
            />
          </div>
          <Button size="lg" className="w-full" onClick={() => setStep(3)}>
            Nästa
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Spela in ljudet så tydligt du kan — 10–30 sekunder räcker. Steget är frivilligt.
          </p>
          <AudioRecorder clip={clip} onChange={setClip} />
          <Button size="lg" className="w-full" disabled={loading} onClick={() => void run()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> AI analyserar…
              </>
            ) : (
              "Analysera min bil"
            )}
          </Button>
        </div>
      ) : null}

      {step === 4 && result ? (
        <div className="space-y-5">
          <DiagnosisReport result={result} carLine={car ? carSummary(car) : "Okänd bil"} />
          <div className="grid gap-3">
            {user ? (
              <Button onClick={() => void persist()} disabled={saving || saved}>
                <Save className="size-4" />
                {saved ? "Sparad" : saving ? "Sparar…" : "Spara i historik"}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">Logga in för att spara rapporten</Link>
              </Button>
            )}
            <Button variant="secondary" onClick={restart}>
              <RotateCcw className="size-4" /> Ny diagnos
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}