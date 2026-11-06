/**
 * Import steps, sleep and weight from CSV files exported by Android health apps
 * (Google Fit via Google Takeout, Samsung Health, Fitbit, Health Sync) or our template.
 * Columns are found by name; values are summed per day; only the last year is kept.
 */
import { addDays, toISODate } from "./dates";

export interface DailyHealth {
  steps: Record<string, number>;
  sleepMin: Record<string, number>;
  weight: Record<string, number>; // kg
}

export interface CsvResult extends DailyHealth {
  rows: number;
  skipped: number;
  found: { date?: string; steps?: string; sleep?: string; weight?: string };
}

export const CSV_TEMPLATE = "date,steps,sleep_hours,weight_kg\n2026-11-01,7421,7.5,62.1\n2026-11-02,5310,6.75,\n";

/* ---------------- CSV basics ---------------- */

function detectDelimiter(line: string): string {
  const counts = [",", ";", "\t"].map((d) => [d, line.split(d).length] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][0];
}

/** Split CSV text into rows, handling quotes and quoted newlines. */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.indexOf("\n") === -1 ? undefined : src.indexOf("\n"));
  const d = delimiter ?? detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === d) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

/* ---------------- Dates ---------------- */

export type DayOrder = "dmy" | "mdy";

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function ymd(y: number, m: number, d: number): string | null {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) return null;
  return toISODate(dt);
}

/** Decide whether slashed dates in this file are day-first or month-first. */
export function guessDayOrder(cells: string[]): DayOrder {
  for (const c of cells) {
    const m = c.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (!m) continue;
    if (Number(m[1]) > 12) return "dmy";
    if (Number(m[2]) > 12) return "mdy";
  }
  return "dmy";
}

/** Many date styles to YYYY-MM-DD (local). */
export function parseDateCell(raw: string, order: DayOrder = "dmy"): string | null {
  const s = raw.trim().replace(/^"|"$/g, "");
  if (!s) return null;
  // Unix timestamps in seconds or milliseconds
  if (/^\d{10}(\.\d+)?$/.test(s)) return toISODate(new Date(Number(s) * 1000));
  if (/^\d{13}$/.test(s)) return toISODate(new Date(Number(s)));
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?/);
  if (m) {
    // A timestamp with a zone: use her local day.
    if (m[4] && m[6]) {
      const d = new Date(s.replace(" ", "T").replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
      if (!Number.isNaN(d.getTime())) return toISODate(d);
    }
    return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const y = Number(m[3]);
    if (a > 12) return ymd(y, b, a);
    if (b > 12) return ymd(y, a, b);
    return order === "mdy" ? ymd(y, a, b) : ymd(y, b, a);
  }
  // "7 Oct 2026", "Oct 7, 2026"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})/);
  if (m && MONTHS[m[2].toLowerCase()]) return ymd(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1]));
  m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return ymd(Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2]));
  return null;
}

/* ---------------- Columns ---------------- */

function norm(h: string) {
  return h.toLowerCase().replace(/^com\.samsung\.health\.[a-z_.]*?\./, "").replace(/\s+/g, " ").trim();
}

const DATE_NAMES = ["date", "day", "day_time", "start_time", "start time", "starttime", "start", "datetime", "date time", "timestamp", "time", "create_time", "start_date", "start date"];

function findDate(headers: string[]): number {
  const h = headers.map(norm);
  for (const name of DATE_NAMES) {
    const i = h.indexOf(name);
    if (i !== -1) return i;
  }
  return h.findIndex((x) => /date|day|time/.test(x) && !/update|end|offset|zone/.test(x));
}

function findSteps(headers: string[], hint: string): number {
  const h = headers.map(norm);
  const i = h.findIndex((x) => /step/.test(x) && !/goal|length|speed|distance|cadence|calor|run|walk_step|type|id\b/.test(x));
  if (i !== -1) return i;
  // Samsung step_daily_trend uses a plain "count" column.
  if (/step/i.test(hint)) return h.findIndex((x) => x === "count");
  return -1;
}

function findSleep(headers: string[]): number {
  const h = headers.map(norm);
  return h.findIndex((x) => /(sleep|asleep)/.test(x) && !/start|end|score|stage|efficien|awake|time in bed|goal|count|type|id\b/.test(x));
}

function findWeight(headers: string[]): number {
  const h = headers.map(norm);
  const exact = h.findIndex((x) => /^(average )?weight/.test(x) && !/goal|target|max|min/.test(x));
  if (exact !== -1) return exact;
  return h.findIndex((x) => /weight|body mass/.test(x) && !/goal|target|max|min|lean|fat/.test(x));
}

