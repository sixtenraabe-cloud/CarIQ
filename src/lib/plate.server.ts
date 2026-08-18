import { CAR_BRANDS } from "./car-brands";
import { CAR_VARIANTS, suggestModels } from "./car-models";

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

  const cleanedModel = modelRaw.replace(/\s*Originalnamn\s+TS\b.*$/i, "").trim();
  const { model, variant } = splitModelVariant(make, cleanedModel);

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

/** Old car.info-style split: longest known model prefix, remainder is the variant. */
function splitModelVariant(make: string, rest: string) {
  const known = suggestModels(make, "", 400);
  const model =
    known
      .filter((option) => rest.toLowerCase().startsWith(option.toLowerCase()))
      .sort((a, b) => b.length - a.length)[0] ??
    rest.split(" ")[0] ??
    "";
  const variant = rest.slice(model.length).trim().slice(0, 40);
  return { model, variant };
}

/** Parses a car.info license-plate page (the original source). */
export function parseCarInfoPage(html: string): PlateLookup {
  const title = unescapeHtml(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").trim();
  const body = unescapeHtml(html.slice(0, 400000));
  const after = title.split(" - ").slice(1).join(" - ").trim();
  if (!after) return EMPTY_PLATE;

  const year = Number(after.match(/(\d{4})\s*$/)?.[1] ?? "") || null;
  let head = after.replace(/,\s*[\d\s]+hk.*$/i, "").replace(/,\s*\d{4}\s*$/, "").trim();

  let transmission: PlateLookup["transmission"] = "";
  if (/\bautomatisk\b|\bautomat\b/i.test(head) || /automatisk växellåda|automatlåda/i.test(body)) {
    transmission = "automatic";
  }
  if (/\bmanuell\b/i.test(head) || /manuell växellåda/i.test(body)) transmission = "manual";
  head = head.replace(/\b(automatisk|automat|manuell)\b/gi, "").trim();

  const make =
    CAR_BRANDS.filter((brand) => head.toLowerCase().startsWith(brand.toLowerCase())).sort(
      (a, b) => b.length - a.length,
    )[0] ??
    head.split(" ")[0] ??
    "";
  const { model, variant } = splitModelVariant(make, head.slice(make.length).trim());

  let fuel: PlateLookup["fuel"] = "";
  if (/laddhybrid|plug-?in hybrid|\bhybrid\b/i.test(body)) fuel = "hybrid";
  else if (/dieselmotor|\bdiesel\b/i.test(body)) fuel = "diesel";
  else if (/elmotor|\bhelelektrisk\b|\beldriven\b/i.test(body)) fuel = "electric";
  else if (/bensinmotor|\bbensin\b/i.test(body)) fuel = "petrol";

  if (!make || !model) return EMPTY_PLATE;
  return { found: true, make, model, variant, year, fuel, transmission, inspectionKm: null, inspectionDate: "" };
}

async function fetchFromCarInfo(plate: string): Promise<PlateLookup> {
  const response = await fetch(`https://www.car.info/sv-se/license-plate/S/${encodeURIComponent(plate)}`, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept-Language": "sv-SE,sv;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) return EMPTY_PLATE;
  return parseCarInfoPage(await response.text());
}

/** Fetches the public vehicle record: car.info first, biluppgifter as fallback. */
export async function fetchVehicleByPlate(plate: string): Promise<PlateLookup> {
  try {
    const primary = await fetchFromCarInfo(plate);
    if (primary.found) return primary;
  } catch {
    // fall through to the backup source
  }
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
