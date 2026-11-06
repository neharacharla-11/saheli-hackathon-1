import type { CoachPlan, PlanRequestDetails, PlanStatus } from "@/lib/types";

export interface CoachRecord {
  token: string;
  secretHash: string;
  kind: "diet" | "workout";
  details: PlanRequestDetails;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  coachNote?: string;
  plan?: CoachPlan; // what she sees (only once marked ready)
  draft?: CoachPlan; // Neha's work in progress, never sent to her phone
}

export const REQ_KEY = (token: string) => `coach:req:${token}`;
export const INDEX_KEY = "coach:index";
export const PASS_KEY = "coach:passcode";
export const TTL = 60 * 60 * 24 * 200; // about 6 months

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const n = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && isFinite(v) && v >= lo && v <= hi ? Math.round(v * 10) / 10 : undefined;

export const GOALS = [
  "Lose fat",
  "Gain healthy weight",
  "Eat healthier",
  "More energy",
  "Better periods",
  "PCOS support",
  "Pregnancy nutrition",
  "Breastfeeding",
  "Build muscle",
  "Better digestion",
  "Get stronger",
  "Move more",
  "Less pain",
  "Lose weight gently",
  "Bone health",
  "Better sleep",
];

/** Keep only fields we know, with sane lengths. */
export function cleanDetails(raw: unknown): PlanRequestDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = s(r.name, 40);
  if (!name) return null;
  const goals = Array.isArray(r.goals) ? r.goals.filter((g): g is string => typeof g === "string" && GOALS.includes(g)).slice(0, 10) : [];
  if (!goals.length) return null;
  const shareNumbers = r.shareNumbers === true;
  const nums = (r.numbers && typeof r.numbers === "object" ? r.numbers : {}) as Record<string, unknown>;
  return {
    name,
    goals,
    mealsPerDay: n(r.mealsPerDay, 3, 6),
    daysPerWeek: n(r.daysPerWeek, 1, 7),
    place: s(r.place, 20),
    cuisine: s(r.cuisine, 120),
    allergies: s(r.allergies, 200),
    dislikes: s(r.dislikes, 200),
    routine: s(r.routine, 400),
    notes: s(r.notes, 800),
    shareNumbers,
    numbers: shareNumbers
      ? {
          age: n(nums.age, 10, 100),
          heightCm: n(nums.heightCm, 100, 230),
          weightKg: n(nums.weightKg, 25, 250),
          activity: s(nums.activity, 40),
          stage: s(nums.stage, 60),
          diet: s(nums.diet, 40),
          phase: s(nums.phase, 40),
          country: s(nums.country, 40),
        }
      : undefined,
  };
}

export function cleanPlan(raw: unknown): CoachPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const meals = Array.isArray(r.meals)
    ? r.meals
        .map((m) => {
          const mm = (m ?? {}) as Record<string, unknown>;
          return { slot: s(mm.slot, 40) ?? "", title: s(mm.title, 80) || undefined, items: s(mm.items, 1500) ?? "" };
        })
        .filter((m) => m.slot && m.items)
        .slice(0, 14)
    : [];
  if (!meals.length) return null;
  return { intro: s(r.intro, 1500) ?? "", meals, writtenAt: new Date().toISOString() };
}

/** What the woman's phone gets back: never the secret hash. */
export function publicView(r: CoachRecord) {
  return { token: r.token, kind: r.kind, status: r.status, coachNote: r.coachNote, plan: r.plan, updatedAt: r.updatedAt };
}
