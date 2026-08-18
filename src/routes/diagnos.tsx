import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, ImagePlus, Loader2, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { DiagnosisReport } from "@/components/diagnosis-report";
import { MechanicChat } from "@/components/mechanic-chat";
import { CarSilhouette } from "@/components/car-silhouette";
import { BrandLogo } from "@/components/brand-logo";
import { CarDiagram, type ZoneKey } from "@/components/car-diagram";
import {
  COMBUSTION_ONLY,
  COMMON_LAMPS,
  LampGlyph,
  MORE_LAMPS,
  RED_LAMPS,
  type LampKey,
} from "@/components/warning-lamps";
import { analyzeSymptoms, saveDiagnosis, secondOpinion } from "@/lib/diagnose.functions";
import { knownIssues } from "@/lib/issues.functions";
import { extractFromVideo } from "@/lib/media-extract";
import { carSummary, type DiagnosisResult, type SecondOpinion } from "@/lib/diagnosis-types";
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
      { title: "Ny diagnos — CarIQ" },
      {
        name: "description",
        content: "Beskriv problemet och få en mekanikers AI-bedömning av din bil.",
      },
      { property: "og:title", content: "Ny diagnos — CarIQ" },
      { property: "og:description", content: "Fyra snabba steg till en bedömning av bilen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://cariq-test.lovable.app/diagnos" },
    ],
    links: [{ rel: "canonical", href: "https://cariq-test.lovable.app/diagnos" }],
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
  const askSecond = useServerFn(secondOpinion);
  const fetchIssues = useServerFn(knownIssues);

  const PROBLEMS: { key: string; label: string }[] = [
    { key: "noise", label: t.aNoise },
    { key: "warning", label: t.aWarning },
    { key: "nostart", label: t.aNostart },
    { key: "performance", label: t.aPerf },
    { key: "brakes", label: t.aBrakes },
    { key: "other", label: t.aOther },
  ];
  const WHEN = [t.atStart, t.whileDriving, t.whenBraking, t.whenTurning, t.always, t.other];

  const [step, setStep] = useState<1 | 2 | 3>(tag ? 2 : 1);
  const [problemKey, setProblemKey] = useState(tag ?? "");
  const [zone, setZone] = useState<ZoneKey | "">("");
  const [when, setWhen] = useState("");
  const [symptom, setSymptom] = useState("");
  
  const [image, setImage] = useState<ImageFile | null>(null);
  const [fromVideo, setFromVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [second, setSecond] = useState<SecondOpinion | null>(null);
  const [secondLoading, setSecondLoading] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesDismissed, setIssuesDismissed] = useState(false);
  const [pickedIssues, setPickedIssues] = useState<string[]>([]);
  const [lamp, setLamp] = useState<LampKey | "">("");
  const [lampMore, setLampMore] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaNote, setMediaNote] = useState("");

  const isLamp = problemKey === "warning";
  const isPerf = problemKey === "performance";
  const showWhere = !isLamp && !isPerf;
  const problem = PROBLEMS.find((p) => p.key === problemKey)?.label ?? "";
  const isEv = /^(el|electric|elektro|elbil)/i.test(car?.fuel ?? "");
  const lampAllowed = (key: LampKey) => !(isEv && COMBUSTION_ONLY.includes(key));
  const lampLabel = lamp ? t.lamps[lamp] : "";

  // Known faults for exactly this make/model, offered as one-tap choices.
  useEffect(() => {
    if (step !== 2 || isLamp || !car || issues.length || issuesLoading) return;
    let active = true;
    setIssuesLoading(true);
    void fetchIssues({
      data: {
        make: car.make,
        model: car.model,
        variant: car.variant ?? "",
        year: car.year,
        fuel: car.fuel,
        mileageKm: car.mileageKm,
        category: problem,
        language: lang,
      },
    })
      .then((output) => {
        if (active) setIssues(output.issues);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIssuesLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, car?.make, car?.model, problemKey, lang]);

  // Always land at the top of the report so the verdict is the first thing seen.
  useEffect(() => {
    if (step !== 3 || !result) return;
    let frames = 0;
    let raf = 0;
    const toTop = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (++frames < 20) raf = requestAnimationFrame(toTop);
    };
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    toTop();
    return () => cancelAnimationFrame(raf);
  }, [step, result]);

  const zoneLabel =
    zone === "front"
      ? t.front
      : zone === "engine"
        ? t.engine
        : zone === "rear"
          ? t.rear
          : zone === "under"
            ? t.under
            : zone === "unknown"
              ? t.dontKnow
              : "";

  const chips = [
    problem,
    lampLabel ? `${t.lampPickTitle.replace("?", "")}: ${lampLabel}` : "",
    showWhere && zoneLabel ? `${t.whereFrom} ${zoneLabel}` : "",
    when ? `${t.whenNoticed} ${when}` : "",
    isLamp && image ? t.lampPhoto : "",
    ...pickedIssues,
  ].filter(Boolean) as string[];

  const tags = chips;
  const description =
    [
      lampLabel ? `${t.lampPickTitle.replace("?", "")}: ${lampLabel}` : "",
      !isLamp ? symptom.trim() : "",
      ...pickedIssues,
    ]
      .filter(Boolean)
      .join(". ") || tags.join(", ");

  const back = () => {
    if (step === 1) void navigate({ to: "/" });
    else setStep((s) => (s - 1) as 1 | 2);
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
    setSecond(null);
    try {
      const output = await analyze({
        data: {
          car,
          tags,
          symptom: description,
          image: image ? { base64: image.base64, mediaType: image.mediaType } : null,
          fromVideo,
          language: lang,
          currency: currencyFor(lang).currencyName,
        },
      });
      setResult(output);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("TIMEOUT")
          ? t.errTimeout
          : message.includes("429") || message.includes("RATE_LIMITED")
            ? t.errRate
            : message.includes("402") || message.includes("AI_CREDITS")
              ? t.errCredits
              : t.errGeneric,
      );
    } finally {
      setLoading(false);
    }
  };

  const getSecond = async () => {
    if (!result || !car) return;
    setSecondLoading(true);
    try {
      const output = await askSecond({
        data: {
          car,
          tags,
          symptom: description,
          language: lang,
          currency: currencyFor(lang).currencyName,
          first: {
            verdict: result.verdict,
            headline: result.headline,
            confidence: result.confidence,
            mechanicNote: result.mechanicNote,
            causes: result.causes,
            checks: result.checks,
            advice: result.advice,
            estimatedCost: result.estimatedCost,
          },
        },
      });
      setSecond(output);
    } catch {
      toast.error(t.errSecond);
    } finally {
      setSecondLoading(false);
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
            mechanicNote: result.mechanicNote,
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
    setSecond(null);
    setStep(1);
    setProblemKey("");
    setZone("");
    setWhen("");
    setSymptom("");
    setImage(null);
    setFromVideo(false);
    setMediaNote("");
    setPickedIssues([]);
    setIssues([]);
    setLamp("");
    setLampMore(false);
    setSaved(false);
  };

  const titles = [t.step1, t.step2, t.step3];

  const pickImage = async (file: File) => {
    const isVideo = (file.type || "").startsWith("video/");
    if (!isVideo && file.size > 6_000_000) {
      toast.error("Max 6 MB");
      return;
    }
    if (!isVideo) {
      setFromVideo(false);
      setMediaNote("");
      setImage({
        base64: await toBase64(file),
        mediaType: file.type || "image/jpeg",
        url: URL.createObjectURL(file),
      });
      return;
    }

    // Video: pull out a still frame (smoke, leaks, lamps) and the real audio
    // track so the mechanic can judge how the car actually sounds.
    setMediaBusy(true);
    setMediaNote(t.videoReading);
    try {
      const { frame } = await extractFromVideo(file);
      const url = URL.createObjectURL(file);
      if (frame) {
        setImage({ base64: frame.base64, mediaType: "image/jpeg", url });
      } else {
        setImage(null);
      }
      if (!frame) {
        setMediaNote("");
        toast.error(t.errGeneric);
        return;
      }
      setFromVideo(true);
      setMediaNote(t.videoNoAudio);
    } finally {
      setMediaBusy(false);
    }
  };

  return (
    <main className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        {step < 3 ? (
          <button
            onClick={back}
            aria-label={t.back}
            className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        <h1 className="text-xl">{titles[step - 1]}</h1>
      </header>

      {step < 3 ? (
        <div className="mb-5 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  n <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {n}
              </span>
              {n < 3 ? (
                <span className={`h-0.5 flex-1 rounded-full ${n < step ? "bg-primary" : "bg-secondary"}`} />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {chips.length && step > 1 && step < 3 ? (
        <div className="mb-5">
          <p className="stencil mb-2">{t.yourChoice}</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {!car && step < 3 ? (
        <Link to="/garage" className="tile mb-5 block p-4 text-sm">
          {t.noCarYet} <span className="text-primary">{t.addCarLink}</span> {t.noCarYetEnd}
        </Link>
      ) : null}

      {car && step < 3 ? (
        <div className="panel mb-5 flex items-center gap-4 p-3">
          <CarSilhouette make={car.make} model={car.model} className="w-28 shrink-0" />
          <div className="min-w-0">
            <p className="stencil">{t.myCar}</p>
            <p className="flex items-center gap-2 truncate text-sm">
              <BrandLogo make={car.make} size={20} />
              <span className="truncate">
                {car.make} {car.model}{car.variant ? ` ${car.variant}` : ""} · {car.year}
              </span>
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
              className={`tile min-h-24 p-4 text-left text-sm font-semibold active:scale-[0.99] ${
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
          <div>
            <p className="stencil mb-2">{isLamp ? t.lampPhoto : t.uploadMedia}</p>
              <div className="panel p-4">
                {image ? (
                  <div className="space-y-3">
                    {image.mediaType.startsWith("video/") ? (
                      <video src={image.url} controls className="max-h-56 w-full rounded-lg" />
                    ) : (
                      <img
                        src={image.url}
                        alt={t.altLampPhoto}
                        className="max-h-56 w-full rounded-lg object-contain"
                      />
                    )}
                    <Button variant="ghost" onClick={() => setImage(null)}>
                      <Trash2 className="size-4" /> {t.removeImage}
                    </Button>
                    {mediaNote ? (
                      <p className="text-xs text-muted-foreground">{mediaNote}</p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground">
                      {mediaBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4" />
                      )}
                      {mediaBusy ? t.videoReading : t.openCamera}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        capture="environment"
                        className="hidden"
                        disabled={mediaBusy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void pickImage(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <label className="ml-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground">
                      <ImagePlus className="size-4" />
                      {t.chooseFile}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        disabled={mediaBusy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void pickImage(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <p className="mt-3 text-sm text-muted-foreground">{t.lampPhotoHint}</p>
                  </>
                )}
              </div>
          </div>

          {isLamp ? (
            <div className="surface relative overflow-hidden p-4">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-14 -top-20 size-48 rounded-full bg-primary/20 blur-3xl"
              />
              <p className="stencil relative mb-1">{t.lampPickTitle}</p>
              <p className="relative mb-3 text-xs text-muted-foreground">{t.lampPickHint}</p>
              <div className="relative grid grid-cols-4 gap-2">
                {(lampMore ? [...COMMON_LAMPS, ...MORE_LAMPS] : COMMON_LAMPS)
                  .filter(lampAllowed)
                  .map((key) => {
                    const active = lamp === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLamp(active ? "" : key)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all duration-200 ${
                          active
                            ? "border-primary bg-primary/20 shadow-[0_0_18px_-4px_var(--primary)]"
                            : "border-border bg-card/60 hover:border-primary/60 hover:bg-primary/10"
                        }`}
                      >
                        <LampGlyph
                          lamp={key}
                          className={`size-8 ${
                            key === "coolant"
                              ? "text-primary"
                              : RED_LAMPS.includes(key)
                                ? "text-signal-urgent"
                                : "text-signal-caution"
                          }`}
                        />
                        <span className="text-[10px] leading-tight text-foreground/90">{t.lamps[key]}</span>
                      </button>
                    );
                  })}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!lampMore) {
                    setLamp("");
                    setLampMore(true);
                  } else {
                    setLamp("");
                    setLampMore(false);
                  }
                }}
                className="relative mt-3 rounded-full border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {lampMore ? t.lampPickOther : t.lampPickNone}
              </button>
            </div>
          ) : null}

          {car && !isLamp && !issuesDismissed && (issuesLoading || issues.length) ? (
            <div className="surface relative overflow-hidden p-4">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-14 -top-20 size-48 rounded-full bg-primary/20 blur-3xl"
              />
              <p className="stencil relative mb-1">{t.knownTitle}</p>
              <p className="relative mb-3 text-xs text-muted-foreground">
                {issuesLoading ? t.knownLoading : t.knownHint}
              </p>
              <div className="relative flex flex-wrap gap-2">
                {issues.map((issue) => {
                  const active = pickedIssues.includes(issue);
                  return (
                    <button
                      key={issue}
                      type="button"
                      onClick={() =>
                        setPickedIssues((list) =>
                          active ? list.filter((i) => i !== issue) : [...list, issue],
                        )
                      }
                      className={`rounded-full border px-3 py-2 text-left text-sm transition-all duration-200 ${
                        active
                          ? "border-primary bg-primary/20 text-foreground shadow-[0_0_18px_-4px_var(--primary)]"
                          : "border-border bg-card/60 text-foreground/90 shadow-[0_0_12px_-6px_var(--primary)] hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_16px_-4px_var(--primary)]"
                      }`}
                    >
                      {issue}
                    </button>
                  );
                })}
                {issues.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPickedIssues([]);
                      setIssuesDismissed(true);
                    }}
                    className="rounded-full border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    {t.knownNone}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showWhere ? (
            <div>
              <p className="stencil mb-2">{t.whereFrom}</p>
              <CarDiagram
                make={car?.make ?? ""}
                model={car?.model ?? ""}
                value={zone}
                onChange={setZone}
              />
            </div>
          ) : null}

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

          {!isLamp ? (
            <div>
              <p className="stencil mb-2">{t.describeOwnWords}</p>
              <p className="mb-2 text-xs text-muted-foreground">{t.describeHint}</p>
              <Textarea
                rows={5}
                maxLength={2000}
                placeholder={isPerf ? t.perfPlaceholder : t.describePlaceholder}
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
              />
            </div>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            disabled={loading || mediaBusy}
            onClick={() => void run()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t.analyzing}
              </>
            ) : (
              t.analyze
            )}
          </Button>
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-5">
          <DiagnosisReport result={result} carLine={car ? carSummary(car) : ""} secondOpinion={second} />
          {car ? <MechanicChat car={car} tags={tags} symptom={description} result={result} /> : null}
          <div className="grid gap-3">
            {!second ? (
              <Button variant="outline" disabled={secondLoading} onClick={() => void getSecond()}>
                {secondLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> {t.secondOpinionLoading}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> {t.secondOpinion}
                  </>
                )}
              </Button>
            ) : null}
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
