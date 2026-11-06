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
