import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioRecorder, type AudioClip } from "@/components/audio-recorder";
import { DiagnosisReport } from "@/components/diagnosis-report";
import { analyzeSymptoms, saveDiagnosis } from "@/lib/diagnose.functions";
import { carSummary, type CarProfile, type DiagnosisResult } from "@/lib/diagnosis-types";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kliktest — AI car symptom checker for weird noises" },
      {
        name: "description",
        content:
          "Describe or record the noise your car makes and get an instant AI read on what might be wrong and whether it is safe to drive.",
      },
      { property: "og:title", content: "Kliktest — AI car symptom checker" },
      {
        property: "og:description",
        content:
          "Record the sound, answer a few questions about your car, and find out if you should drive on or head to a mechanic.",
      },
    ],
  }),
  component: Index,
});

const TRANSMISSIONS = ["Manual", "Automatic", "DSG / dual clutch", "CVT"];
const FUELS = ["Petrol", "Diesel", "Hybrid", "Electric"];
const TAGS = [
  "It sounds weird",
  "It drives weird",
  "Squealing from the front",
  "Squealing from the rear",
  "Knocking / ticking engine",
  "Vibration at speed",
  "Grinding when braking",
  "Clunk over bumps",
  "Whining when turning",
  "Smoke or smell",
  "Warning light on",
  "Hard or jerky gear shifts",
];

const EMPTY_CAR = {
  make: "",
  model: "",
  year: "",
  transmission: "Manual",
  fuel: "Petrol",
  mileageKm: "",
};

function Index() {
  const { user } = useAuth();
  const analyze = useServerFn(analyzeSymptoms);
  const save = useServerFn(saveDiagnosis);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [car, setCar] = useState({ ...EMPTY_CAR });
  const [tags, setTags] = useState<string[]>([]);
  const [symptom, setSymptom] = useState("");
  const [clip, setClip] = useState<AudioClip | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const carValid =
    car.make.trim() && car.model.trim() && Number(car.year) >= 1950 && car.mileageKm !== "";

  const profile: CarProfile = {
    make: car.make.trim(),
    model: car.model.trim(),
    year: Number(car.year),
    transmission: car.transmission,
    fuel: car.fuel,
    mileageKm: Number(car.mileageKm),
  };

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );

  const runAnalysis = async () => {
    if (symptom.trim().length < 3 && tags.length === 0) {
      toast.error("Tell me a bit about the problem first.");
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const output = await analyze({
        data: {
          car: profile,
          tags,
          symptom: symptom.trim() || tags.join(", "),
          audio: clip ? { base64: clip.base64, mediaType: clip.mediaType } : null,
        },
      });
      setResult(output);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(
        message.includes("429")
          ? "Too many requests right now — try again in a moment."
          : message.includes("402")
            ? "The AI usage limit was reached for this workspace."
            : "Could not analyse that. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const persist = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await save({
        data: {
          carSummary: carSummary(profile),
          symptom: symptom.trim() || tags.join(", "),
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
      toast.success("Saved to your history.");
    } catch {
      toast.error("Could not save this report.");
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setResult(null);
    setStep(1);
    setClip(null);
    setSymptom("");
    setTags([]);
    setSaved(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {step !== 3 ? (
        <section className="mb-10">
          <p className="stencil">Remote triage · step {step} of 2</p>
          <h1 className="mt-2 text-4xl leading-[0.95] sm:text-6xl">
            Something sounds off?
            <br />
            <span className="text-primary">Let's listen to it.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Answer a few questions about your car, describe or record the noise, and get a plain
            language read on what is probably wrong — and whether it is safe to keep driving.
          </p>
        </section>
      ) : null}

      {step === 1 ? (
        <div className="panel space-y-5 p-6">
          <p className="stencil">Your car</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="Volvo"
                maxLength={40}
                value={car.make}
                onChange={(e) => setCar({ ...car, make: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="V70"
                maxLength={40}
                value={car.model}
                onChange={(e) => setCar({ ...car, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2014"
                value={car.year}
                onChange={(e) => setCar({ ...car, year: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="184000"
                value={car.mileageKm}
                onChange={(e) => setCar({ ...car, mileageKm: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Transmission</Label>
            <div className="flex flex-wrap gap-2">
              {TRANSMISSIONS.map((option) => (
                <ChipButton
                  key={option}
                  active={car.transmission === option}
                  onClick={() => setCar({ ...car, transmission: option })}
                >
                  {option}
                </ChipButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fuel</Label>
            <div className="flex flex-wrap gap-2">
              {FUELS.map((option) => (
                <ChipButton
                  key={option}
                  active={car.fuel === option}
                  onClick={() => setCar({ ...car, fuel: option })}
                >
                  {option}
                </ChipButton>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!carValid}
            onClick={() => setStep(2)}
          >
            Next — describe the problem
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <div className="panel p-6">
            <p className="stencil">{carSummary(profile)}</p>
            <button
              onClick={() => setStep(1)}
              className="mt-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              Change car details
            </button>
          </div>

          <div className="panel space-y-4 p-6">
            <p className="stencil">What is it doing?</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <ChipButton key={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                  {tag}
                </ChipButton>
              ))}
            </div>
            <Textarea
              rows={5}
              maxLength={2000}
              placeholder="A high pitched squeak from the front right wheel that gets faster as I speed up, and disappears when I brake."
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
            />
          </div>

          <AudioRecorder clip={clip} onChange={setClip} />

          <Button size="lg" className="w-full" disabled={loading} onClick={() => void runAnalysis()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Listening and comparing…
              </>
            ) : (
              "Analyse my car"
            )}
          </Button>
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-6">
          <DiagnosisReport result={result} carLine={carSummary(profile)} />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={restart}>
              <RotateCcw className="size-4" /> New diagnosis
            </Button>
            {user ? (
              <Button onClick={() => void persist()} disabled={saving || saved}>
                <Save className="size-4" />
                {saved ? "Saved" : saving ? "Saving…" : "Save to history"}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">Sign in to save this report</Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ChipButton({
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
      className={`border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
