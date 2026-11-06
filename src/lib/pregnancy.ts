import { addDays, daysBetween, parseISODate } from "./dates";

/* ---------------- Weeks ---------------- */

export interface PregnancyWeek {
  week: number; // completed weeks, 0-42
  day: number; // 0-6
  trimester: 1 | 2 | 3;
  daysToGo: number;
  lmp: string; // first day of the last period (due date - 280 days)
}

/** Week and day from her due date (40 weeks = 280 days from the last period). */
export function pregnancyWeek(dueDate: string, today: string): PregnancyWeek {
  const lmp = addDays(dueDate, -280);
  const since = Math.max(0, daysBetween(lmp, today));
  const week = Math.min(42, Math.floor(since / 7));
  const day = week >= 42 ? 0 : since % 7;
  return { week, day, trimester: trimesterFor(week), daysToGo: daysBetween(today, dueDate), lmp };
}

export function trimesterFor(week: number): 1 | 2 | 3 {
  if (week < 14) return 1;
  if (week < 28) return 2;
  return 3;
}

export const TRIMESTER_LABEL: Record<1 | 2 | 3, string> = {
  1: "First trimester",
  2: "Second trimester",
  3: "Third trimester",
};

/** Due date from the first day of her last period. */
export function dueFromLmp(lmp: string): string {
  return addDays(lmp, 280);
}

/** The date a given pregnancy week starts. */
export function weekStart(dueDate: string, week: number): string {
  return addDays(dueDate, -280 + week * 7);
}

/* ---------------- Blood pressure ---------------- */

export type BPLevel = "low" | "normal" | "raised" | "high" | "severe";

/**
 * 140/90 or more: call your doctor today. 160/110 or more: go to hospital now.
 * Either number is enough.
 */
export function bpLevel(sys: number, dia: number): BPLevel {
  if (sys >= 160 || dia >= 110) return "severe";
  if (sys >= 140 || dia >= 90) return "high";
  if (sys >= 130 || dia >= 85) return "raised";
  if (sys < 90 || dia < 60) return "low";
  return "normal";
}

export const BP_MESSAGE: Record<BPLevel, { title: string; body: string }> = {
  severe: {
    title: "Go to hospital now",
    body: "This reading is very high. Go to your hospital or maternity unit now, or call an ambulance. Do not wait to see if it comes down.",
  },
  high: {
    title: "Call your doctor today",
    body: "140/90 or more is high in pregnancy. Sit quietly for 5 minutes, measure again, and call your doctor or midwife today either way.",
  },
  raised: {
    title: "A little higher than usual",
    body: "Still under 140/90. Rest, measure again tomorrow and mention it at your next check-up.",
  },
  low: {
    title: "On the low side",
    body: "Lower pressure is common in pregnancy. Stand up slowly and drink water. Tell your doctor if you feel faint or dizzy.",
  },
  normal: {
    title: "In a healthy range",
    body: "Keep checking as your doctor advises.",
  },
};

/* ---------------- Weight gain ---------------- */

export interface GainRange {
  band: "under" | "healthy" | "over" | "obese";
  label: string;
  minKg: number;
  maxKg: number;
}

/** Healthy total gain for one baby, by pre-pregnancy BMI (US Institute of Medicine, 2009). */
export function gainRange(bmi: number): GainRange {
  if (bmi < 18.5) return { band: "under", label: "Under 18.5", minKg: 12.5, maxKg: 18 };
  if (bmi < 25) return { band: "healthy", label: "18.5 to 24.9", minKg: 11.5, maxKg: 16 };
  if (bmi < 30) return { band: "over", label: "25 to 29.9", minKg: 7, maxKg: 11.5 };
  return { band: "obese", label: "30 or more", minKg: 5, maxKg: 9 };
}

