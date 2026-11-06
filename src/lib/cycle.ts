import { addDays, daysBetween } from "./dates";

export type Phase = "period" | "follicular" | "ovulation" | "luteal";

export const PHASE_LABEL: Record<Phase, string> = {
  period: "Period",
  follicular: "Follicular",
  ovulation: "Ovulation window",
  luteal: "Luteal",
};

export const PHASE_VAR: Record<Phase, string> = {
  period: "var(--ph-period)",
  follicular: "var(--ph-follicular)",
  ovulation: "var(--ph-ovulation)",
  luteal: "var(--ph-luteal)",
};

export interface PhaseRanges {
  period: [number, number];
  follicular: [number, number];
  ovulation: [number, number];
  luteal: [number, number];
}

/**
 * Day ranges for one cycle. Ovulation is about 14 days before the next period;
 * the window is the 2 days before it, the day itself and the day after.
 */
export function phaseRanges(cycleLength = 28, periodLength = 5): PhaseRanges {
  const L = clamp(Math.round(cycleLength), 20, 60);
  const P = clamp(Math.round(periodLength), 2, 10);
  const ov = L - 14;
  const winStart = Math.max(P + 1, ov - 2);
  const winEnd = Math.min(L - 1, ov + 1);
  return {
    period: [1, P],
    follicular: [P + 1, Math.max(P + 1, winStart - 1)],
    ovulation: [winStart, winEnd],
    luteal: [winEnd + 1, L],
  };
}

export function phaseForDay(day: number, cycleLength = 28, periodLength = 5): Phase {
  const r = phaseRanges(cycleLength, periodLength);
  if (day <= r.period[1]) return "period";
  if (day >= r.ovulation[0] && day <= r.ovulation[1]) return "ovulation";
  if (day < r.ovulation[0]) return "follicular";
  return "luteal";
}

/** Cycle day (1-based) for a date, from the latest period start on or before it. */
export function cycleDay(periodStarts: string[], onDate: string, cycleLength = 28): number | null {
  const starts = [...periodStarts].filter((s) => s <= onDate).sort();
  const last = starts[starts.length - 1];
  if (!last) return null;
  const diff = daysBetween(last, onDate);
  // If she hasn't logged a new period, keep counting forward within predicted cycles.
  return (diff % Math.max(cycleLength, 1)) + 1;
}

export function nextPeriod(periodStarts: string[], onDate: string, cycleLength = 28): string | null {
  const starts = [...periodStarts].filter((s) => s <= onDate).sort();
  const last = starts[starts.length - 1];
  if (!last) return null;
  let next = addDays(last, cycleLength);
  while (next <= onDate) next = addDays(next, cycleLength);
  return next;
}

/** Average length between logged period starts, or null with fewer than 2 starts. */
export function averageCycleLength(periodStarts: string[]): number | null {
  const s = [...new Set(periodStarts)].sort();
  if (s.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < s.length; i++) gaps.push(daysBetween(s[i - 1], s[i]));
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/* ---------------- Cycle engine (Phase 2) ---------------- */

/** Gaps between consecutive logged period starts, oldest first. */
export function cycleGaps(periodStarts: string[]): number[] {
  const s = [...new Set(periodStarts)].sort();
  const gaps: number[] = [];
  for (let i = 1; i < s.length; i++) gaps.push(daysBetween(s[i - 1], s[i]));
  return gaps;
}

/**
 * Her own cycle length: the average of her last 6 believable cycles (15-90 days),
 * falling back to what she told us.
 */
export function learnedCycleLength(periodStarts: string[], fallback = 28): number {
  const gaps = cycleGaps(periodStarts).filter((g) => g >= 15 && g <= 90).slice(-6);
  if (!gaps.length) return clamp(Math.round(fallback), 20, 60);
  return clamp(Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length), 20, 60);
}

/** Estimated ovulation day (cycle day), about 14 days before the next period. */
export function ovulationDay(cycleLength = 28): number {
  return Math.max(8, Math.round(cycleLength) - 14);
}

/** Fertile window for the cycle that contains `onDate`: 5 days before ovulation to the day after. */
export function fertileWindow(
  periodStarts: string[],
  onDate: string,
  cycleLength = 28,
): { start: string; end: string; ovulation: string } | null {
  const day = cycleDay(periodStarts, onDate, cycleLength);
  if (day === null) return null;
  const cycleStart = addDays(onDate, -(day - 1));
  const ov = addDays(cycleStart, ovulationDay(cycleLength) - 1);
  return { start: addDays(ov, -5), end: addDays(ov, 1), ovulation: ov };
}

/** The ovulation window shown on Today and Cycle (the 4 days of the ovulation phase). */
export function ovulationWindow(
  periodStarts: string[],
  onDate: string,
  cycleLength = 28,
  periodLength = 5,
): { start: string; end: string } | null {
  const day = cycleDay(periodStarts, onDate, cycleLength);
  if (day === null) return null;
  const cycleStart = addDays(onDate, -(day - 1));
  const r = phaseRanges(cycleLength, periodLength);
  return { start: addDays(cycleStart, r.ovulation[0] - 1), end: addDays(cycleStart, r.ovulation[1] - 1) };
}

export interface CycleInfo {
  day: number;
  phase: Phase;
  cycleLength: number;
  periodLength: number;
  nextPeriod: string;
  daysToNext: number;
  ovulation: { start: string; end: string };
  fertile: { start: string; end: string; ovulation: string };
  averageLength: number | null;
  loggedCycles: number;
}

/** Everything about where she is today, using her learned cycle length. */
export function cycleInfo(
  periodStarts: string[],
  onDate: string,
  statedLength = 28,
  periodLength = 5,
): CycleInfo | null {
  const L = learnedCycleLength(periodStarts, statedLength);
  const day = cycleDay(periodStarts, onDate, L);
  if (day === null) return null;
  const next = nextPeriod(periodStarts, onDate, L)!;
  return {
    day,
    phase: phaseForDay(day, L, periodLength),
    cycleLength: L,
    periodLength,
    nextPeriod: next,
    daysToNext: daysBetween(onDate, next),
    ovulation: ovulationWindow(periodStarts, onDate, L, periodLength)!,
    fertile: fertileWindow(periodStarts, onDate, L)!,
    averageLength: averageCycleLength(periodStarts),
    loggedCycles: cycleGaps(periodStarts).length,
  };
}

export type DayKind = "period" | "predicted" | Phase | null;

/** How a calendar date looks: a logged period day, a predicted period day, or a phase tint. */
export function dayKind(
  periodStarts: string[],
  date: string,
  today: string,
  cycleLength = 28,
  periodLength = 5,
): DayKind {
  const last = [...periodStarts].sort().filter((s) => s <= date).pop();
  if (!last) return null;
  const since = daysBetween(last, date);
  if (since < periodLength) return "period"; // logged start, and the days of that period
  if (date > today) {
    // Future: repeat her cycle forward from the last logged start.
    const d = since % cycleLength;
    if (d < periodLength) return "predicted";
    return phaseForDay(d + 1, cycleLength, periodLength);
  }
  if (since >= cycleLength) return null; // a gap she hasn't logged
  return phaseForDay(since + 1, cycleLength, periodLength);
}
