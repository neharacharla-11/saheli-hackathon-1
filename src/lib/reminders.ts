/**
 * Reminders: medicine times, water, the pill, and "period likely tomorrow".
 * Used for phone notifications (through the service worker) and .ics calendar files.
 */
import { addDays } from "./dates";
import { nextPeriod } from "./cycle";
import type { LifeStage, ReminderSettings } from "./types";

export interface Reminder {
  id: string;
  kind: "medicine" | "water" | "pill" | "period";
  title: string;
  body: string;
  time: string; // HH:mm
  /** Daily reminders repeat; "once" fires on `date`. */
  repeat: "daily" | "once";
  date?: string;
}

export interface MedicineLike {
  id: string;
  name: string;
  dose?: string;
  time?: string;
}

export interface ReminderInput {
  settings: ReminderSettings;
  medicines: MedicineLike[];
  pillTime?: string; // from Contraception
  periodStarts: string[];
  cycleLength: number;
  stage?: LifeStage;
  today: string;
}

const NO_PERIOD: LifeStage[] = ["pregnancy", "postpartum", "menopause"];

export function validTime(t: string | undefined): t is string {
  return !!t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export function buildReminders(i: ReminderInput): Reminder[] {
  const out: Reminder[] = [];
  if (i.settings.medicines) {
    for (const m of i.medicines) {
      if (!validTime(m.time)) continue;
      out.push({
        id: `med-${m.id}`,
        kind: "medicine",
        title: `Time for ${m.name}`,
        body: m.dose ? `${m.dose}. Tick it off in Saheli when you've taken it.` : "Tick it off in Saheli when you've taken it.",
        time: m.time,
        repeat: "daily",
      });
    }
    if (validTime(i.pillTime)) {
      out.push({ id: "pill", kind: "pill", title: "Time for your pill", body: "Taking it at the same time each day keeps it working best.", time: i.pillTime, repeat: "daily" });
    }
  }
  if (i.settings.water) {
    for (const t of i.settings.waterTimes.filter(validTime)) {
      out.push({ id: `water-${t}`, kind: "water", title: "A glass of water", body: "A quick sip break. Your body will thank you.", time: t, repeat: "daily" });
    }
  }
  if (i.settings.periodTomorrow && !NO_PERIOD.includes(i.stage ?? "cycle") && i.periodStarts.length) {
    const next = nextPeriod(i.periodStarts, i.today, i.cycleLength);
    if (next) {
      const date = addDays(next, -1);
      if (date >= i.today) {
        out.push({
          id: `period-${next}`,
          kind: "period",
          title: "Your period is likely tomorrow",
          body: "Keep pads or a cup in your bag, and go easy on yourself.",
          time: "09:00",
          repeat: "once",
          date,
        });
      }
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/* ---------------- Due now (service worker check) ---------------- */

function at(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

function isoDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Reminders whose time passed after `since` and on or before `now`.
 * Missed ones older than `graceMs` are skipped, so she isn't flooded after a long break.
 */
export function dueReminders(list: Reminder[], since: number, now: number, graceMs = 30 * 60_000): Reminder[] {
  const from = Math.max(since, now - graceMs);
  const days = [isoDay(from), isoDay(now)].filter((d, i, a) => a.indexOf(d) === i);
  const out: Reminder[] = [];
  for (const r of list) {
    const dates = r.repeat === "once" ? (r.date ? [r.date] : []) : days;
    if (dates.some((d) => {
      const t = at(d, r.time);
      return t > from && t <= now;
    })) out.push(r);
  }
  return out;
}

/* ---------------- Calendar (.ics) ---------------- */

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Fold lines to 75 characters as the format asks. */
function fold(line: string) {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += i === 0 ? 75 : 74) parts.push((i === 0 ? "" : " ") + line.slice(i, i + (i === 0 ? 75 : 74)));
  return parts.join("\r\n");
}

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function local(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

/**
 * One calendar file with an event and alarm per reminder. Daily ones repeat,
 * so they ring even when Saheli is closed. Period reminders cover the next few cycles.
 */
export function buildIcs(list: Reminder[], opts: { today: string; now?: Date; periodStarts?: string[]; cycleLength?: number; cycles?: number }): string {
  const now = opts.now ?? new Date();
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saheli//Reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Saheli reminders"];
  const event = (uid: string, date: string, r: Reminder, rrule?: string) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}@saheli`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${local(date, r.time)}`,
      `DURATION:PT5M`,
      ...(rrule ? [rrule] : []),
      `SUMMARY:${esc(r.title)}`,
      `DESCRIPTION:${esc(r.body)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(r.title)}`,
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT",
    );
  };
  for (const r of list) {
    if (r.repeat === "daily") event(r.id, opts.today, r, "RRULE:FREQ=DAILY");
    else if (r.kind === "period" && opts.periodStarts?.length && opts.cycleLength) {
      let next = nextPeriod(opts.periodStarts, opts.today, opts.cycleLength);
      for (let c = 0; next && c < (opts.cycles ?? 6); c++) {
        event(`period-${next}`, addDays(next, -1), r);
        next = addDays(next, opts.cycleLength);
      }
    } else if (r.date) event(r.id, r.date, r);
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