/** Minutes per unit, from the header ("Sleep duration (ms)", "sleep_hours", "Minutes Asleep"). */
export function sleepFactor(header: string, sample: number[]): number {
  const h = header.toLowerCase();
  if (/\(ms\)|millis|_ms\b|\bms\b/.test(h)) return 1 / 60000;
  if (/\(s\)|second|\bsec\b|_s\b/.test(h)) return 1 / 60;
  if (/min/.test(h)) return 1;
  if (/hour|hrs|\(h\)|_h\b|\bh\b/.test(h)) return 60;
  // No unit: small numbers are hours, big ones minutes.
  const sorted = [...sample].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return median > 0 && median <= 16 ? 60 : 1;
}

function weightFactor(header: string): number {
  return /\blbs?\b|pound|\(lb/.test(header.toLowerCase()) ? 0.45359237 : 1;
}

function num(s: string | undefined): number | null {
  if (s === undefined) return null;
  const t = s.trim().replace(/,(?=\d{3}\b)/g, "");
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* ---------------- Main ---------------- */

export function parseHealthCsv(text: string, today: string, fileName = ""): CsvResult {
  const all = parseCsv(text);
  const out: CsvResult = { steps: {}, sleepMin: {}, weight: {}, rows: 0, skipped: 0, found: {} };
  if (!all.length) return out;

  // Samsung files start with a line like "com.samsung.health.step_daily_trend,6302,4".
  let start = 0;
  for (let i = 0; i < Math.min(5, all.length); i++) {
    if (findDate(all[i]) !== -1 && all[i].length > 1) {
      start = i;
      break;
    }
  }
  const headers = all[start];
  const hint = `${fileName} ${all.slice(0, start).flat().join(" ")}`;
  const di = findDate(headers);
  const si = findSteps(headers, hint);
  const sli = findSleep(headers);
  const wi = findWeight(headers);
  if (di === -1 || (si === -1 && sli === -1 && wi === -1)) return out;
  out.found = {
    date: headers[di],
    ...(si !== -1 ? { steps: headers[si] } : {}),
    ...(sli !== -1 ? { sleep: headers[sli] } : {}),
    ...(wi !== -1 ? { weight: headers[wi] } : {}),
  };

  const rows = all.slice(start + 1);
  const order = guessDayOrder(rows.map((r) => r[di] ?? ""));
  const sleepSample = sli === -1 ? [] : rows.slice(0, 50).map((r) => num(r[sli])).filter((n): n is number => n !== null && n > 0);
  const sf = sli === -1 ? 1 : sleepFactor(headers[sli], sleepSample);
  const wf = wi === -1 ? 1 : weightFactor(headers[wi]);
  const from = addDays(today, -365);

  for (const r of rows) {
    const date = parseDateCell(r[di] ?? "", order);
    if (!date || date < from || date > today) {
      out.skipped++;
      continue;
    }
    let used = false;
    const steps = si === -1 ? null : num(r[si]);
    if (steps !== null && steps >= 0 && steps < 100_000) {
      out.steps[date] = (out.steps[date] ?? 0) + Math.round(steps);
      used = true;
    }
    const sleep = sli === -1 ? null : num(r[sli]);
    if (sleep !== null && sleep > 0) {
      const min = sleep * sf;
      if (min > 0 && min <= 24 * 60) {
        out.sleepMin[date] = Math.min(24 * 60, (out.sleepMin[date] ?? 0) + Math.round(min));
        used = true;
      }
    }
    const w = wi === -1 ? null : num(r[wi]);
    if (w !== null) {
      const kg = Math.round(w * wf * 10) / 10;
      if (kg >= 25 && kg <= 300) {
        out.weight[date] = kg;
        used = true;
      }
    }
    if (used) out.rows++;
    else out.skipped++;
  }
  // Steps of 0 on a day usually means "no data" in exports.
  for (const [d, v] of Object.entries(out.steps)) if (v === 0) delete out.steps[d];
  return out;
}

/** Combine several files: steps and sleep from different files for the same day keep the larger value. */
export function combineDaily(results: DailyHealth[]): DailyHealth {
  const out: DailyHealth = { steps: {}, sleepMin: {}, weight: {} };
  for (const r of results) {
    for (const [d, v] of Object.entries(r.steps)) out.steps[d] = Math.max(out.steps[d] ?? 0, v);
    for (const [d, v] of Object.entries(r.sleepMin)) out.sleepMin[d] = Math.max(out.sleepMin[d] ?? 0, v);
    Object.assign(out.weight, r.weight);
  }
  return out;
}

export function latestWeight(weight: Record<string, number>): { date: string; kg: number } | null {
  const d = Object.keys(weight).sort().pop();
  return d ? { date: d, kg: weight[d] } : null;
}
