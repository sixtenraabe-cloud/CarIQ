import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, ImagePlus, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AudioRecorder, type AudioClip } from "@/components/audio-recorder";
import { DiagnosisReport } from "@/components/diagnosis-report";
import { CarSilhouette } from "@/components/car-silhouette";
import { analyzeSymptoms, saveDiagnosis } from "@/lib/diagnose.functions";
import { carSummary, type DiagnosisResult } from "@/lib/diagnosis-types";
import { useCar } from "@/lib/car-store";
import { useAuth } from "@/hooks/use-auth";
import { currencyFor, useI18n } from "@/lib/i18n";

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

type ImageFile = { base64: string; mediaType: string; url: string };

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}

function Diagnos() {
  const { tag } = Route.useSearch();
  const navigate = useNavigate();
  const { car } = useCar();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const analyze = useServerFn(analyzeSymptoms);
  const save = useServerFn(saveDiagnosis);

  const PROBLEMS: { key: string; label: string }[] = [
    { key: "noise", label: t.aNoise },
    { key: "warning", label: t.aWarning },
    { key: "nostart", label: t.aNostart },
    { key: "performance", label: t.aPerf },
    { key: "brakes", label: t.aBrakes },
    { key: "other", label: t.aOther },
  ];
  const WHERE = [t.front, t.rear, t.engine, t.under, t.dontKnow];
  const WHEN = [t.atStart, t.whileDriving, t.whenBraking, t.whenTurning, t.always, t.other];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(tag ? 2 : 1);
  const [problemKey, setProblemKey] = useState(tag ?? "");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [symptom, setSymptom] = useState("");
  const [clip, setClip] = useState<AudioClip | null>(null);
  const [image, setImage] = useState<ImageFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const isLamp = problemKey === "warning";
  const problem = PROBLEMS.find((p) => p.key === problemKey)?.label ?? "";

  const tags = [
    problem,
    !isLamp && where ? `${t.whereFrom} ${where}` : "",
    when ? `${t.whenNoticed} ${when}` : "",
    isLamp && image ? "Photo of warning light attached" : "",
  ].filter(Boolean) as string[];

  const description = symptom.trim() || tags.join(", ");

  const back = () => {
    if (step === 1) void navigate({ to: "/" });
    else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const run = async () => {
    if (!car) {
      toast.error(t.needCar);
      return;
    }
    if (description.length < 3) {
      toast.error(t.needDescription);
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
          image: image ? { base64: image.base64, mediaType: image.mediaType } : null,
          language: lang,
          currency: currencyFor(lang).currencyName,
        },
      });
      setResult(output);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("429") ? t.errRate : message.includes("402") ? t.errCredits : t.errGeneric,
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
      toast.success(t.savedToast);
    } catch {
      toast.error(t.errSave);
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setResult(null);
    setStep(1);
    setProblemKey("");
    setWhere("");
    setWhen("");
    setSymptom("");
    setClip(null);
    setImage(null);
    setSaved(false);
  };

  const titles = [t.step1, t.step2, t.step3, t.step4];

  const pickImage = async (file: File) => {
    if (file.size > 6_000_000) {
      toast.error("Max 6 MB");
      return;
    }
    setImage({
      base64: await toBase64(file),
      mediaType: file.type || "image/jpeg",
      url: URL.createObjectURL(file),
    });
  };

  return (
    <main className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={back}
          aria-label={t.back}
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
          {t.noCarYet} <span className="text-primary">{t.addCarLink}</span> {t.noCarYetEnd}
        </Link>
      ) : null}

      {car && step < 4 ? (
        <div className="panel mb-5 flex items-center gap-4 p-3">
          <CarSilhouette model={car.model} className="w-24 shrink-0" />
          <div className="min-w-0">
            <p className="stencil">{t.myCar}</p>
            <p className="truncate text-sm">
              {car.make} {car.model} · {car.year}
            </p>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid grid-cols-2 gap-3">
          {PROBLEMS.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                setProblemKey(option.key);
                setStep(2);
              }}
              className={`tile min-h-24 p-4 text-left text-sm font-semibold ${
                problemKey === option.key ? "border-primary bg-primary/15" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          {isLamp ? (
            <div>
              <p className="stencil mb-2">{t.lampPhoto}</p>
              <div className="panel p-4">
                {image ? (
                  <div className="space-y-3">
                    <img
                      src={image.url}
                      alt={t.lampPhoto}
                      className="max-h-56 w-full rounded-lg object-contain"
                    />
                    <Button variant="ghost" onClick={() => setImage(null)}>
                      <Trash2 className="size-4" /> {t.removeImage}
                    </Button>
                  </div>
                ) : (
                  <>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                      <ImagePlus className="size-4" />
                      {t.uploadImage}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void pickImage(file);
                        }}
                      />
                    </label>
                    <p className="mt-3 text-sm text-muted-foreground">{t.lampPhotoHint}</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="stencil mb-2">{t.whereFrom}</p>
              <div className="grid grid-cols-2 gap-2">
                {WHERE.map((option) => (
                  <Chip key={option} active={where === option} onClick={() => setWhere(option)}>
                    {option}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="stencil mb-2">{t.whenNoticed}</p>
            <div className="grid grid-cols-3 gap-2">
              {WHEN.map((option) => (
                <Chip key={option} active={when === option} onClick={() => setWhen(option)}>
                  {option}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="stencil mb-2">{isLamp ? t.lampDescribe : t.describeOwnWords}</p>
            <Textarea
              rows={4}
              maxLength={2000}
              placeholder={isLamp ? t.lampPlaceholder : t.describePlaceholder}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
            />
          </div>

          <Button size="lg" className="w-full" onClick={() => setStep(3)}>
            {t.next}
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">{t.audioHint}</p>
          <AudioRecorder clip={clip} onChange={setClip} />
          <Button size="lg" className="w-full" disabled={loading} onClick={() => void run()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t.analyzing}
              </>
            ) : (
              t.analyze
            )}
          </Button>
          {!clip ? (
            <Button
              variant="secondary"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setClip(null);
                void run();
              }}
            >
              {t.noAudio}
            </Button>
          ) : null}
        </div>
      ) : null}

      {step === 4 && result ? (
        <div className="space-y-5">
          <DiagnosisReport result={result} carLine={car ? carSummary(car) : ""} />
          <div className="grid gap-3">
            {user ? (
              <Button onClick={() => void persist()} disabled={saving || saved}>
                <Save className="size-4" />
                {saved ? t.saved : saving ? t.saving : t.saveHistory}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">{t.loginToSave}</Link>
              </Button>
            )}
            <Button variant="secondary" onClick={restart}>
              <RotateCcw className="size-4" /> {t.newDiagnosis}
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
