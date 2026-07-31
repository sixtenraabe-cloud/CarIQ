import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setRecording(false);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const mediaType = (recorder.mimeType || "audio/webm").split(";")[0] ?? "audio/webm";
        onChange({
          base64: await toBase64(blob),
          mediaType,
          url: URL.createObjectURL(blob),
          label: "Recorded clip",
        });
      };
      recorderRef.current = recorder;
      setSeconds(0);
      recorder.start();
      setRecording(true);
    } catch {
      setError("Mikrofonen blockerades. Du kan ladda upp en inspelning istället.");
    }
  };

  const onUpload = async (file: File) => {
    setError(null);
    if (file.size > 6_000_000) {
      setError("Filen är för stor — håll klippet under cirka 6 MB.");
      return;
    }
    onChange({
      base64: await toBase64(file),
      mediaType: file.type || "audio/mpeg",
      url: URL.createObjectURL(file),
      label: file.name,
    });
  };

  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <Button type="button" variant="destructive" onClick={stop}>
            <Square className="size-4" /> Stoppa ({seconds}s)
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={start}>
            <Mic className="size-4" /> Spela in ljudet
          </Button>
        )}

        <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <Upload className="size-4" />
          Ladda upp ljudfil
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </label>

        {clip ? (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            <Trash2 className="size-4" /> Ta bort
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