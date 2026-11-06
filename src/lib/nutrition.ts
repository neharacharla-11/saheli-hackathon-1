import type { Phase } from "./cycle";
import type { Profile } from "./types";

export const ACTIVITY_FACTOR: Record<string, number> = {
  low: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const ACTIVITY_LABEL: Record<string, string> = {
  low: "Mostly sitting",
  light: "Light (walks, housework)",
  moderate: "Moderate (exercise 3-4 days)",
  active: "Active (exercise most days)",
};

/** Mifflin-St Jeor for women: 10 x kg + 6.25 x cm - 5 x age - 161. */
export function bmr(weightKg: number, heightCm: number, age: number): number {
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

/** Why automatic targets are switched off for her, or null if they're fine to show. */
export function coachOnlyReason(p: Pick<Profile, "stage" | "safety"> | null | undefined): string | null {
  if (!p) return null;
  if (p.stage === "first-period") return "growing";
  if (p.stage === "pregnancy" || p.safety?.pregnant) return "pregnancy";
  if (p.stage === "postpartum" || p.safety?.breastfeeding) return "breastfeeding";
  if (p.safety?.eatingConcerns) return "eating";
  if (p.safety?.medicalCondition || (p.safety?.conditions?.length ?? 0) > 0) return "condition";
  return null;
}

export interface Targets {
  bmr: number;
  maintenance: number;
  kcal: number; // today's target, never below BMR
  lutealExtra: number; // 0 or 100
  deficit: number; // kcal taken off maintenance for a weight-loss goal
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fibre: number; // g
}

/**
 * Daily targets. Returns null when we can't or shouldn't calculate
 * (missing numbers, or a case where her coach sets the plan).
 */
export function dailyTargets(p: Profile | null | undefined, phase: Phase | null): Targets | null {
  if (!p || coachOnlyReason(p)) return null;
  const { weightKg, heightCm, age } = p;
  if (!weightKg || !heightCm || !age || age < 18) return null;

  const base = bmr(weightKg, heightCm, age);
  const maintenance = Math.round(base * (ACTIVITY_FACTOR[p.activity ?? "light"] ?? 1.375));

  let deficit = 0;
  let target = maintenance;
  if (p.goal === "lose") {
    // Gentle: about 15% off, at most 500 kcal, and never below BMR.
    deficit = Math.min(500, Math.round(maintenance * 0.15));
    target = Math.max(base, maintenance - deficit);
    deficit = maintenance - target;
  } else if (p.goal === "gain" || p.goal === "strength") {
    target = maintenance + (p.goal === "gain" ? 250 : 150);
  }

  const lutealExtra = phase === "luteal" ? 100 : 0;
  const kcal = roundTo(Math.max(base, target) + lutealExtra, 5);

  const perKg = p.goal === "lose" || p.goal === "strength" ? 1.4 : p.goal === "gain" ? 1.3 : 1.2;
  const protein = Math.round(weightKg * perKg);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fibre = Math.max(25, Math.round((kcal / 1000) * 14));

  return { bmr: base, maintenance, kcal, lutealExtra, deficit, protein, carbs, fat, fibre };
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

export function kgToLb(kg: number) {
  return kg * 2.20462;
}
export function lbToKg(lb: number) {
  return lb / 2.20462;
}
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const total = cm / 2.54;
  let ft = Math.floor(total / 12);
  let inch = Math.round(total - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}
export function ftInToCm(ft: number, inch: number) {
  return (ft * 12 + inch) * 2.54;
}
