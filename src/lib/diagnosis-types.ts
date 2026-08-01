export type Verdict = "safe" | "caution" | "soon" | "urgent";

export const VERDICTS: Verdict[] = ["safe", "caution", "soon", "urgent"];

export const VERDICT_DOT: Record<Verdict, string> = {
  safe: "🟢",
  caution: "🟡",
  soon: "🟠",
  urgent: "🔴",
};

export type CarProfile = {
  make: string;
  model: string;
  variant?: string;
  year: number;
  transmission: string;
  fuel: string;
  mileageKm: number;
};

export type Cause = {
  part: string;
  summary: string;
  explanation: string;
  likelihood: number;
};

export type DiagnosisResult = {
  verdict: Verdict;
  headline: string;
  confidence: number;
  mechanicNote: string;
  causes: Cause[];
  checks: string[];
  advice: string;
  estimatedCost: string;
  audioUsed: boolean;
  audioNote: string;
  mismatch: string;
};

export type SecondOpinion = {
  summary: string;
  alternatives: {
    part: string;
    why: string;
    likelihood: number;
    stance: "more" | "less" | "same";
  }[];
  extra: string;
};

export function carSummary(car: CarProfile) {
  return `${car.year} ${car.make} ${car.model}${car.variant ? " " + car.variant : ""} · ${car.transmission} · ${car.fuel} · ${car.mileageKm.toLocaleString()} km`;
}
