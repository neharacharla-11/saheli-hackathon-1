import { addDays } from "./dates";
import { cycleDay, phaseForDay, type Phase } from "./cycle";
import type { DayLog, Mood } from "./types";

/* ---------------- Breathing ---------------- */

export type BreathKind = "in" | "hold" | "out" | "rest";

export interface BreathStep {
  kind: BreathKind;
  seconds: number;
}

export interface BreathPattern {
  id: "calm" | "box" | "478";
  label: string;
  line: string;
  steps: BreathStep[];
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: "calm",
    label: "Calm breath",
    line: "In for 4, out for 6. A longer out-breath tells your body it's safe.",
    steps: [
      { kind: "in", seconds: 4 },
      { kind: "out", seconds: 6 },
    ],
  },
  {
    id: "box",
    label: "Box breathing",
    line: "In 4, hold 4, out 4, hold 4. Steadying when you feel on edge.",
    steps: [
      { kind: "in", seconds: 4 },
      { kind: "hold", seconds: 4 },
      { kind: "out", seconds: 4 },
      { kind: "rest", seconds: 4 },
    ],
  },
  {
    id: "478",
    label: "4-7-8 for sleep",
    line: "In 4, hold 7, out slowly for 8. Try it lying down at bedtime.",
    steps: [
      { kind: "in", seconds: 4 },
      { kind: "hold", seconds: 7 },
      { kind: "out", seconds: 8 },
    ],
  },
];

export function cycleSeconds(p: BreathPattern): number {
  return p.steps.reduce((a, s) => a + s.seconds, 0);
}

export interface BreathState {
  kind: BreathKind;
  label: string;
  progress: number; // 0-1 within the step
  scale: number; // 0-1, inner circle size
  secondsLeft: number; // in this step
}

const SMALL = 0;
const BIG = 1;

/** Where she is in the pattern after `elapsed` seconds. */
export function breathAt(p: BreathPattern, elapsed: number): BreathState {
  const total = cycleSeconds(p);
  let t = ((elapsed % total) + total) % total;
  for (const s of p.steps) {
    if (t < s.seconds) {
      const progress = t / s.seconds;
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
      const scale = s.kind === "in" ? SMALL + (BIG - SMALL) * ease : s.kind === "out" ? BIG - (BIG - SMALL) * ease : s.kind === "hold" ? BIG : SMALL;
      const label = s.kind === "in" ? "Breathe in" : s.kind === "out" ? "Breathe out" : "Hold";
      return { kind: s.kind, label, progress, scale, secondsLeft: Math.ceil(s.seconds - t) };
    }
    t -= s.seconds;
  }
  return { kind: "rest", label: "Hold", progress: 0, scale: SMALL, secondsLeft: 0 };
}

/* ---------------- PMDD check ---------------- */

export const PMDD_QUESTIONS: { text: string; core?: boolean }[] = [
  { text: "Sudden mood swings, feeling sad or tearful", core: true },
  { text: "Irritable or angry, more arguments than usual", core: true },
  { text: "Feeling hopeless, very low or hard on yourself", core: true },
  { text: "Tense, anxious or on edge", core: true },
  { text: "Less interest in work, friends or things you enjoy" },
  { text: "Hard to concentrate" },
  { text: "Tired, with very little energy" },
  { text: "Big changes in appetite, or strong cravings" },
  { text: "Sleeping much more or much less" },
  { text: "Feeling overwhelmed or out of control" },
  { text: "Body symptoms: sore breasts, bloating, aches" },
];

export const PMDD_SCALE = ["Not at all", "Mild", "Moderate", "Severe"];

export type PmddLevel = "flag" | "strong" | "mild";

export interface PmddResult {
  level: PmddLevel;
  title: string;
  body: string;
  strongCount: number;
  hopelessSevere: boolean;
}

/**
 * Loosely follows the shape of the clinical criteria: 5 or more symptoms at moderate or worse,
 * at least one of them a mood symptom, and they get in the way of her life. A flag, not a diagnosis.
 */
export function scorePmdd(answers: number[], interferes: boolean): PmddResult {
  const strong = answers.map((a, i) => ({ a, i })).filter((x) => x.a >= 2);
  const coreStrong = strong.some((x) => PMDD_QUESTIONS[x.i]?.core);
  const hopelessSevere = (answers[2] ?? 0) >= 3;
  if (strong.length >= 5 && coreStrong && interferes) {
    return {
      level: "flag",
      strongCount: strong.length,
      hopelessSevere,
      title: "Your answers match a pattern doctors call PMDD",
      body: "Premenstrual dysphoric disorder is a strong reaction to normal hormone changes before a period. It's real and very treatable. This is a flag, not a diagnosis: track your moods for two cycles and show your doctor.",
    };
  }
  if (strong.length >= 3 || (strong.length >= 1 && interferes)) {
    return {
      level: "strong",
      strongCount: strong.length,
      hopelessSevere,
      title: "Some strong premenstrual symptoms",
      body: "A few symptoms hit you hard before your period. Gentle movement, steady meals, good sleep and less caffeine in your luteal phase can help. If they keep getting in your way, talk to your doctor. This is a flag, not a diagnosis.",
    };
  }
  return {
    level: "mild",
    strongCount: strong.length,
    hopelessSevere,
    title: "Mild or few premenstrual symptoms",
    body: "Some change before your period is normal. Keep checking in, and look again if things change. This is a flag, not a diagnosis.",
  };
}

/* ---------------- Moods and patterns ---------------- */

export const MOOD_SCORE: Record<Mood, number> = {
  great: 5,
  energetic: 5,
  good: 4,
  calm: 4,
  okay: 3,
  low: 2,
  anxious: 2,
  irritable: 2,
  stressed: 1,
  overwhelmed: 1,
};

