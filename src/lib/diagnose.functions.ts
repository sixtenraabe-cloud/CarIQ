import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { DiagnosisResult, SecondOpinion, Verdict } from "./diagnosis-types";

const CarSchema = z.object({
  make: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(40),
  year: z.number().int().min(1950).max(2030),
  transmission: z.string().trim().min(1).max(30),
  fuel: z.string().trim().min(1).max(30),
  mileageKm: z.number().int().min(0).max(2000000),
});

const MediaSchema = z
  .object({ base64: z.string().max(9000000), mediaType: z.string().max(60) })
  .nullable()
  .default(null);

const AnalyzeSchema = z.object({
  car: CarSchema,
  tags: z.array(z.string().max(60)).max(12),
  symptom: z.string().trim().min(3).max(2000),
  audio: MediaSchema,
  image: MediaSchema,
  language: z.enum(["sv", "en", "da", "de"]).default("sv"),
  currency: z.string().max(40).default("SEK (svenska kronor)"),
});

const LANGUAGE_NAME: Record<string, string> = {
  sv: "Swedish",
  en: "English",
  da: "Danish",
  de: "German",
};

const ResultSchema = z.object({
  verdict: z.enum(["safe", "caution", "soon", "urgent"]),
  headline: z.string().max(300),
  confidence: z.number().int().min(0).max(100),
  mechanicNote: z.string().max(4000).default(""),
  causes: z
    .array(
      z.object({
        part: z.string(),
        summary: z.string().default(""),
        explanation: z.string(),
        likelihood: z.number(),
      }),
    )
    .max(8),
  checks: z.array(z.string()).max(10),
  advice: z.string().max(3000),
  estimatedCost: z.string().max(200),
});

const SaveSchema = z.object({
  carSummary: z.string().max(200),
  symptom: z.string().max(2000),
  tags: z.array(z.string().max(60)).max(12),
  hadAudio: z.boolean(),
  result: ResultSchema,
});

const SecondSchema = z.object({
  car: CarSchema,
  tags: z.array(z.string().max(60)).max(12),
  symptom: z.string().trim().min(3).max(2000),
  language: z.enum(["sv", "en", "da", "de"]).default("sv"),
  currency: z.string().max(40).default("SEK (svenska kronor)"),
  first: ResultSchema,
});

const SYSTEM_PROMPT = `You are a veteran master mechanic with 25 years in the workshop, talking directly to a car owner who is not technical. You are NOT a robot: you speak like a mechanic wiping his hands on a rag, plain and concrete.

How you write:
- Explain WHY you think what you think. Tie the symptom to the specific car: engine family, known weak spots, typical mileage for that failure ("a BMW E92 with the N52 often ticks like this cold because the hydraulic lifters bleed down overnight").
- Describe the mechanism: what the part does, why it makes that exact noise/behaviour, when it typically appears (cold start, under load, at speed), and what happens if it is ignored.
- Use everyday comparisons, no jargon dumps. Short sentences. No bullet lists inside a text field.
- Never fake certainty; say what would confirm it on the lift.

If an audio clip is attached, describe what you actually hear (rhythm, pitch, whether it scales with engine RPM or wheel speed, metallic vs rubbing vs ticking) and use it as your main evidence.

Severity (verdict) — pick exactly one:
"safe" = nothing dangerous, keep an eye on it.
"caution" = drivable, short trips, book the garage.
"soon" = not dangerous today but fix it shortly or it gets expensive / turns into damage.
"urgent" = brakes, steering, suspension, overheating, oil pressure, anything that can fail catastrophically — stop driving.

Return ONLY JSON matching this shape:
{"verdict":"safe|caution|soon|urgent","headline":string,"confidence":number,"mechanicNote":string,"causes":[{"part":string,"summary":string,"explanation":string,"likelihood":number}],"checks":[string],"advice":string,"estimatedCost":string,"audioNote":string}
mechanicNote: 4-8 sentences of the mechanic talking the owner through the case — what he suspects, why, and how this normally behaves on this exact car.
confidence: how CERTAIN you are in this diagnosis, 0-100. High (80-95) when the symptom is textbook and the evidence is strong; medium (50-70) when it fits but could be two or three things; low (15-40) when you are mostly guessing from thin information. Never output a low number when you are sure — the number goes UP with certainty.
causes[].summary: ONE short plain sentence (max ~15 words) an owner instantly understands. No jargon.
causes[].explanation: the optional longer version, 2-3 sentences MAX — the mechanism, why it fits this symptom, how common it is on this model/mileage. Keep it tight; never a wall of text.
checks: 2-5 things the owner can check in the driveway.
advice: what to do now, in what order, and what to tell the garage.
estimatedCost: a realistic price range including labour, in the requested currency.
audioNote: one sentence about what the recording sounded like, or "" if no audio.`;

