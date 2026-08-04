import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, ImagePlus, Loader2, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

const TONE: Record<QuickCheck["verdict"], string> = {
  drive: "border-signal-safe text-signal-safe",
  workshop: "border-signal-caution text-signal-caution",
  stop: "border-signal-urgent text-signal-urgent",
};

const DOT: Record<QuickCheck["verdict"], string> = {
  drive: "🟢",
  workshop: "🟡",
  stop: "🔴",
};

function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      resolve(value.slice(value.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}

function QuickCheckPage() {
  const navigate = useNavigate();
  const { car } = useCar();
  const { t, lang } = useI18n();
  const check = useServerFn(quickSoundCheck);

  const [clip, setClip] = useState<AudioClip | null>(null);
  const [image, setImage] = useState<{ base64: string; mediaType: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCheck | null>(null);

  const label =
    result?.verdict === "drive"
      ? t.quickDrive
      : result?.verdict === "stop"
        ? t.quickStop
        : t.quickWorkshop;

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

  const run = async () => {
    if (!clip && !image) {
      toast.error(t.quickNeedMedia);
      return;
    }
    setLoading(true);
    try {
      const output = await check({
        data: {
          car: car ?? null,
          audio: clip ? { base64: clip.base64, mediaType: clip.mediaType } : null,
          image: image ? { base64: image.base64, mediaType: image.mediaType } : null,
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
            <p className="stencil mb-2">{t.quickPhotoLabel}</p>
            <div className="panel p-4">
              {image ? (
                <div className="space-y-3">
                  {image.mediaType.startsWith("video/") ? (
                    <video src={image.url} controls className="max-h-56 w-full rounded-lg" />
                  ) : (
                    <img
                      src={image.url}
                      alt={t.altQuickMedia}
                      className="max-h-56 w-full rounded-lg object-contain"
                    />
                  )}
                  <Button variant="ghost" onClick={() => setImage(null)}>
                    <Trash2 className="size-4" /> {t.removeImage}
                  </Button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground">
                  <ImagePlus className="size-4" />
                  {t.uploadMedia}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void pickImage(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={loading || (!clip && !image)}
            onClick={() => void run()}
          >
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
          <div className={`panel border-l-4 p-4 ${TONE[result.verdict]}`}>
            <p className="text-sm font-semibold">
              {DOT[result.verdict]} {label}
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
              setImage(null);
            }}
          >
            <RotateCcw className="size-4" /> {t.quickAgain}
          </Button>
        </div>
      )}
    </main>
  );
}