export type Verdict = "safe" | "caution" | "urgent";

export type CarProfile = {
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuel: string;
  mileageKm: number;
};

export type Cause = {
  part: string;
  explanation: string;
  likelihood: number;
};

export type DiagnosisResult = {
  verdict: Verdict;
  headline: string;
  confidence: number;
  causes: Cause[];
  checks: string[];
  advice: string;
  estimatedCost: string;
  audioUsed: boolean;
  audioNote: string;
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  safe: "Okay to drive",
  caution: "Drive with care — book a garage",
  urgent: "Stop driving — mechanic ASAP",
};

export function carSummary(car: CarProfile) {
  return `${car.year} ${car.make} ${car.model} · ${car.transmission} · ${car.fuel} · ${car.mileageKm.toLocaleString()} km`;
}