/**
 * Browser-side helpers that turn an uploaded video into something the AI can
 * actually analyse: a still frame (smoke, leaks, warning lamps) and a real WAV
 * audio track (does the engine sound normal for this car?).
 */

export type MediaPart = { base64: string; mediaType: string };

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      resolve(value.slice(value.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(blob);
  });
}

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

const RATE = 16000;
const MAX_SECONDS = 40;

/** Decodes the audio track of any media file and returns a 16 kHz mono WAV. */
export async function extractAudio(file: Blob): Promise<MediaPart | null> {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    await ctx.close();
    if (!decoded.length) return null;

    const seconds = Math.min(decoded.duration, MAX_SECONDS);
    const offline = new OfflineAudioContext(1, Math.ceil(seconds * RATE), RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const data = rendered.getChannelData(0);

    // Silent track (a video filmed with the mic muted) is not worth uploading.
    let peak = 0;
    for (let i = 0; i < data.length; i += 97) peak = Math.max(peak, Math.abs(data[i] ?? 0));
    if (peak < 0.005) return null;

    const wav = encodeWav(data, RATE);
    return { base64: await blobToBase64(wav), mediaType: "audio/wav" };
  } catch {
    return null;
  }
}

/** Grabs a representative still frame from a video file as a JPEG. */
export function extractFrame(file: Blob): Promise<MediaPart | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    const done = (value: MediaPart | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    const timer = window.setTimeout(() => done(null), 12000);

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.8, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      try {
        const scale = Math.min(1, 900 / Math.max(video.videoWidth, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return done(null);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        window.clearTimeout(timer);
        done({ base64: dataUrl.slice(dataUrl.indexOf(",") + 1), mediaType: "image/jpeg" });
      } catch {
        window.clearTimeout(timer);
        done(null);
      }
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      done(null);
    };
  });
}

export async function extractFromVideo(file: Blob) {
  const [frame, audio] = await Promise.all([extractFrame(file), extractAudio(file)]);
  return { frame, audio };
}
