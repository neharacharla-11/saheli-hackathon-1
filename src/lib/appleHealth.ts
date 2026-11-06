/**
 * Apple Health export.xml, read line by line (the file can be hundreds of MB).
 * Pulls steps, sleep, period days and weight from the last year.
 */
import { addDays, daysBetween } from "./dates";
import type { DailyHealth } from "./healthCsv";

export interface AppleState {
  cutoff: string;
  today: string;
  stepsBySource: Record<string, Record<string, number>>; // date -> source -> steps
  sleepBySource: Record<string, Record<string, number>>; // date -> source -> minutes
  periodDays: Set<string>;
  weight: Record<string, number>;
  records: number;
}

export interface AppleResult extends DailyHealth {
  periodDays: string[];
  records: number;
}

export function newAppleState(today: string): AppleState {
  return { cutoff: addDays(today, -365), today, stepsBySource: {}, sleepBySource: {}, periodDays: new Set(), weight: {}, records: 0 };
}

function attrs(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out[m[1]] = m[2];
  return out;
}

/** "2026-10-01 23:10:00 +0530" -> ms since epoch */
function appleTime(s: string): number {
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-])(\d{2})(\d{2})$/);
  if (!m) return Number.NaN;
  return Date.parse(`${m[1]}T${m[2]}${m[3]}${m[4]}:${m[5]}`);
}

function bump(map: Record<string, Record<string, number>>, date: string, source: string, v: number) {
  const day = (map[date] ??= {});
  day[source] = (day[source] ?? 0) + v;
}

const STEP = "HKQuantityTypeIdentifierStepCount";
const SLEEP = "HKCategoryTypeIdentifierSleepAnalysis";
const FLOW = "HKCategoryTypeIdentifierMenstrualFlow";
const MASS = "HKQuantityTypeIdentifierBodyMass";

/** Handle one line of export.xml. */
export function readAppleLine(st: AppleState, line: string) {
  const at = line.indexOf("<Record ");
  if (at === -1) return;
  // Cheap type check before parsing all attributes.
  if (!line.includes(STEP) && !line.includes(SLEEP) && !line.includes(FLOW) && !line.includes(MASS)) return;
  const a = attrs(line.slice(at));
  const start = a.startDate ?? "";
  const end = a.endDate ?? start;
  const date = (a.type === SLEEP ? end : start).slice(0, 10);
  if (date < st.cutoff || date > st.today) return;
  const source = a.sourceName ?? "Apple Health";
  st.records++;
  if (a.type === STEP) {
    const v = Number(a.value);
    if (Number.isFinite(v) && v > 0) bump(st.stepsBySource, date, source, v);
  } else if (a.type === SLEEP) {
    if (!/Asleep/.test(a.value ?? "")) return; // skip in bed and awake
    const min = (appleTime(end) - appleTime(start)) / 60000;
    if (Number.isFinite(min) && min > 0 && min < 24 * 60) bump(st.sleepBySource, date, source, min);
  } else if (a.type === FLOW) {
    if (!/None$/.test(a.value ?? "")) st.periodDays.add(start.slice(0, 10));
  } else if (a.type === MASS) {
    const v = Number(a.value);
    const kg = /lb/i.test(a.unit ?? "") ? v * 0.45359237 : v;
    if (Number.isFinite(kg) && kg >= 25 && kg <= 300) st.weight[date] = Math.round(kg * 10) / 10;
  }
}

/** Feed text in any chunk sizes; returns the unfinished tail to prepend to the next chunk. */
export function readAppleChunk(st: AppleState, carry: string, chunk: string): string {
  const text = carry + chunk;
  const lines = text.split("\n");
  const tail = lines.pop() ?? "";
  for (const l of lines) readAppleLine(st, l);
  return tail;
}

/**
 * iPhone and Watch both record steps and sleep, so adding them double counts.
 * Like the Health app, take one source per day: the one with the most.
 */
export function finishApple(st: AppleState): AppleResult {
  const pick = (m: Record<string, Record<string, number>>) =>
    Object.fromEntries(Object.entries(m).map(([d, by]) => [d, Math.round(Math.max(...Object.values(by)))]));
  return {
    steps: pick(st.stepsBySource),
    sleepMin: Object.fromEntries(Object.entries(pick(st.sleepBySource)).map(([d, v]) => [d, Math.min(v, 24 * 60)])),
    weight: st.weight,
    periodDays: [...st.periodDays].sort(),
    records: st.records,
  };
}

/** First day of each run of period days (a gap of more than 7 days starts a new period). */
export function periodStartsFromDays(days: string[]): string[] {
  const s = [...new Set(days)].sort();
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) if (i === 0 || daysBetween(s[i - 1], s[i]) > 7) out.push(s[i]);
  return out;
}

/** Add imported starts that aren't within 5 days of one she already logged. */
export function mergePeriodStarts(existing: string[], incoming: string[]): string[] {
  const out = [...existing];
  for (const d of incoming) if (!out.some((e) => Math.abs(daysBetween(e, d)) <= 5)) out.push(d);
  return [...new Set(out)].sort();
}
