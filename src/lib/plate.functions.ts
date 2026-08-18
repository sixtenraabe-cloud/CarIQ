import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PlateSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
    .refine((value) => /^[A-ZÅÄÖ0-9]{2,8}$/.test(value), "Invalid plate"),
});

export type PlateLookup = {
  found: boolean;
  make: string;
  model: string;
  variant: string;
  year: number | null;
  fuel: "" | "petrol" | "diesel" | "hybrid" | "electric";
  transmission: "" | "manual" | "automatic";
  inspectionKm: number | null;
  inspectionDate: string;
};

const EMPTY: PlateLookup = {
  found: false,
  make: "",
  model: "",
  variant: "",
  year: null,
  fuel: "",
  transmission: "",
  inspectionKm: null,
  inspectionDate: "",
};

function decode(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

/** Strips markup so the vehicle facts can be read as plain "Label Value" text. */
function toPlainText(html: string) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

/**
 * Looks up a Swedish registration number and returns the vehicle basics so the
 * owner does not have to type make, model, year, fuel and gearbox by hand.
 */
export const lookupPlate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlateSchema.parse(input))
  .handler(async ({ data }): Promise<PlateLookup> => {
    // Plate lookups are a plain public web fetch, not paid AI usage, so they use
    // their own generous abuse guard instead of the AI budget.
    const { guardPlateUsage } = await import("./ai-rate-limit.server");
    if (!guardPlateUsage()) return EMPTY;

    const response = await fetch(
      `https://biluppgifter.se/fordon/${encodeURIComponent(data.plate)}/`,
      {
        redirect: "follow",
        headers: {
          // Full browser-like header set: the source rejects bare fetch clients with 403.
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      },
    );
    console.log("[plate] status", response.status, response.url);
    if (!response.ok) return EMPTY;
    const html = await response.text();
    const text = toPlainText(html);

    const facts = text.match(/Fabrikat\s+(.+?)\s+Modell\s+(.+?)\s+Variant\s+(.+?)\s+(?:Originalnamn|Registreringsnummer)\b/i);
    const make = facts?.[1]?.trim() ?? "";
    const model = facts?.[2]?.trim() ?? "";
    const variant = (facts?.[3]?.trim() ?? "").slice(0, 40);
    console.log("[plate] parsed", { make, model, variant, len: text.length });
    if (!make || !model) return EMPTY;

    const year =
      Number(text.match(/Fordonsår\s*\/\s*Modellår\s+(\d{4})/i)?.[1] ?? "") ||
      Number(text.match(/(\d{4})\s+Modellår/i)?.[1] ?? "") ||
      null;

    const fuelWord = (
      text.match(/Drivmedel\s+([A-Za-zÅÄÖåäö/-]+)/i)?.[1] ??
      text.match(/([A-Za-zÅÄÖåäö/-]+)\s+Bränsle/i)?.[1] ??
      ""
    ).toLowerCase();
    let fuel: PlateLookup["fuel"] = "";
    if (/hybrid|laddhybrid/.test(fuelWord)) fuel = "hybrid";
    else if (/diesel/.test(fuelWord)) fuel = "diesel";
    else if (/^el|elektricitet|eldrift/.test(fuelWord)) fuel = "electric";
    else if (/bensin/.test(fuelWord)) fuel = "petrol";

    const gearWord = (
      text.match(/Växellåda\s+([A-Za-zÅÄÖåäö]+)/i)?.[1] ??
      text.match(/([A-Za-zÅÄÖåäö]+)\s+Växellåda/i)?.[1] ??
      ""
    ).toLowerCase();
    const transmission: PlateLookup["transmission"] = /automat/.test(gearWord)
      ? "automatic"
      : /manuell/.test(gearWord)
        ? "manual"
        : "";

    const odo = text.match(/Mätarställning\s*\(besiktning\)\s+([\d\s\u00a0]+)\s*(mil|km)/i);
    const odoValue = odo ? Number(odo[1]!.replace(/[\s\u00a0]/g, "")) : 0;
    const inspectionKm = odoValue
      ? odo![2]!.toLowerCase() === "mil"
        ? odoValue * 10
        : odoValue
      : null;
    const inspectionDate = text.match(/Senast besiktigad\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? "";

    return {
      found: true,
      make,
      model,
      variant,
      year,
      fuel,
      transmission,
      inspectionKm,
      inspectionDate,
    };
  });
