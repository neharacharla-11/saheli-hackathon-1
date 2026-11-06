import { describe, expect, it } from "vitest";
import { buildIcs, buildReminders, dueReminders } from "./reminders";
import { DEFAULT_REMINDERS } from "./store";

const base = {
  settings: DEFAULT_REMINDERS,
  medicines: [{ id: "thy", name: "Thyroxine", dose: "50 mcg", time: "07:00" }, { id: "x", name: "No time" }],
  pillTime: "21:30",
  periodStarts: ["2026-10-20"],
  cycleLength: 29,
  stage: "cycle" as const,
  today: "2026-11-06",
};

describe("buildReminders", () => {
  it("includes medicines with a time, the pill, water and period tomorrow", () => {
    const r = buildReminders(base);
    expect(r.map((x) => x.id)).toEqual(["med-thy", "period-2026-11-18", "water-10:00", "water-13:00", "water-16:00", "water-19:00", "pill"]);
    expect(r.find((x) => x.kind === "period")?.date).toBe("2026-11-17");
  });
  it("respects her switches and stage", () => {
    const r = buildReminders({ ...base, settings: { ...DEFAULT_REMINDERS, water: false, medicines: false }, stage: "pregnancy" });
    expect(r).toEqual([]);
  });
});

describe("dueReminders", () => {
  const list = buildReminders(base);
  const t = (d: string, hm: string) => new Date(`${d}T${hm}:00`).getTime();
  it("finds reminders that just came due", () => {
    const due = dueReminders(list, t("2026-11-06", "06:58"), t("2026-11-06", "07:01"));
    expect(due.map((x) => x.id)).toEqual(["med-thy"]);
  });
  it("doesn't flood her with old ones after a long gap", () => {
    expect(dueReminders(list, t("2026-11-05", "00:00"), t("2026-11-06", "12:00"))).toEqual([]);
  });
  it("fires one-off reminders only on their date", () => {
    expect(dueReminders(list, t("2026-11-17", "08:59"), t("2026-11-17", "09:00")).map((x) => x.kind)).toEqual(["period"]);
  });
});

describe("buildIcs", () => {
  it("writes repeating events with alarms", () => {
    const ics = buildIcs(buildReminders(base), { today: base.today, now: new Date("2026-11-06T10:00:00Z"), periodStarts: base.periodStarts, cycleLength: 29, cycles: 2 });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261106T070000\r\nDURATION:PT5M\r\nRRULE:FREQ=DAILY");
    expect(ics).toContain("SUMMARY:Time for Thyroxine");
    expect(ics).toContain("TRIGGER:PT0M");
    expect(ics).toContain("DTSTART:20261117T090000");
    expect(ics).toContain("DTSTART:20261216T090000");
    expect(ics.split("BEGIN:VEVENT").length - 1).toBe(8);
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
});
