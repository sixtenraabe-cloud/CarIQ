export type MediaInput = { base64: string; mediaType: string };

const AUDIO_FORMAT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/aac": "aac",
  "audio/flac": "flac",
};

type Block = Record<string, unknown>;

export function mediaBlock(media: MediaInput): Block | null {
  const type = media.mediaType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type.startsWith("audio/")) {
    const format = AUDIO_FORMAT[type] ?? "webm";
    return { type: "input_audio", input_audio: { data: media.base64, format } };
  }
  if (type.startsWith("image/") || type.startsWith("video/")) {
    return { type: "image_url", image_url: { url: `data:${type};base64,${media.base64}` } };
  }
  return null;
}

/**
 * Calls the Lovable AI Gateway chat-completions endpoint directly so we can send
 * recorded audio (webm/m4a) and video, which the AI SDK message converter rejects.
 */
export async function generateWithMedia(options: {
  system: string;
  text: string;
  media: (MediaInput | null | undefined)[];
  model?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured yet.");

  const content: Block[] = [{ type: "text", text: options.text }];
  for (const item of options.media) {
    if (!item) continue;
    const block = mediaBlock(item);
    if (block) content.push(block);
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: options.system },
        { role: "user", content },
      ],
    }),
    signal: options.signal ?? null,
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 402) throw new Error("AI_CREDITS");
    throw new Error(`AI_ERROR_${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((part) =>
        typeof part === "string" ? part : ((part as { text?: string })?.text ?? ""),
      )
      .join("");
  }
  return "";
}
