import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  make: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(40),
  variant: z.string().trim().max(40).default(""),
  year: z.number().int().min(1950).max(2030),
  fuel: z.string().trim().max(30).default(""),
  mileageKm: z.number().int().min(0).max(2000000).default(0),
  category: z.string().trim().max(80).default(""),
  language: z.enum(["sv", "en", "da", "de"]).default("sv"),
});

const LANGUAGE_NAME: Record<string, string> = {
  sv: "Swedish",
  en: "English",
  da: "Danish",
  de: "German",
};

const PROMPT = `You are a master mechanic who knows the common, well-documented faults of every car model.
Given a specific car, list the problems owners of THAT exact make/model/generation most often report, phrased the way an owner would describe the SYMPTOM (not the part name).
Rules:
- 4 to 6 items, each max 9 words, plain everyday language, no jargon, no part numbers.
- Only faults that are physically possible on this powertrain (an EV has no oil, spark plugs, DPF or exhaust).
- If a symptom category is given, every item must belong to that category.
- No prices, no severity, just the symptom.
Return ONLY JSON: {"issues":["...","..."]}`;

export const knownIssues = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<{ issues: string[] }> => {
    const { guardAiUsage } = await import("./ai-rate-limit.server");
    guardAiUsage("issues");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { issues: [] };
    const { generateText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);

    const brief = [
      `Car: ${data.year} ${data.make} ${data.model}${data.variant ? ` ${data.variant}` : ""}`,
      data.fuel ? `Fuel/powertrain: ${data.fuel}` : "",
      data.mileageKm ? `Odometer: ${data.mileageKm} km` : "",
      data.category ? `Symptom category the owner picked: ${data.category}` : "",
      `Write the items in ${LANGUAGE_NAME[data.language] ?? "Swedish"}.`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        system: PROMPT,
        messages: [{ role: "user", content: brief }],
      });
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) return { issues: [] };
      const parsed = JSON.parse(text.slice(start, end + 1)) as { issues?: unknown };
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
      return {
        issues: issues.slice(0, 6).map((item) => String(item).slice(0, 90)).filter(Boolean),
      };
    } catch {
      return { issues: [] };
    }
  });
