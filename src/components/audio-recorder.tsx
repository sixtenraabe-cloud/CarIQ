import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { encodeWav, extractAudio } from "@/lib/media-extract";

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
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

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

  useEffect(() => () => stopRef.current?.(), []);

  const stop = () => {
    stopRef.current?.();
    setRecording(false);
  };

  const start = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t.micBlocked);
        return;
      }
      // Motorljud är brus — stäng av telefonens brusreducering/AGC, annars
      // filtreras exakt det vi vill spela in bort och klippet blir tyst.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        } as MediaTrackConstraints,
      });

      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        stream.getTracks().forEach((track) => track.stop());
        setError(t.micBlocked);
        return;
      }

      const ctx = new AudioCtx();
      await ctx.resume().catch(() => undefined);
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      let total = 0;

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(input));
        total += input.length;
        let peak = 0;
        for (let i = 0; i < input.length; i += 16) peak = Math.max(peak, Math.abs(input[i] ?? 0));
        setLevel(peak);
      };

      // Tyst destination så processorn körs utan att ljudet spelas tillbaka.
      const mute = ctx.createGain();
      mute.gain.value = 0;
      source.connect(processor);
      processor.connect(mute);
      mute.connect(ctx.destination);

      stopRef.current = () => {
        stopRef.current = null;
        processor.onaudioprocess = null;
        processor.disconnect();
        source.disconnect();
        mute.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        setLevel(0);

        const sampleRate = ctx.sampleRate;
        void ctx.close().catch(() => undefined);

        if (total < sampleRate * 0.3) {
          setError("Inspelningen blev för kort — håll in i minst någon sekund.");
          return;
        }

        const merged = new Float32Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }

        // Normalisera upp svaga inspelningar (telefonmick långt från motorn).
        let peak = 0;
        for (let i = 0; i < merged.length; i += 7) peak = Math.max(peak, Math.abs(merged[i] ?? 0));
        if (peak < 0.002) {
          setError("Nästan inget ljud fångades — flytta mikrofonen närmare och testa igen.");
          return;
        }
        const gain = Math.min(12, 0.92 / peak);
        if (gain > 1) for (let i = 0; i < merged.length; i += 1) merged[i] = (merged[i] ?? 0) * gain;

        const blob = encodeWav(merged, sampleRate);
        void toBase64(blob)
          .then((base64) =>
            onChange({
              base64,
              mediaType: "audio/wav",
              url: URL.createObjectURL(blob),
              label: "Recorded clip",
            }),
          )
          .catch(() => setError("Kunde inte spara inspelningen — försök igen."));
      };

      setSeconds(0);
      setRecording(true);
    } catch {
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
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-75"
              style={{ width: `${Math.min(100, Math.round(level * 220))}%` }}
            />
          </div>
          <p className="text-sm text-primary">
            {level < 0.02
              ? "Nästan inget ljud — håll mikrofonen närmare ljudkällan."
              : "Spelar in… håll telefonen nära ljudet, gasa eller rulla om det går säkert."}
          </p>
        </div>
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