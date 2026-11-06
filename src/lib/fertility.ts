import { addDays, daysBetween, parseISODate } from "./dates";
import type { OpkResult } from "./stageTypes";

export const BBT_MIN_C = 35;
export const BBT_MAX_C = 38.5;
export const SHIFT_C = 0.2;
const EPS = 1e-9;

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}
export function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}

/** Check a typed temperature. Returns °C, or a kind message. */
export function parseTemperature(input: string, unit: "C" | "F"): { ok: true; c: number } | { ok: false; message: string } {
  const n = Number(input.trim().replace(",", "."));
  if (!input.trim() || !Number.isFinite(n)) return { ok: false, message: "Please type your temperature as a number, like 36.4." };
  const c = unit === "F" ? fToC(n) : n;
  if (c < BBT_MIN_C || c > BBT_MAX_C) {
    const range = unit === "F" ? "95.0 and 101.3 °F" : "35.0 and 38.5 °C";
    return {
      ok: false,
      message: `That doesn't look like a morning temperature. It should be between ${range}. Please check the thermometer and try again${c > BBT_MAX_C ? ", and if you have a fever, rest and call your doctor if it doesn't settle" : ""}.`,
    };
  }
  return { ok: true, c: Math.round(c * 100) / 100 };
}

export interface TempReading {
  date: string;
  c: number;
}

export type ThermalShift =
  | { status: "collecting"; have: number; need: number }
  | { status: "no-rise"; have: number }
  | { status: "shift"; ovulationDate: string; coverline: number; firstHighDate: string; highDates: string[] };

/**
 * The "3 over 6" rule: find 3 temperatures in a row that are all at least
 * 0.2 °C above the highest of the 6 temperatures before them. Ovulation was
 * likely the day before the first high one; that highest value is the coverline.
 * Readings are taken in date order; days she didn't log are skipped.
 */
export function detectThermalShift(readings: TempReading[]): ThermalShift {
  const r = [...readings].filter((x) => Number.isFinite(x.c)).sort((a, b) => a.date.localeCompare(b.date));
  const need = 9;
  if (r.length < need) return { status: "collecting", have: r.length, need };
  for (let i = 6; i + 2 < r.length; i++) {
    const coverline = Math.max(...r.slice(i - 6, i).map((x) => x.c));
    const three = r.slice(i, i + 3);
    if (three.every((x) => x.c - coverline >= SHIFT_C - EPS)) {
      return {
        status: "shift",
        coverline,
        firstHighDate: r[i].date,
        ovulationDate: addDays(r[i].date, -1),
        highDates: three.map((x) => x.date),
      };
    }
  }
  return { status: "no-rise", have: r.length };
}

/** Temperature and test readings from the cycle that started on cycleStart, up to today. */
export function cycleReadings(bbt: Record<string, number> | undefined, cycleStart: string, today: string): TempReading[] {
  return Object.entries(bbt ?? {})
    .filter(([d]) => d >= cycleStart && d <= today)
    .map(([date, c]) => ({ date, c }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function dayMonth(iso: string): string {
  return parseISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function temperatureStatus(shift: ThermalShift): string {
  if (shift.status === "shift") return `Ovulation likely happened around ${dayMonth(shift.ovulationDate)}`;
  if (shift.status === "collecting") return `Keep going: ${shift.have} of at least ${shift.need} days`;
  return "No rise yet. That's expected before ovulation.";
}

export interface OpkStatus {
  tone: "positive" | "recent" | "negative" | "none";
  title: string;
  text: string;
}

/** What her ovulation tests this cycle mean today. */
export function opkStatus(opk: Record<string, OpkResult> | undefined, cycleStart: string, today: string): OpkStatus {
  const days = Object.entries(opk ?? {})
    .filter(([d]) => d >= cycleStart && d <= today)
    .sort(([a], [b]) => b.localeCompare(a));
  if (!days.length) return { tone: "none", title: "No tests yet this cycle", text: "Start testing once a day in the afternoon a few days before your fertile window." };
  const lastPos = days.find(([, v]) => v === "pos")?.[0];
  if (lastPos === today) {
    return {
      tone: "positive",
      title: "Positive",
      text: "Ovulation is likely in the next 12 to 36 hours. Today and the next 2 days are your best days to try.",
    };
  }
  if (lastPos && daysBetween(lastPos, today) <= 2) {
    return { tone: "recent", title: `Positive on ${dayMonth(lastPos)}`, text: "Ovulation is likely happening about now. Today is still a good day to try." };
  }
  const negs = days.filter(([, v]) => v === "neg").length;
  return {
    tone: "negative",
    title: lastPos ? `Last positive on ${dayMonth(lastPos)}` : `Negative so far (${negs} ${negs === 1 ? "test" : "tests"})`,
    text: lastPos ? "Your fertile window for this cycle has likely passed." : "That's normal before your surge. Keep testing once a day until you see a positive.",
  };
}

/** Fertile window: the 5 days before ovulation, ovulation day and the day after. */
export function fertileWindow(cycleStart: string, cycleLength: number): { start: string; end: string; ovulation: string } {
  const ovDay = Math.max(8, Math.round(cycleLength) - 14); // cycle day of ovulation
  const ovulation = addDays(cycleStart, ovDay - 1);
  return { start: addDays(ovulation, -5), end: addDays(ovulation, 1), ovulation };
}