export function bmiOf(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Expected gain range by a given week: 0.5-2 kg by week 13, then steady to the total at 40. */
export function gainRangeAtWeek(range: GainRange, week: number): [number, number] {
  const w = Math.max(0, Math.min(40, week));
  if (w <= 13) return [(0.5 * w) / 13, (2 * w) / 13];
  const t = (w - 13) / 27;
  return [0.5 + (range.minKg - 0.5) * t, 2 + (range.maxKg - 2) * t];
}

/* ---------------- Contractions ---------------- */

export interface Contraction {
  start: number; // ms
  end?: number; // ms
}

export interface ContractionSummary {
  count: number; // finished contractions in the last hour
  avgDurationSec: number | null;
  avgIntervalMin: number | null; // start to start
  rule511: boolean; // 5 minutes apart or less, about 1 minute long, for 1 hour
  regular: boolean; // 10 minutes apart or less, steady, for at least 30 minutes
}

const MIN = 60_000;

export function summariseContractions(list: Contraction[], now: number): ContractionSummary {
  const done = list.filter((c) => c.end !== undefined).sort((a, b) => a.start - b.start);
  const hour = done.filter((c) => c.start >= now - 60 * MIN);
  const durations = hour.map((c) => ((c.end as number) - c.start) / 1000);
  const intervals: number[] = [];
  for (let i = 1; i < hour.length; i++) intervals.push((hour[i].start - hour[i - 1].start) / MIN);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const avgDurationSec = avg(durations);
  const avgIntervalMin = avg(intervals);
  const span = hour.length ? (hour[hour.length - 1].start - hour[0].start) / MIN : 0;
  const rule511 =
    hour.length >= 6 &&
    span >= 50 &&
    intervals.every((m) => m <= 6) &&
    (avgIntervalMin ?? 99) <= 5.5 &&
    (avgDurationSec ?? 0) >= 45;
  const regular =
    hour.length >= 4 && span >= 30 && intervals.length > 0 && intervals.every((m) => m <= 10);
  return { count: hour.length, avgDurationSec, avgIntervalMin, rule511, regular };
}

/* ---------------- Calendar file ---------------- */

export interface CalendarEvent {
  date: string; // YYYY-MM-DD, all day
  title: string;
  note?: string;
  uid: string;
}

function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(events: CalendarEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saheli//Pregnancy//EN", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    const d = e.date.replace(/-/g, "");
    const next = addDays(e.date, 1).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@saheli`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${next}`,
      `SUMMARY:${icsText(e.title)}`,
      ...(e.note ? [`DESCRIPTION:${icsText(e.note)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, events: CalendarEvent[]) {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------- Usual scans ---------------- */

export interface UsualScan {
  week: number;
  title: string;
  note: string;
}

export const USUAL_SCANS: UsualScan[] = [
  { week: 8, title: "First check-up and dating scan", note: "Confirms the heartbeat and your due date." },
  { week: 12, title: "NT scan and first-trimester screening", note: "Usually between weeks 11 and 14." },
  { week: 16, title: "Check-up", note: "Blood pressure, urine and how you are feeling." },
  { week: 20, title: "Anomaly scan", note: "A detailed look at baby, usually weeks 18 to 22." },
  { week: 26, title: "Sugar test (glucose tolerance)", note: "Usually between weeks 24 and 28." },
  { week: 32, title: "Growth scan", note: "Baby's growth, position and fluid." },
  { week: 36, title: "Check-up and baby's position", note: "Talk about your birth plan." },
  { week: 39, title: "Check-up", note: "What happens if baby is late." },
];

/** Date a weekday from week N starts, for scheduling usual scans. */
export function scanDate(dueDate: string, week: number): string {
  return weekStart(dueDate, week);
}

export function isPast(date: string, today: string): boolean {
  return parseISODate(date).getTime() < parseISODate(today).getTime();
}

/* ---------------- Units ---------------- */

export const KG_PER_LB = 0.45359237;
export function kgTo(units: "metric" | "imperial", kg: number): number {
  return units === "imperial" ? kg / KG_PER_LB : kg;
}
export function toKg(units: "metric" | "imperial", v: number): number {
  return units === "imperial" ? v * KG_PER_LB : v;
}
export function weightUnit(units: "metric" | "imperial"): string {
  return units === "imperial" ? "lb" : "kg";
}
