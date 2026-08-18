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
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

/** Reads the odometer reading (in km) reported at the most recent vehicle inspection. */
function readInspection(html: string): { km: number | null; date: string } {
  const start = html.indexOf("mileage_history");
  if (start < 0) return { km: null, date: "" };
  const text = decode(
    html
      .slice(start, start + 20000)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
  const match = text.match(
    /(?:Kontrollbesiktning|Efterkontroll-?besiktning|Registreringsbesiktning)\s+([\d\s\u00a0]+)\s*(mil|km)\s+(\d{4}-\d{2}-\d{2})/i,
  );
  if (!match) return { km: null, date: "" };
  const value = Number(match[1]!.replace(/[\s\u00a0]/g, ""));
  if (!value) return { km: null, date: "" };
  const km = match[2]!.toLowerCase() === "mil" ? value * 10 : value;
  return { km, date: match[3]! };
}

/**
 * Looks up a Swedish registration number and returns the vehicle basics so the
 * owner does not have to type make, model, year, fuel and gearbox by hand.
 */
export const lookupPlate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlateSchema.parse(input))
  .handler(async ({ data }): Promise<PlateLookup> => {
    const { guardAiUsage } = await import("./ai-rate-limit.server");
    try {
      guardAiUsage("plate");
    } catch {
      // Too many lookups from this client: degrade to "not found" so the user
      // can fill the form in manually instead of hitting an error screen.
      return EMPTY;
    }

    const response = await fetch(
      `https://www.car.info/sv-se/license-plate/S/${encodeURIComponent(data.plate)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          "Accept-Language": "sv-SE,sv;q=0.9",
        },
      },
    );
    if (!response.ok) return EMPTY;
    const html = await response.text();

    const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
    const body = decode(html.slice(0, 400000));

    const after = title.split(" - ").slice(1).join(" - ");
    if (!after) return EMPTY;

    const year = Number(after.match(/(\d{4})\s*$/)?.[1] ?? "") || null;
    let head = after.replace(/,\s*[\d\s]+hk.*$/i, "").replace(/,\s*\d{4}\s*$/, "").trim();

    let transmission: PlateLookup["transmission"] = "";
    if (/\bautomatisk\b|\bautomat\b/i.test(head) || /automatisk växellåda|automatlåda/i.test(body)) {
      transmission = "automatic";
    }
    if (/\bmanuell\b/i.test(head) || /manuell växellåda/i.test(body)) transmission = "manual";
    head = head.replace(/\b(automatisk|automat|manuell)\b/gi, "").trim();

    const { CAR_BRANDS } = await import("./car-brands");
    const make =
      CAR_BRANDS.filter((brand) => head.toLowerCase().startsWith(brand.toLowerCase())).sort(
        (a, b) => b.length - a.length,
      )[0] ?? head.split(" ")[0] ?? "";

    const rest = head.slice(make.length).trim();
    const { suggestModels } = await import("./car-models");
    const known = suggestModels(make, "", 400);
    const model =
      known
        .filter((option) => rest.toLowerCase().startsWith(option.toLowerCase()))
        .sort((a, b) => b.length - a.length)[0] ??
      rest.split(" ")[0] ??
      "";
    const variant = rest.slice(model.length).trim().slice(0, 40);

    let fuel: PlateLookup["fuel"] = "";
    if (/laddhybrid|plug-?in hybrid|\bhybrid\b/i.test(body)) fuel = "hybrid";
    else if (/dieselmotor|\bdiesel\b/i.test(body)) fuel = "diesel";
    else if (/elmotor|\bhelelektrisk\b|\beldriven\b/i.test(body)) fuel = "electric";
    else if (/bensinmotor|\bbensin\b/i.test(body)) fuel = "petrol";

    if (!make || !model) return EMPTY;

    const inspection = readInspection(html);

    return {
      found: true,
      make,
      model,
      variant,
      year,
      fuel,
      transmission,
      inspectionKm: inspection.km,
      inspectionDate: inspection.date,
    };
  });
