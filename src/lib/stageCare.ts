import { daysBetween, toISODate } from "./dates";
import type { BabyCare, BabyFeed, BabyNappy, BabySleep, MenoScore } from "./stageTypes";

/* ---------------- Baby care ---------------- */

export const EMPTY_BABY: BabyCare = { feeds: [], nappies: [], sleeps: [], activeFeed: null };

const localDate = (iso: string) => toISODate(new Date(iso));

export function minutesAgo(iso: string, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
}

export function agoLabel(iso: string, now: Date): string {
  const m = minutesAgo(iso, now);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min ago` : `${h} h ago`;
}

export function durationLabel(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const r = Math.round(min % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

export interface BabyStats {
  lastFeed?: BabyFeed;
  nextSide: "left" | "right";
  feedsToday: number;
  wetToday: number;
  dirtyToday: number;
  sleptTodayMin: number;
  asleep?: BabySleep;
}

export function babyStats(baby: BabyCare, now: Date): BabyStats {
  const today = toISODate(now);
  const feeds = [...baby.feeds].sort((a, b) => b.at.localeCompare(a.at));
  const lastBreast = feeds.find((f) => f.kind !== "bottle");
  const nappiesToday = baby.nappies.filter((n) => localDate(n.at) === today);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let slept = 0;
  for (const s of baby.sleeps) {
    const a = Math.max(new Date(s.start).getTime(), startOfDay);
    const b = s.end ? new Date(s.end).getTime() : now.getTime();
    if (b > a) slept += (b - a) / 60000;
  }
  return {
    lastFeed: feeds[0],
    nextSide: lastBreast?.kind === "left" ? "right" : "left",
    feedsToday: baby.feeds.filter((f) => localDate(f.at) === today).length,
    wetToday: nappiesToday.filter((n) => n.kind !== "dirty").length,
    dirtyToday: nappiesToday.filter((n) => n.kind !== "wet").length,
    sleptTodayMin: Math.round(slept),
    asleep: baby.sleeps.find((s) => !s.end),
  };
}

/** After 6 PM, from day 5 on: fewer than 6 wet nappies today is worth a call. */
export function fewWetNappies(stats: BabyStats, babyBirthDate: string | undefined, now: Date): boolean {
  if (!babyBirthDate) return false;
  const ageDays = daysBetween(babyBirthDate, toISODate(now));
  return ageDays > 5 && now.getHours() >= 18 && stats.wetToday < 6;
}

export type BabyEvent =
  | { type: "feed"; id: string; at: string; item: BabyFeed }
  | { type: "nappy"; id: string; at: string; item: BabyNappy }
  | { type: "sleep"; id: string; at: string; item: BabySleep };

export function recentEvents(baby: BabyCare, n = 8): BabyEvent[] {
  const all: BabyEvent[] = [
    ...baby.feeds.map((f) => ({ type: "feed" as const, id: f.id, at: f.at, item: f })),
    ...baby.nappies.map((x) => ({ type: "nappy" as const, id: x.id, at: x.at, item: x })),
    ...baby.sleeps.map((s) => ({ type: "sleep" as const, id: s.id, at: s.end ?? s.start, item: s })),
  ];
  return all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, n);
}

/* ---------------- Menopause Rating Scale ---------------- */

export const MRS_ITEMS: { id: string; label: string; hint: string }[] = [
  { id: "hot", label: "Hot flushes and sweating", hint: "Episodes of heat or sweating, day or night" },
  { id: "heart", label: "Heart racing", hint: "Unusual awareness of your heartbeat, skipping or racing" },
  { id: "sleep", label: "Sleep problems", hint: "Trouble falling asleep, waking early or often" },
  { id: "mood", label: "Low mood", hint: "Feeling down, sad, close to tears" },
  { id: "irritable", label: "Irritability", hint: "Feeling nervous, tense, quick to anger" },
  { id: "anxious", label: "Anxiety", hint: "Inner restlessness, feeling panicky" },
  { id: "tired", label: "Exhaustion", hint: "Less energy, poorer memory or focus" },
  { id: "desire", label: "Changes in desire", hint: "Changes in interest in sex or satisfaction" },
  { id: "bladder", label: "Bladder problems", hint: "Needing to pass urine often, leaking" },
  { id: "dryness", label: "Vaginal dryness", hint: "Dryness, burning, discomfort during sex" },
  { id: "joints", label: "Joint and muscle aches", hint: "Pain in joints, stiffness" },
];

export const MRS_LEVELS = ["None", "Mild", "Moderate", "Severe", "Very severe"];
export const MRS_MAX = MRS_ITEMS.length * 4; // 44

export function mrsTotal(s: MenoScore): number {
  return MRS_ITEMS.reduce((a, it) => a + Math.min(4, Math.max(0, Math.round(s.scores[it.id] ?? 0))), 0);
}

export function mrsBand(total: number): { label: string; tone: "green" | "soft" | "amber" | "red" } {
  if (total <= 4) return { label: "Little or none", tone: "green" };
  if (total <= 8) return { label: "Mild", tone: "soft" };
  if (total <= 16) return { label: "Moderate", tone: "amber" };
  return { label: "Severe", tone: "red" };
}

/** Items scored Moderate or more, strongest first. */
export function mostBothersome(s: MenoScore, n = 3): { id: string; label: string; score: number }[] {
  return MRS_ITEMS.map((it) => ({ id: it.id, label: it.label, score: s.scores[it.id] ?? 0 }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/* ---------------- After birth ---------------- */

export function weeksSince(birth: string, today: string): { weeks: number; days: number } {
  const d = Math.max(0, daysBetween(birth, today));
  return { weeks: Math.floor(d / 7), days: d };
}

export function sinceBirthTitle(birth: string, today: string): string {
  const { weeks, days } = weeksSince(birth, today);
  if (days < 14) return days === 1 ? "1 day since birth" : `${days} days since birth`;
  if (weeks < 52) return `${weeks} weeks since birth`;
  return "A year and more since birth";
}

/** The postpartum mood screen: 5 answers 0-3. Question 5 is thoughts of harm. */
export function postpartumScreen(answers: number[]): "urgent" | "talk" | "ok" {
  if ((answers[4] ?? 0) > 0) return "urgent";
  const sum = answers.slice(0, 4).reduce((a, b) => a + b, 0);
  if (sum >= 5 || answers.slice(0, 4).some((a) => a === 3)) return "talk";
  return "ok";
}
