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

/** Pulls a value out of an arbitrarily nested API payload by key name. */
function pick(source: unknown, keys: string[]): string {
  const seen: unknown[] = [];
  const walk = (node: unknown): string => {
    if (!node || typeof node !== "object" || seen.includes(node)) return "";
    seen.push(node);
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (keys.includes(key.toLowerCase()) && (typeof value === "string" || typeof value === "number")) {
        return String(value).trim();
      }
    }
    for (const value of Object.values(node as Record<string, unknown>)) {
      const found = walk(value);
      if (found) return found;
    }
    return "";
  };
  return walk(source);
}

function toFuel(word: string): PlateLookup["fuel"] {
  const value = word.toLowerCase();
  if (/hybrid|laddhybrid/.test(value)) return "hybrid";
  if (/diesel/.test(value)) return "diesel";
  if (/^el\b|^el$|elektricitet|eldrift|electric/.test(value)) return "electric";
  if (/bensin|petrol|gasoline/.test(value)) return "petrol";
  return "";
}

/** Reads a "- LabelValue" line out of the scraped markdown fact list. */
function field(markdown: string, label: string): string {
  const match = markdown.match(
    new RegExp(`^-\\s*${label}\\s*[:]?\\s*(.+)$`, "im"),
  );
  return match?.[1] ? decode(match[1]).trim() : "";
}

/**
 * Scrapes the public vehicle page through Firecrawl. The source blocks plain
 * server fetches with bot protection, so this is the reliable path.
 */
async function lookupViaFirecrawl(plate: string): Promise<PlateLookup> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) return EMPTY;

  const response = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
    },
    body: JSON.stringify({
      url: `https://biluppgifter.se/fordon/${encodeURIComponent(plate)}`,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!response.ok) {
    console.error(`Firecrawl plate lookup failed [${response.status}]: ${await response.text()}`);
    return EMPTY;
  }

  const payload = (await response.json()) as { data?: { markdown?: string } };
  const markdown = payload.data?.markdown ?? "";
  if (!markdown) return EMPTY;

  const make = field(markdown, "Fabrikat");
  const model = field(markdown, "Modell(?!år)");
  if (!make || !model) return EMPTY;

  const years = field(markdown, "Fordonsår / Modellår").match(/(\d{4})\D*(\d{4})?/);
  const year = Number(years?.[2] ?? years?.[1] ?? "") || null;

  const gear = field(markdown, "Växellåda").toLowerCase();
  const odo = field(markdown, "Mätarställning \\(besiktning\\)").match(
    /([\d\s\u00a0]+)\s*(mil|km)/i,
  );
  const odoValue = odo ? Number(odo[1]!.replace(/[\s\u00a0]/g, "")) : 0;

  return {
    found: true,
    make,
    model,
    variant: field(markdown, "Variant").slice(0, 40),
    year,
    fuel: toFuel(field(markdown, "Drivmedel") || field(markdown, "Bränsle")),
    transmission: /automat/.test(gear) ? "automatic" : /manuell/.test(gear) ? "manual" : "",
    inspectionKm: odoValue
      ? odo![2]!.toLowerCase() === "mil"
        ? odoValue * 10
        : odoValue
      : null,
    inspectionDate: field(markdown, "Senast besiktigad").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
  };
}

/** Official API path, used when a data provider token is configured. */
async function lookupViaApi(plate: string, token: string): Promise<PlateLookup> {
  const response = await fetch(
    `https://api.biluppgifter.se/api/v1/vehicle/regno/${encodeURIComponent(plate)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
  );
  if (!response.ok) return EMPTY;
  const payload: unknown = await response.json();
  const make = pick(payload, ["make", "brand", "fabrikat"]);
  const model = pick(payload, ["model", "modell"]);
  if (!make || !model) return EMPTY;
  const gear = pick(payload, ["gearbox", "transmission", "vaxellada"]).toLowerCase();
  return {
    found: true,
    make,
    model,
    variant: pick(payload, ["variant", "version"]).slice(0, 40),
    year: Number(pick(payload, ["model_year", "modelyear", "year", "modellar"])) || null,
    fuel: toFuel(pick(payload, ["fuel", "fuel_type", "drivmedel"])),
    transmission: /automat/.test(gear) ? "automatic" : /manuell|manual/.test(gear) ? "manual" : "",
    inspectionKm: Number(pick(payload, ["odometer", "mileage", "matarstallning"]).replace(/\D/g, "")) || null,
    inspectionDate: pick(payload, ["last_inspection", "inspection_date", "senast_besiktigad"]).slice(0, 10),
  };
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

    const token = process.env["BILUPPGIFTER_API_TOKEN"];
    if (token) {
      try {
        const viaApi = await lookupViaApi(data.plate, token);
        if (viaApi.found) return viaApi;
      } catch {
        // fall through to the public page below
      }
    }

    try {
      const viaFirecrawl = await lookupViaFirecrawl(data.plate);
      if (viaFirecrawl.found) return viaFirecrawl;
    } catch (error) {
      console.error("Firecrawl plate lookup error", error);
    }

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
    if (!response.ok) return EMPTY;
    const html = await response.text();
    const text = toPlainText(html);

    const facts = text.match(/Fabrikat\s+(.+?)\s+Modell\s+(.+?)\s+Variant\s+(.+?)\s+(?:Originalnamn|Registreringsnummer)\b/i);
    const make = facts?.[1]?.trim() ?? "";
    const model = facts?.[2]?.trim() ?? "";
    const variant = (facts?.[3]?.trim() ?? "").slice(0, 40);
    if (!make || !model) return EMPTY;

    const year =
      Number(text.match(/Fordonsår\s*\/\s*Modellår\s+(\d{4})/i)?.[1] ?? "") ||
      Number(text.match(/(\d{4})\s+Modellår/i)?.[1] ?? "") ||
      null;

    const fuel = toFuel(
      text.match(/Drivmedel\s+([A-Za-zÅÄÖåäö/-]+)/i)?.[1] ??
        text.match(/([A-Za-zÅÄÖåäö/-]+)\s+Bränsle/i)?.[1] ??
        "",
    );

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
