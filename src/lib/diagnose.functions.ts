import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { DiagnosisResult, Verdict } from "./diagnosis-types";

const CarSchema = z.object({
  make: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(40),
  year: z.number().int().min(1950).max(2030),
  transmission: z.string().trim().min(1).max(30),
  fuel: z.string().trim().min(1).max(30),
  mileageKm: z.number().int().min(0).max(2000000),
});

const AnalyzeSchema = z.object({
  car: CarSchema,
  tags: z.array(z.string().max(60)).max(12),
  symptom: z.string().trim().min(3).max(2000),
  audio: z
    .object({
      base64: z.string().max(9000000),
      mediaType: z.string().max(60),
    })
    .nullable()
    .default(null),
});

const SaveSchema = z.object({
  carSummary: z.string().max(200),
  symptom: z.string().max(2000),
  tags: z.array(z.string().max(60)).max(12),
  hadAudio: z.boolean(),
  result: z.object({
    verdict: z.enum(["safe", "caution", "urgent"]),
    headline: z.string().max(300),
    confidence: z.number().int().min(0).max(100),
    causes: z.array(z.object({ part: z.string(), explanation: z.string(), likelihood: z.number() })).max(8),
    checks: z.array(z.string()).max(10),
    advice: z.string().max(2000),
    estimatedCost: z.string().max(200),
  }),
});

const SYSTEM_PROMPT = `You are an experienced master car mechanic doing a remote triage.
You never claim certainty. You reason from the vehicle's age, mileage, drivetrain and the described (or recorded) symptom.
If an audio clip is attached, describe what you actually hear (rhythm, pitch, whether it scales with engine RPM or wheel speed, metallic vs rubbing vs ticking) and use it as your main evidence.
Always return: a drivability verdict, a short headline, a confidence percentage (0-100), 2-4 likely causes with a likelihood percentage each, 2-5 quick checks the owner can do themselves, plain-language advice, and a rough repair cost range in EUR.
Verdict rules: "safe" = likely fine to keep driving but monitor. "caution" = drivable short distances, book a garage soon. "urgent" = braking, steering, suspension, overheating, oil pressure, or anything that can fail catastrophically — stop driving and get it to a mechanic.
Never diagnose with false confidence; this is guidance, not a replacement for a mechanic.
Return ONLY JSON matching this shape:
{"verdict":"safe|caution|urgent","headline":string,"confidence":number,"causes":[{"part":string,"explanation":string,"likelihood":number}],"checks":[string],"advice":string,"estimatedCost":string,"audioNote":string}
audioNote: one sentence about what the recording sounded like, or "" if no audio was provided.`;

function clampVerdict(value: unknown): Verdict {
  return value === "safe" || value === "urgent" ? value : "caution";
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

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeSchema.parse(input))
  .handler(async ({ data }): Promise<DiagnosisResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured yet.");

    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const { car } = data;
    const brief = [
      `Vehicle: ${car.year} ${car.make} ${car.model}`,
      `Transmission: ${car.transmission}`,
      `Fuel: ${car.fuel}`,
      `Odometer: ${car.mileageKm} km`,
      data.tags.length ? `Reported symptom categories: ${data.tags.join(", ")}` : "",
      `Owner's description: ${data.symptom}`,
      data.audio ? "An audio recording of the problem is attached — analyse it." : "No audio recording provided.",
    ]
      .filter(Boolean)
      .join("\n");

    const runOnce = async (withAudio: boolean) => {
      const content: Array<Record<string, unknown>> = [{ type: "text", text: brief }];
      if (withAudio && data.audio) {
        content.push({
          type: "file",
          data: data.audio.base64,
          mediaType: data.audio.mediaType,
        });
      }
      return generateText({
        model: gateway("google/gemini-3.6-flash"),
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
      causes: causes.slice(0, 4).map((raw) => {
        const c = raw as Record<string, unknown>;
        return {
          part: String(c.part ?? "Unknown part").slice(0, 120),
          explanation: String(c.explanation ?? "").slice(0, 600),
          likelihood: clampNumber(c.likelihood, 40),
        };
      }),
      checks: checks.slice(0, 6).map((c) => String(c).slice(0, 200)),
      advice: String(parsed.advice ?? "").slice(0, 1500),
      estimatedCost: String(parsed.estimatedCost ?? "Unknown").slice(0, 160),
      audioUsed,
      audioNote: audioUsed ? String(parsed.audioNote ?? "").slice(0, 300) : "",
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