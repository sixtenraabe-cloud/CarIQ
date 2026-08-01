import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AudioRecorder, type AudioClip } from "@/components/audio-recorder";
import { quickSoundCheck, type QuickCheck } from "@/lib/diagnose.functions";
import { useCar } from "@/lib/car-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/snabbkoll")({
  head: () => ({
    meta: [
      { title: "Snabbkoll — låter bilen normal? | CarIQ" },
      {
        name: "description",
        content:
          "Spela in ett kort ljud och få direkt besked om bilen låter normal — gå vidare till en hel analys om du vill.",
      },
      { property: "og:title", content: "Snabbkoll — låter bilen normal?" },
      {
        property: "og:description",
        content: "Tio sekunders ljud, direkt svar från AI-mekanikern.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuickCheckPage,
});

const TONE: Record<QuickCheck["sounds"], string> = {
  normal: "border-signal-safe text-signal-safe",
  unsure: "border-signal-caution text-signal-caution",
  attention: "border-signal-urgent text-signal-urgent",
};

const DOT: Record<QuickCheck["sounds"], string> = {
  normal: "🟢",
  unsure: "🟡",
  attention: "🟠",
};

function QuickCheckPage() {
  const navigate = useNavigate();
  const { car } = useCar();
  const { t, lang } = useI18n();
  const check = useServerFn(quickSoundCheck);

  const [clip, setClip] = useState<AudioClip | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheck | null>(null);

  const label =
    result?.sounds === "normal"
      ? t.quickNormal
      : result?.sounds === "attention"
        ? t.quickAttention
        : t.quickUnsure;

  const run = async () => {
    if (!clip) {
      toast.error(t.quickNeedAudio);
      return;
    }
    setLoading(true);
    try {
      const output = await check({
        data: {
          car: car ?? null,
          note: note.trim(),
          audio: { base64: clip.base64, mediaType: clip.mediaType },
          language: lang,
        },
      });
      setResult(output);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.includes("TIMEOUT") ? t.errTimeout : t.quickError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={() => void navigate({ to: "/" })}
          aria-label={t.back}
          className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-xl">{t.quickTitle}</h1>
          <p className="text-xs text-muted-foreground">{t.quickSub}</p>
        </div>
      </header>

      {!result ? (
        <div className="space-y-5">
          <AudioRecorder clip={clip} onChange={setClip} />

          <div>
            <p className="stencil mb-2">{t.quickNoteLabel}</p>
            <Textarea
              rows={3}
              maxLength={500}
              placeholder={t.quickNotePlaceholder}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <Button size="lg" className="w-full" disabled={loading || !clip} onClick={() => void run()}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t.quickChecking}
              </>
            ) : (
              t.quickRun
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className={`panel border-l-4 p-4 ${TONE[result.sounds]}`}>
            <p className="text-sm font-semibold">
              {DOT[result.sounds]} {label}
            </p>
            {result.headline ? (
              <p className="mt-1 text-lg font-bold text-foreground">{result.headline}</p>
            ) : null}
            <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{result.note}</p>
          </div>

          <div className="tile p-4">
            <p className="font-semibold">{t.quickDeeper}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.quickDeeperSub}</p>
            <Button asChild className="mt-3 w-full">
              <Link to="/diagnos" search={{ tag: "noise" }}>
                <Sparkles className="size-4" /> {t.quickFull}
              </Link>
            </Button>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setResult(null);
              setClip(null);
              setNote("");
            }}
          >
            <RotateCcw className="size-4" /> {t.quickAgain}
          </Button>
        </div>
      )}
    </main>
  );
}