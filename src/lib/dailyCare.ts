import type { Phase } from "./cycle";
import { addDays, daysBetween } from "./dates";
import type { CustomSupplement, DayLog, Profile } from "./types";

/* ---------------- Who sees weight ---------------- */

/**
 * Weight is hidden for girls with first periods, in pregnancy (it has its own
 * weight-gain log) and whenever she ticked eating concerns.
 */
export function canShowWeight(p: Pick<Profile, "stage" | "safety"> | null | undefined): boolean {
  if (!p) return false;
  if (p.safety?.eatingConcerns) return false;
  if (p.stage === "first-period") return false;
  if (p.stage === "pregnancy" || p.safety?.pregnant) return false;
  return true;
}

export const KG_PER_LB = 0.45359237;

export function toDisplayWeight(kg: number, units: Profile["units"] | undefined): number {
  return units === "imperial" ? Math.round((kg / KG_PER_LB) * 10) / 10 : Math.round(kg * 10) / 10;
}

export function fromDisplayWeight(value: number, units: Profile["units"] | undefined): number {
  return units === "imperial" ? Math.round(value * KG_PER_LB * 100) / 100 : Math.round(value * 100) / 100;
}

export function weightUnit(units: Profile["units"] | undefined): "kg" | "lb" {
  return units === "imperial" ? "lb" : "kg";
}

/** A believable adult weight in kg. */
export function validWeightKg(kg: number): boolean {
  return Number.isFinite(kg) && kg >= 25 && kg <= 300;
}

export interface WeightSummary {
  last?: { date: string; kg: number };
  /** Change from the weigh-in closest to 7 days before the latest one. */
  weekChange?: number;
  /** Change across the last 90 days. */
  change90?: number;
}

export function weightSummary(weights: Record<string, number>, today: string): WeightSummary {
  const dates = Object.keys(weights)
    .filter((d) => d <= today)
    .sort();
  if (!dates.length) return {};
  const lastDate = dates[dates.length - 1];
  const last = { date: lastDate, kg: weights[lastDate] };
  const weekAgo = addDays(lastDate, -7);
  // The weigh-in nearest to a week earlier, within 3 days either side.
  const candidates = dates.filter((d) => d < lastDate && Math.abs(daysBetween(d, weekAgo)) <= 3);
  const ref = candidates.sort((a, b) => Math.abs(daysBetween(a, weekAgo)) - Math.abs(daysBetween(b, weekAgo)))[0];
  const in90 = dates.filter((d) => d >= addDays(today, -90));
  return {
    last,
    weekChange: ref ? round1(last.kg - weights[ref]) : undefined,
    change90: in90.length >= 2 ? round1(weights[in90[in90.length - 1]] - weights[in90[0]]) : undefined,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/* ---------------- The daily checklist ---------------- */

export interface ChecklistItem {
  id: string;
  name: string;
  line: string; // small line under the name on the Checklist page
  kind: "supplement" | "habit" | "medicine";
  focus?: boolean; // "Focus now" for her phase
  when?: string; // for her own medicines: "After lunch"
}

const SUPPLEMENTS: { id: string; name: string }[] = [
  { id: "iron", name: "Iron" },
  { id: "vitd", name: "Vitamin D" },
  { id: "b12", name: "Vitamin B12" },
  { id: "omega3", name: "Omega-3" },
  { id: "magnesium", name: "Magnesium" },
];

/** The supplement worth a little extra attention in each phase. */
export const FOCUS_BY_PHASE: Record<Phase, string> = {
  period: "iron",
  follicular: "b12",
  ovulation: "omega3",
  luteal: "magnesium",
};

export const HABITS: ChecklistItem[] = [
  { id: "water", name: "8 glasses of water", line: "Ticks itself when you fill 8 glasses", kind: "habit" },
  { id: "sleep", name: "7+ hours of sleep", line: "Last night counts", kind: "habit" },
  { id: "move", name: "20 minutes of movement", line: "A walk, yoga or today's workout", kind: "habit" },
];

/**
 * Her checklist for today: supplements (only as advised by her doctor),
 * water, sleep, movement and her own medicines.
 */
export function checklistItems(
  profile: Pick<Profile, "stage"> | null | undefined,
  phase: Phase | null,
  custom: CustomSupplement[] = [],
): ChecklistItem[] {
  const girl = profile?.stage === "first-period";
  const items: ChecklistItem[] = [];
  if (!girl) {
    const focus = phase ? FOCUS_BY_PHASE[phase] : profile?.stage === "menopause" ? "vitd" : undefined;
    for (const s of SUPPLEMENTS) {
      items.push({ id: s.id, name: s.name, line: "Food or supplement, as advised by your doctor", kind: "supplement", focus: s.id === focus });
    }
  }
  items.push(...HABITS);
  for (const c of custom) {
    items.push({
      id: `own-${c.id}`,
      name: c.dose ? `${c.name} (${c.dose})` : c.name,
      line: "As advised by your doctor",
      kind: "medicine",
      when: c.time ? `${c.when} · ${formatTime(c.time)}` : c.when,
    });
  }
  return items;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${suffix}`;
}

/** Ticked ids for a day, with water ticked automatically at 8 glasses. */
export function tickedFor(ticks: string[] | undefined, glasses: number | undefined): Set<string> {
  const set = new Set(ticks ?? []);
  if ((glasses ?? 0) >= WATER_GOAL) set.add("water");
  else set.delete("water");
  return set;
}

export const WATER_GOAL = 8;

export const WHEN_OPTIONS = [
  "Morning, empty stomach",
  "With breakfast",
  "After lunch",
  "Evening",
  "With dinner",
  "At bedtime",
];

export const WHEN_TIME: Record<string, string> = {
  "Morning, empty stomach": "07:00",
  "With breakfast": "08:30",
  "After lunch": "14:00",
  Evening: "18:00",
  "With dinner": "20:30",
  "At bedtime": "22:00",
};

/* ---------------- 10-second check-in ---------------- */

/** Days in a row she did the 10-second check-in, counting back from today (or yesterday if today isn't done yet). */
export function checkinStreak(quick: Record<string, boolean>, today: string): number {
  let d = quick[today] ? today : addDays(today, -1);
  let n = 0;
  while (quick[d] && n < 3650) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/* ---------------- "Saheli noticed a pattern" ---------------- */

export interface Pattern {
  id: string;
  title: string;
  line: string;
  tests: string[];
}

/** Tired on heavy-flow days: worth asking about iron. Needs at least 3 heavy days. */
export function tiredOnHeavyDays(logs: Record<string, DayLog>, today: string, days = 180): Pattern | null {
  let heavy = 0;
  let tired = 0;
  for (let i = 0; i < days; i++) {
    const l = logs[addDays(today, -i)];
    if (l?.flow !== "heavy") continue;
    heavy++;
    if (l.symptoms?.includes("Fatigue") || (l.energy !== undefined && l.energy <= 2)) tired++;
  }
  if (heavy < 3 || tired / heavy < 0.5) return null;
  return {
    id: "tired-heavy",
    title: "Tired on heavy-flow days",
    line: `You felt drained on ${tired} of your ${heavy} heavy-flow days. Ask your doctor about iron tests.`,
    tests: ["Haemoglobin", "Ferritin"],
  };
}
