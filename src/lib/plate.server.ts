import { CAR_BRANDS } from "./car-brands";
import { suggestModels } from "./car-models";

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

export const EMPTY_PLATE: PlateLookup = {
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

function unescapeHtml(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

/** Flattens the vehicle page into a single readable line of text. */
function flatten(html: string) {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return unescapeHtml(stripped).replace(/\s+/g, " ").trim();
}

function toNumber(raw: string) {
  const value = Number(raw.replace(/[\s\u00a0]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function mapFuel(raw: string): PlateLookup["fuel"] {
  const value = raw.toLowerCase();
  if (/hybrid|el\s*\/\s*bensin|bensin\s*\/\s*el|el\s*\/\s*diesel/.test(value)) return "hybrid";
  if (/^el\b|elektrisk|^el$/.test(value)) return "electric";
  if (/diesel/.test(value)) return "diesel";
  if (/bensin|etanol|gas/.test(value)) return "petrol";
  return "";
}

function mapTransmission(raw: string): PlateLookup["transmission"] {
  const value = raw.toLowerCase();
  if (value.includes("automat")) return "automatic";
  if (value.includes("manuell")) return "manual";
  return "";
}

/** Parses a biluppgifter.se vehicle page into the fields the garage form needs. */
export function parseVehiclePage(html: string): PlateLookup {
  const text = flatten(html);

  const makeRaw = text.match(/Fabrikat\s+(.+?)\s+Modell\s+/i)?.[1]?.trim() ?? "";
  const modelRaw = text.match(/\sModell\s+(.+?)\s+Registreringsnummer\s/i)?.[1]?.trim() ?? "";
  if (!makeRaw || !modelRaw) return EMPTY_PLATE;

  const make =
    CAR_BRANDS.find((brand) => brand.toLowerCase() === makeRaw.toLowerCase()) ??
    CAR_BRANDS.filter((brand) => makeRaw.toLowerCase().startsWith(brand.toLowerCase())).sort(
      (a, b) => b.length - a.length,
    )[0] ??
    makeRaw;

  // Registry model strings look like "3-serien E90 Variant 335i xDrive Originalnamn TS BMW 335i".
  // We want the full designation ("335i"), not just the series digit.
  const cleanedModel = modelRaw.replace(/\s*Originalnamn\s+TS\b.*$/i, "").trim();
  const known = suggestModels(make, "", 800);
  const norm = (value: string) => value.toLowerCase().replace(/[\s\-_]/g, "");
  const haystack = norm(`${cleanedModel} ${modelRaw}`);
  const matches = known.filter((option) => haystack.includes(norm(option)));
  const isDesignation = (value: string) => /^[a-z]{0,2}\d{2,3}[a-z]{0,3}$/i.test(value.replace(/\s/g, ""));
  const designations = matches.filter(isDesignation).sort((a, b) => b.length - a.length);
  const rawDesignation = cleanedModel.match(/\b([A-Z]{0,2}\d{3}[a-z]{0,3}(?:\s?xDrive)?)\b/i)?.[1];
  const model =
    designations[0] ??
    (rawDesignation && known.some((option) => norm(option) === norm(rawDesignation))
      ? known.find((option) => norm(option) === norm(rawDesignation))!
      : undefined) ??
    matches.sort((a, b) => b.length - a.length)[0] ??
    rawDesignation ??
    cleanedModel.split(" ")[0] ??
    "";
  const variant = cleanedModel
    .replace(new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ")
    .replace(/\b\d+-?serien?\b/gi, " ")
    .replace(/\bvariant\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);

  const year = Number(text.match(/Fordonsår\s*\/\s*Modellår\s+(\d{4})/i)?.[1] ?? "") || null;
  const fuel = mapFuel(text.match(/Drivmedel\s+([A-Za-zÅÄÖåäö\/\s-]{2,20}?)\s+(?:Växellåda|Fyrhjulsdrift|Motor)/i)?.[1] ?? "");
  const transmission = mapTransmission(
    text.match(/Växellåda\s+([A-Za-zÅÄÖåäö\s-]{2,20}?)\s+(?:Fyrhjulsdrift|Drivhjul|Ljudnivå)/i)?.[1] ?? "",
  );

  const inspectionDate = text.match(/Senast besiktigad\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? "";
  const odo = text.match(/Mätarställning \(besiktning\)\s+([\d\s\u00a0]+)\s*(mil|km)/i);
  let inspectionKm: number | null = null;
  if (odo) {
    const value = toNumber(odo[1]!);
    if (value) inspectionKm = odo[2]!.toLowerCase() === "mil" ? value * 10 : value;
  }

  if (!make || !model) return EMPTY_PLATE;
  return { found: true, make, model, variant, year, fuel, transmission, inspectionKm, inspectionDate };
}

/** Fetches the public vehicle record for a Swedish registration number. */
export async function fetchVehicleByPlate(plate: string): Promise<PlateLookup> {
  const response = await fetch(`https://biluppgifter.se/fordon/${encodeURIComponent(plate)}`, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept-Language": "sv-SE,sv;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) return EMPTY_PLATE;
  const html = await response.text();
  const title = unescapeHtml(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  if (!title.toUpperCase().startsWith(plate.toUpperCase())) return EMPTY_PLATE;
  return parseVehiclePage(html);
}
