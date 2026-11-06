import { addDays, daysBetween, parseISODate, toISODate } from "./dates";
import { cycleGaps } from "./cycle";

export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Weeks of a month, Sunday first. Cells outside the month are null. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(toISODate(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function shiftMonth(year: number, month: number, by: number): { year: number; month: number } {
  const d = new Date(year, month + by, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export interface Noticed {
  normal: string[];
  check: string[];
}

/** Plain observations from her period history. Guidance only, never a diagnosis. */
/** heavyPerPeriod: average days of heavy flow per period in recent months. */
export function noticeCycle(periodStarts: string[], periodLength: number, heavyPerPeriod: number): Noticed {
  const gaps = cycleGaps(periodStarts).slice(-6);
  const normal: string[] = [];
  const check: string[] = [];
  if (gaps.length >= 2) {
    const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    const spread = Math.max(...gaps) - Math.min(...gaps);
    if (avg >= 21 && avg <= 35) normal.push(`Your cycles average ${avg} days. Anything from 21 to 35 is usual.`);
    else if (avg > 35) check.push(`Your cycles average ${avg} days, longer than the usual 21 to 35. Worth asking your doctor about.`);
    else check.push(`Your cycles average ${avg} days, shorter than 21. Worth asking your doctor about.`);
    if (spread <= 2) normal.push("Your cycles are very regular, within a couple of days of each other.");
    else if (spread <= 7) normal.push(`They vary by ${spread} days. Up to about a week is normal.`);
    else check.push(`Your cycle length changes by ${spread} days. If that keeps happening, mention it to your doctor.`);
  } else {
    normal.push("Log a few more periods and Saheli will learn your pattern.");
  }
  if (periodLength <= 7) normal.push(`Periods of ${periodLength} days are within the usual 2 to 7.`);
  else check.push(`Periods longer than 7 days are worth checking with your doctor.`);
  if (heavyPerPeriod > 3) check.push(`Your flow is heavy for about ${Math.round(heavyPerPeriod)} days each period. If you soak a pad every hour or feel dizzy, call your doctor.`);
  else normal.push("Heavier flow on the first 1 or 2 days is common.");
  return { normal, check };
}

/** An .ics file with her next predicted periods as all-day events. */
export function cycleIcs(next: string, cycleLength: number, periodLength: number, count = 6): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saheli//Cycle//EN", "CALSCALE:GREGORIAN"];
  for (let i = 0; i < count; i++) {
    const start = addDays(next, i * cycleLength);
    const end = addDays(start, periodLength);
    lines.push(
      "BEGIN:VEVENT",
      `UID:saheli-period-${start}@saheli`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${end.replace(/-/g, "")}`,
      "SUMMARY:Period expected (Saheli)",
      "DESCRIPTION:A prediction from your cycle history. Dates can shift by a few days.",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Points for a 90-day chart: x 0-1 across the window, kg. */
export function weightSeries(weights: Record<string, number>, today: string, days = 90): { date: string; kg: number; x: number }[] {
  const from = addDays(today, -days);
  return Object.keys(weights)
    .filter((d) => d >= from && d <= today)
    .sort()
    .map((d) => ({ date: d, kg: weights[d], x: daysBetween(from, d) / days }));
}

export function sameMonth(iso: string, year: number, month: number): boolean {
  const d = parseISODate(iso);
  return d.getFullYear() === year && d.getMonth() === month;
}
