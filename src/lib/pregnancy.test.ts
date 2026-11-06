import { describe, expect, it } from "vitest";
import {
  bmiOf,
  bpLevel,
  buildIcs,
  dueFromLmp,
  gainRange,
  gainRangeAtWeek,
  pregnancyWeek,
  summariseContractions,
  type Contraction,
} from "./pregnancy";
import { addDays } from "./dates";

describe("pregnancyWeek", () => {
  it("is week 30, day 0 when the due date is 70 days away", () => {
    const today = "2026-11-06";
    const w = pregnancyWeek(addDays(today, 70), today);
    expect(w).toMatchObject({ week: 30, day: 0, trimester: 3, daysToGo: 70 });
  });
  it("counts days within the week", () => {
    const lmp = "2026-08-25";
    const w = pregnancyWeek(dueFromLmp(lmp), addDays(lmp, 7 * 12 + 3));
    expect(w.week).toBe(12);
    expect(w.day).toBe(3);
    expect(w.trimester).toBe(1);
  });
  it("switches trimester at 14 and 28 weeks", () => {
    const due = "2027-06-01";
    const lmp = addDays(due, -280);
    expect(pregnancyWeek(due, addDays(lmp, 14 * 7)).trimester).toBe(2);
    expect(pregnancyWeek(due, addDays(lmp, 28 * 7)).trimester).toBe(3);
  });
});

describe("bpLevel", () => {
  it("flags 140/90 as call your doctor today", () => {
    expect(bpLevel(140, 80)).toBe("high");
    expect(bpLevel(120, 90)).toBe("high");
  });
  it("flags 160/110 as go now", () => {
    expect(bpLevel(160, 90)).toBe("severe");
    expect(bpLevel(130, 110)).toBe("severe");
  });
  it("is normal for 115/75", () => {
    expect(bpLevel(115, 75)).toBe("normal");
  });
});

describe("weight gain", () => {
  it("uses the healthy BMI band", () => {
    const r = gainRange(bmiOf(58, 160));
    expect(r.band).toBe("healthy");
    expect([r.minKg, r.maxKg]).toEqual([11.5, 16]);
  });
  it("gives 0.5 to 2 kg at week 13 and the full range at 40", () => {
    const r = gainRange(22);
    expect(gainRangeAtWeek(r, 13)).toEqual([0.5, 2]);
    expect(gainRangeAtWeek(r, 40)).toEqual([11.5, 16]);
  });
});

describe("contractions", () => {
  const now = 10 * 60 * 60_000;
  const every = (gapMin: number, n: number, lenSec: number): Contraction[] =>
    Array.from({ length: n }, (_, i) => {
      const start = now - (n - 1 - i) * gapMin * 60_000 - lenSec * 1000;
      return { start, end: start + lenSec * 1000 };
    });

  it("meets 5-1-1 with contractions every 5 minutes for an hour", () => {
    const s = summariseContractions(every(5, 13, 60), now);
    expect(s.rule511).toBe(true);
    expect(s.regular).toBe(true);
  });
  it("is regular but not 5-1-1 every 8 minutes", () => {
    const s = summariseContractions(every(8, 6, 40), now);
    expect(s.rule511).toBe(false);
    expect(s.regular).toBe(true);
  });
  it("is not regular with only two", () => {
    expect(summariseContractions(every(5, 2, 60), now).regular).toBe(false);
  });
});

describe("buildIcs", () => {
  it("writes all-day events", () => {
    const ics = buildIcs([{ date: "2026-12-01", title: "Growth scan, week 32", uid: "a" }]);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261201");
    expect(ics).toContain("DTEND;VALUE=DATE:20261202");
    expect(ics).toContain("SUMMARY:Growth scan\\, week 32");
  });
});
