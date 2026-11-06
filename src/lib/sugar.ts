/** Blood sugar: bands, units and 14-day stats. Values are stored in mg/dL. */
import { addDays } from "./dates";
import type { SugarReading, SugarWhen } from "./types";

export const MMOL_FACTOR = 18.016;

export const WHEN_LABEL: Record<SugarWhen, string> = {
  fasting: "Fasting",
  before: "Before a meal",
  after: "After a meal (2h)",
  bedtime: "Bedtime",
  random: "Random",
};

export const WHEN_ORDER: SugarWhen[] = ["fasting", "before", "after", "bedtime", "random"];

export type SugarBand = "very-low" | "low" | "in-target" | "high" | "very-high";

export const BAND_LABEL: Record<SugarBand, string> = {
  "very-low": "Very low",
  low: "Low",
  "in-target": "In target",
  high: "High",
  "very-high": "Very high",
};

/** Colours for dots and pills (work on light and dark). */
export const BAND_COLOUR: Record<SugarBand, string> = {
  "very-low": "#B91C1C",
  low: "#D97706",
  "in-target": "var(--accent-ink)",
  high: "#D97706",
  "very-high": "#B91C1C",
};

/** Upper target limit for this time of day. */
export function targetMax(when: SugarWhen): number {
  return when === "fasting" || when === "before" ? 130 : when === "bedtime" ? 180 : 179;
}

export function sugarBand(mgdl: number, when: SugarWhen): SugarBand {
  if (mgdl < 54) return "very-low";
  if (mgdl < 70) return "low";
  if (mgdl >= 300) return "very-high";
  return mgdl <= targetMax(when) ? "in-target" : "high";
}

export function isUrgent(b: SugarBand) {
  return b === "very-low" || b === "very-high";
}

export type SugarUnit = "mgdl" | "mmol";

export function toMgdl(value: number, unit: SugarUnit): number {
  return unit === "mmol" ? Math.round(value * MMOL_FACTOR) : Math.round(value);
}

export function fromMgdl(mgdl: number, unit: SugarUnit): string {
  return unit === "mmol" ? (mgdl / MMOL_FACTOR).toFixed(1) : String(Math.round(mgdl));
}

export const UNIT_LABEL: Record<SugarUnit, string> = { mgdl: "mg/dL", mmol: "mmol/L" };

/** Is the typed value believable? */
export function validSugar(mgdl: number): boolean {
  return Number.isFinite(mgdl) && mgdl >= 20 && mgdl <= 600;
}

export interface SugarStats {
  last?: SugarReading;
  fastingAvg: number | null;
  fastingCount: number;
  inTargetPct: number | null;
  count: number;
}

/** Last reading, fasting average and % in target over the last 14 days. */
export function sugarStats(readings: SugarReading[], today: string, days = 14): SugarStats {
  const sorted = [...readings].sort((a, b) => (a.at < b.at ? 1 : -1));
  const since = addDays(today, -(days - 1));
  const recent = sorted.filter((r) => r.at.slice(0, 10) >= since && r.at.slice(0, 10) <= today);
  const fasting = recent.filter((r) => r.when === "fasting").map((r) => r.value);
  const inTarget = recent.filter((r) => sugarBand(r.value, r.when) === "in-target").length;
  return {
    last: sorted[0],
    fastingAvg: fasting.length ? Math.round(fasting.reduce((a, b) => a + b, 0) / fasting.length) : null,
    fastingCount: fasting.length,
    inTargetPct: recent.length ? Math.round((inTarget / recent.length) * 100) : null,
    count: recent.length,
  };
}