const SECOND_PROMPT = `You are a SECOND independent master mechanic giving a second opinion on a colleague's diagnosis. You have the same case notes but you are deliberately sceptical and thorough.

Your job:
- Say briefly whether you broadly agree with the first diagnosis and why.
- List 2-4 alternative or additional causes the first mechanic under-weighted or missed, each with why it is MORE or LESS likely than the first verdict, in mechanic language, tied to this specific car, mileage and symptom.
- Add extra detail that helps the owner: what to listen/look for next, what a workshop test would settle it, and what would change your mind.

Return ONLY JSON:
{"summary":string,"alternatives":[{"part":string,"why":string,"likelihood":number,"stance":"more|less|same"}],"extra":string}`;

function clampVerdict(value: unknown): Verdict {
  return value === "safe" || value === "urgent" || value === "soon" ? value : "caution";
}

function clampNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function gatewayModel() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured yet.");
  const { generateText } = await import("ai");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(apiKey);
  return { generateText, model: gateway("google/gemini-3.6-flash") };
}

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeSchema.parse(input))
  .handler(async ({ data }): Promise<DiagnosisResult> => {
    const { generateText, model } = await gatewayModel();

    const { car } = data;
    const languageName = LANGUAGE_NAME[data.language] ?? "Swedish";
    const brief = [
      `Vehicle: ${car.year} ${car.make} ${car.model}`,
      `Transmission: ${car.transmission}`,
      `Fuel: ${car.fuel}`,
      `Odometer: ${car.mileageKm} km`,
      data.tags.length ? `Reported symptom categories: ${data.tags.join(", ")}` : "",
      `Owner's description: ${data.symptom}`,
      data.image ? "A photo (for example of the dashboard warning light) is attached — read it." : "",
      `Write every field of your answer in ${languageName}.`,
      `Give estimatedCost as a range in ${data.currency}, formatted for that market.`,
      data.audio ? "An audio recording of the problem is attached — analyse it." : "No audio recording provided.",
    ]
      .filter(Boolean)
      .join("\n");

    const runOnce = async (withAudio: boolean) => {
      const content: Array<Record<string, unknown>> = [{ type: "text", text: brief }];
      if (data.image) {
        content.push({ type: "file", data: data.image.base64, mediaType: data.image.mediaType });
      }
      if (withAudio && data.audio) {
        content.push({ type: "file", data: data.audio.base64, mediaType: data.audio.mediaType });
      }
      return generateText({
        model,
        system: SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: [{ role: "user", content: content as any }],
      });
    };

    let audioUsed = Boolean(data.audio);
    let text: string;
    try {
      text = (await runOnce(audioUsed)).text;
    } catch (error) {
      if (!audioUsed) throw error;
      console.error("Audio analysis failed, retrying without audio", error);
      audioUsed = false;
      text = (await runOnce(false)).text;
    }

    const parsed = parseJson(text);
    if (!parsed) {
      return {
        verdict: "caution",
        headline: "Couldn't read a clear result — try describing the problem again",
        confidence: 0,
        mechanicNote: "",
        causes: [],
        checks: [],
        advice: text.slice(0, 1200),
        estimatedCost: "Unknown",
        audioUsed,
        audioNote: "",
      };
    }

    const causes = Array.isArray(parsed.causes) ? parsed.causes : [];
    const checks = Array.isArray(parsed.checks) ? parsed.checks : [];

    return {
      verdict: clampVerdict(parsed.verdict),
      headline: String(parsed.headline ?? "Possible issue detected").slice(0, 300),
      confidence: clampNumber(parsed.confidence, 50),
      mechanicNote: String(parsed.mechanicNote ?? "").slice(0, 3000),
      causes: causes.slice(0, 4).map((raw) => {
        const c = raw as Record<string, unknown>;
        return {
          part: String(c.part ?? "Unknown part").slice(0, 120),
          summary: String(c.summary ?? "").slice(0, 240),
          explanation: String(c.explanation ?? "").slice(0, 1200),
          likelihood: clampNumber(c.likelihood, 40),
        };
      }),
      checks: checks.slice(0, 6).map((c) => String(c).slice(0, 240)),
      advice: String(parsed.advice ?? "").slice(0, 2500),
      estimatedCost: String(parsed.estimatedCost ?? "Unknown").slice(0, 160),
      audioUsed,
      audioNote: audioUsed ? String(parsed.audioNote ?? "").slice(0, 300) : "",
    };
  });