export const HEAVY_MOODS: Mood[] = ["low", "anxious", "irritable", "overwhelmed", "stressed"];

export interface PhaseStats {
  phase: Phase;
  days: number;
  energy: number | null; // average 1-5
  stress: number | null;
  mood: number | null; // average mood score 1-5
  heavyShare: number | null; // share of days with a heavy mood
}

const PHASES: Phase[] = ["period", "follicular", "ovulation", "luteal"];

function avg(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/** Average energy, stress and mood by phase from her logs. */
export function statsByPhase(
  logs: Record<string, DayLog>,
  periodStarts: string[],
  cycleLength: number,
  periodLength: number,
): PhaseStats[] {
  const buckets: Record<Phase, DayLog[]> = { period: [], follicular: [], ovulation: [], luteal: [] };
  for (const [date, log] of Object.entries(logs)) {
    const day = cycleDay(periodStarts, date, cycleLength);
    if (day === null) continue;
    buckets[phaseForDay(day, cycleLength, periodLength)].push(log);
  }
  return PHASES.map((phase) => {
    const l = buckets[phase];
    const moods = l.filter((x) => x.mood);
    return {
      phase,
      days: l.length,
      energy: avg(l.filter((x) => x.energy).map((x) => x.energy as number)),
      stress: avg(l.filter((x) => x.stress).map((x) => x.stress as number)),
      mood: avg(moods.map((x) => MOOD_SCORE[x.mood as Mood])),
      heavyShare: moods.length ? moods.filter((x) => HEAVY_MOODS.includes(x.mood as Mood)).length / moods.length : null,
    };
  });
}

const PHASE_WORD: Record<Phase, string> = {
  period: "your period",
  follicular: "your follicular phase",
  ovulation: "your ovulation window",
  luteal: "your luteal phase",
};

/** Plain sentences about her patterns. Needs a few days in each phase. */
export function patternSentences(stats: PhaseStats[]): string[] {
  const ok = stats.filter((s) => s.days >= 3);
  if (ok.length < 3) return [];
  const out: string[] = [];
  const withEnergy = ok.filter((s) => s.energy !== null);
  if (withEnergy.length >= 2) {
    const hi = withEnergy.reduce((a, b) => ((b.energy as number) > (a.energy as number) ? b : a));
    const lo = withEnergy.reduce((a, b) => ((b.energy as number) < (a.energy as number) ? b : a));
    if ((hi.energy as number) - (lo.energy as number) >= 0.4) {
      out.push(
        `Your energy is highest in ${PHASE_WORD[hi.phase]} (${(hi.energy as number).toFixed(1)} of 5) and lowest in ${PHASE_WORD[lo.phase]} (${(lo.energy as number).toFixed(1)}).`,
      );
    } else {
      out.push("Your energy stays fairly steady across your cycle.");
    }
  }
  const withHeavy = ok.filter((s) => s.heavyShare !== null);
  if (withHeavy.length >= 2) {
    const worst = withHeavy.reduce((a, b) => ((b.heavyShare as number) > (a.heavyShare as number) ? b : a));
    const others = withHeavy.filter((s) => s !== worst);
    const otherShare = avg(others.map((s) => s.heavyShare as number)) ?? 0;
    const w = worst.heavyShare as number;
    if (w >= 0.15 && w - otherShare >= 0.08) {
      out.push(
        `Harder moods show up most in ${PHASE_WORD[worst.phase]}: ${Math.round(w * 100)}% of days, compared with ${Math.round(otherShare * 100)}% at other times. Plan gentler days then.`,
      );
    } else {
      out.push("Your moods don't follow your cycle much. Other things in life may matter more.");
    }
  }
  const withStress = ok.filter((s) => s.stress !== null);
  if (withStress.length >= 2) {
    const hi = withStress.reduce((a, b) => ((b.stress as number) > (a.stress as number) ? b : a));
    if ((hi.stress as number) >= 3.2) out.push(`Stress runs highest in ${PHASE_WORD[hi.phase]} (${(hi.stress as number).toFixed(1)} of 5). Short breathing breaks help.`);
  }
  return out;
}

export interface TrendPoint {
  date: string;
  mood: number | null;
  energy: number | null;
}

export function lastDays(logs: Record<string, DayLog>, today: string, n: number): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const l = logs[date];
    out.push({ date, mood: l?.mood ? MOOD_SCORE[l.mood] : null, energy: l?.energy ?? null });
  }
  return out;
}

/** True when at least 3 of her last 5 logged days (within 10 days) were heavy. */
export function heavyStretch(logs: Record<string, DayLog>, today: string): boolean {
  const recent: DayLog[] = [];
  for (let i = 0; i < 10 && recent.length < 5; i++) {
    const l = logs[addDays(today, -i)];
    if (l?.mood) recent.push(l);
  }
  const heavy = recent.filter((l) => (l.mood && ["low", "overwhelmed", "stressed"].includes(l.mood)) || (l.stress ?? 0) >= 5);
  return heavy.length >= 3;
}

const HARM_WORDS = [
  /\bkill(ing)? myself\b/i,
  /\bend(ing)? (my|it all|my life)\b/i,
  /\bsuicid/i,
  /\bself[- ]?harm/i,
  /\bhurt(ing)? myself\b/i,
  /\bcut(ting)? myself\b/i,
  /\b(want|wanted) to die\b/i,
  /\bdon'?t want to (live|be here|wake up)\b/i,
  /\bno reason to live\b/i,
  /\bbetter off without me\b/i,
  /\bmar jaa?n/i,
  /\bmarna chah/i,
];

/** Words that mean she may not be safe. Used to show helplines, never stored or sent. */
export function mentionsSelfHarm(text: string): boolean {
  return HARM_WORDS.some((r) => r.test(text));
}
