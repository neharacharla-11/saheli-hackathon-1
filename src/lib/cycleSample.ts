import { cycleDay, phaseForDay } from "./cycle";
import { addDays } from "./dates";
import { canShowWeight } from "./dailyCare";
import type { CustomSupplement, ProfileData } from "./types";

/** Made-up medicines for the sample women's checklists. */
const MEDICINES: Record<string, Omit<CustomSupplement, "id">[]> = {
  priya: [{ name: "Iron + folic acid", dose: "1 tablet", when: "After lunch", time: "14:00" }],
  pooja: [{ name: "Thyroid tablet", dose: "50 mcg", when: "Morning, empty stomach", time: "07:00" }],
  farida: [{ name: "Diabetes tablet", dose: "500 mg", when: "With dinner", time: "20:30" }],
  sunita: [{ name: "Calcium + vitamin D3", dose: "1 tablet", when: "With dinner", time: "20:30" }],
  lata: [{ name: "Calcium + vitamin D3", dose: "1 tablet", when: "With dinner", time: "20:30" }],
  ananya: [{ name: "Folic acid + iron", dose: "1 tablet", when: "After lunch", time: "14:00" }],
  kavya: [{ name: "Calcium", dose: "1 tablet", when: "With dinner", time: "20:30" }],
};

/** Weight change across 90 days (kg, negative = lost). */
const TREND: Record<string, number> = { rekha: -3.2, kavya: -2.1, sunita: -0.8, priya: -1.1, farida: -1.6, pooja: -0.6 };

/** Check-in streaks (days in a row before today). */
const STREAK: Record<string, number> = { priya: 9, nisha: 4, rekha: 12, meera: 6, pooja: 7, farida: 5, sara: 15, kavya: 3, sunita: 8, lata: 10, ananya: 6, anaya: 2 };

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Today and Checklist sample data: 3 months of weigh-ins (not for Ananya or Anaya),
 * water, checklist ticks, a check-in streak and her own medicines. Nothing here is real.
 */
export function withCycleSample(key: string, data: ProfileData, today: string): ProfileData {
  const p = data.profile;
  if (!p) return data;
  const rand = rng(`cycle-${key}`);
  const out: ProfileData = { ...data };

  // Her own medicines
  out.customSupplements = (MEDICINES[key] ?? []).map((m, i) => ({ ...m, id: `${key}-med${i}` }));

  // Weigh-ins: about 3 a week for 90 days, ending yesterday at her current weight.
  if (canShowWeight(p) && p.weightKg) {
    const weights: Record<string, number> = { ...data.weights };
    const trend = TREND[key] ?? 0.2;
    for (let i = 90; i >= 1; i--) {
      if (i > 1 && rand() > 0.42) continue;
      const date = addDays(today, -i);
      const base = p.weightKg - trend * (i / 90);
      const cd = data.periodStarts.length ? cycleDay(data.periodStarts, date, p.cycleLength) : null;
      const ph = cd ? phaseForDay(cd, p.cycleLength, p.periodLength) : null;
      // Water weight: a little up late in the luteal phase and on period days.
      const wobble = ph === "luteal" && cd && cd > p.cycleLength - 5 ? 0.6 : ph === "period" ? 0.4 : 0;
      weights[date] = Math.round((base + wobble + (rand() - 0.5) * 0.5) * 10) / 10;
    }
    weights[addDays(today, -1)] = p.weightKg;
    out.weights = weights;
  }

  // Water and checklist ticks for the last 30 days, a little lighter today.
  const water: Record<string, number> = { ...data.water };
  const checklist: Record<string, string[]> = { ...data.checklist };
  const ids = ["iron", "vitd", "b12", "omega3", "magnesium", "sleep", "move", ...out.customSupplements.map((c) => `own-${c.id}`)];
  for (let i = 30; i >= 1; i--) {
    const date = addDays(today, -i);
    water[date] = 4 + Math.floor(rand() * 5);
    checklist[date] = ids.filter(() => rand() < 0.6);
  }
  water[today] = key === "nisha" ? 3 : 5;
  checklist[today] = key === "anaya" ? ["sleep"] : ["vitd", "sleep"];
  out.water = water;
  out.checklist = checklist;

  // 10-second check-in streak, not done yet today.
  const quick: Record<string, boolean> = { ...data.quickCheckins };
  const secs: Record<string, number> = { ...(data.checkinSeconds ?? {}) };
  for (let i = 1; i <= (STREAK[key] ?? 5); i++) {
    const date = addDays(today, -i);
    quick[date] = true;
    secs[date] = 5 + Math.floor(rand() * 6);
  }
  out.quickCheckins = quick;

  // Guided workouts: 2 so far this week and a few weeks before, so "This week" has a count.
  if (p.stage !== "first-period") {
    const start = addDays(today, -new Date(`${today}T12:00:00`).getDay());
    const days = [-20, -18, -15, -13, -11, -8, -6].map((d) => addDays(start, d));
    if (start < today) days.push(start);
    if (addDays(start, 2) < today) days.push(addDays(start, 2));
    out.workoutsDone = days.map((date) => ({ date, at: `${date}T07:30:00.000Z`, minutes: 30, title: "Home workout", mode: "sample", place: "home" as const }));
  }
  // Leave today's check-in for her to do (3 taps), keeping any symptoms already logged.
  if (out.dayLogs[today]) {
    const rest = { ...out.dayLogs[today] };
    delete rest.mood;
    delete rest.energy;
    out.dayLogs = { ...out.dayLogs, [today]: rest };
  }
  out.checkinSeconds = secs;
  return out;
}