export const secondOpinion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SecondSchema.parse(input))
  .handler(async ({ data }): Promise<SecondOpinion> => {
    const { generateText, model } = await gatewayModel();
    const { car, first } = data;
    const languageName = LANGUAGE_NAME[data.language] ?? "Swedish";

    const brief = [
      `Vehicle: ${car.year} ${car.make} ${car.model} · ${car.transmission} · ${car.fuel} · ${car.mileageKm} km`,
      data.tags.length ? `Symptom categories: ${data.tags.join(", ")}` : "",
      `Owner's description: ${data.symptom}`,
      "",
      "FIRST MECHANIC'S DIAGNOSIS:",
      `Verdict: ${first.verdict} (confidence ${first.confidence}%)`,
      `Headline: ${first.headline}`,
      first.mechanicNote ? `Notes: ${first.mechanicNote}` : "",
      `Causes: ${first.causes.map((c) => `${c.part} (${c.likelihood}%) — ${c.explanation}`).join(" | ")}`,
      `Advice: ${first.advice}`,
      `Cost: ${first.estimatedCost}`,
      "",
      `Write every field in ${languageName}. Any prices in ${data.currency}.`,
    ]
      .filter(Boolean)
      .join("\n");

    const { text } = await generateText({
      model,
      system: SECOND_PROMPT,
      messages: [{ role: "user", content: brief }],
    });

    const parsed = parseJson(text);
    if (!parsed) return { summary: text.slice(0, 1500), alternatives: [], extra: "" };

    const alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
    return {
      summary: String(parsed.summary ?? "").slice(0, 2000),
      alternatives: alternatives.slice(0, 4).map((raw) => {
        const a = raw as Record<string, unknown>;
        const stance = a.stance === "more" || a.stance === "less" ? a.stance : "same";
        return {
          part: String(a.part ?? "").slice(0, 120),
          why: String(a.why ?? "").slice(0, 1200),
          likelihood: clampNumber(a.likelihood, 30),
          stance: stance as "more" | "less" | "same",
        };
      }),
      extra: String(parsed.extra ?? "").slice(0, 2000),
    };
  });

export const saveDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("diagnoses")
      .insert({
        user_id: context.userId,
        car_summary: data.carSummary,
        symptom: data.symptom,
        symptom_tags: data.tags,
        had_audio: data.hadAudio,
        verdict: data.result.verdict,
        headline: data.result.headline,
        confidence: data.result.confidence,
        causes: data.result.causes,
        checks: data.result.checks,
        advice: data.result.advice,
        estimated_cost: data.result.estimatedCost,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listDiagnoses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("diagnoses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("diagnoses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
