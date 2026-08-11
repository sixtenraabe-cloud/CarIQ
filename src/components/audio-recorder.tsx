import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { extractAudio } from "@/lib/media-extract";

export type AudioClip = { base64: string; mediaType: string; url: string; label: string };

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Kunde inte läsa ljudfilen"));
    reader.readAsDataURL(blob);
  });
}

export function AudioRecorder({
  clip,
  onChange,
}: {
  clip: AudioClip | null;
  onChange: (clip: AudioClip | null) => void;
}) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const pickFile = async (file: File) => {
    setError(null);
    try {
      const converted = await extractAudio(file);
      if (converted) {
        onChange({
          base64: converted.base64,
          mediaType: converted.mediaType,
          url: URL.createObjectURL(file),
          label: file.name,
        });
        return;
      }
      onChange({
        base64: await toBase64(file),
        mediaType: file.type || "audio/mpeg",
        url: URL.createObjectURL(file),
        label: file.name,
      });
    } catch {
      setError("Kunde inte läsa ljudfilen — testa en annan.");
    }
  };

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const start = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError(t.micBlocked);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ].find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size === 0) {
          setError("Ingen ljuddata spelades in — försök igen.");
          return;
        }
        const mediaType = (recorder.mimeType || "audio/webm").split(";")[0] ?? "audio/webm";
        try {
          onChange({
            base64: await toBase64(blob),
            mediaType,
            url: URL.createObjectURL(blob),
            label: "Recorded clip",
          });
        } catch {
          setError("Kunde inte spara inspelningen — försök igen.");
        }
      };
      recorderRef.current = recorder;
      setSeconds(0);
      recorder.start(1000);
      setRecording(true);
    } catch (err) {
      setError(t.micBlocked);
    }
  };

  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <Button type="button" variant="destructive" onClick={stop}>
            <Square className="size-4" /> {t.stopRecording} ({seconds}s)
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={() => void start()}>
              <Mic className="size-4" /> {t.recordSound}
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:text-foreground">
              <Upload className="size-4" />
              {t.uploadAudio}
              <input
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void pickFile(file);
                  event.target.value = "";
                }}
              />
            </label>
          </>
        )}

        {clip ? (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            <Trash2 className="size-4" /> {t.remove}
          </Button>
        ) : null}
      </div>

      {recording ? (
        <p className="mt-3 text-sm text-primary">
          Spelar in… håll telefonen nära ljudet, gasa eller rulla om det går säkert.
        </p>
      ) : null}

      {clip ? (
        <div className="mt-3">
          <p className="stencil mb-2">{clip.label}</p>
          <audio controls src={clip.url} className="w-full" />
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Frivilligt, men ett 5–15 sekunders klipp gör analysen betydligt mer träffsäker.
        </p>
      )}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}