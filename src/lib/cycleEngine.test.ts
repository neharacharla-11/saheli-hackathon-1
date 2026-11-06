import { describe, expect, it } from "vitest";
import { cycleGaps, cycleInfo, dayKind, fertileWindow, learnedCycleLength, ovulationDay, ovulationWindow } from "./cycle";
import { addDays } from "./dates";

// Priya: 29-day cycles, today (2026-11-06) is cycle day 19.
const today = "2026-11-06";
const last = addDays(today, -18);
const priya = [5, 4, 3, 2, 1, 0].map((i) => addDays(last, -29 * i));

describe("learnedCycleLength", () => {
  it("averages her last cycles", () => {
    expect(cycleGaps(priya)).toEqual([29, 29, 29, 29, 29]);
    expect(learnedCycleLength(priya, 28)).toBe(29);
  });

  it("falls back to what she told us with one period logged", () => {
    expect(learnedCycleLength(["2026-10-01"], 31)).toBe(31);
  });

  it("ignores impossible gaps and uses only the last 6", () => {
    const starts = ["2026-01-01", "2026-01-05", "2026-02-02", "2026-03-02"]; // 4-day gap is a duplicate log
    expect(learnedCycleLength(starts, 28)).toBe(28);
    const many = Array.from({ length: 10 }, (_, i) => addDays("2025-01-01", i < 4 ? i * 40 : 120 + (i - 3) * 30));
    expect(learnedCycleLength(many, 28)).toBe(30);
  });

  it("handles irregular PCOS cycles", () => {
    const meera = ["2026-04-01", "2026-05-10", "2026-06-29", "2026-08-08", "2026-09-20"];
    expect(learnedCycleLength(meera, 35)).toBe(43);
  });
});

describe("cycleInfo", () => {
  it("gives Priya's day, phase, next period and windows", () => {
    const info = cycleInfo(priya, today, 28, 5)!;
    expect(info.day).toBe(19);
    expect(info.phase).toBe("luteal");
    expect(info.cycleLength).toBe(29);
    expect(info.nextPeriod).toBe("2026-11-17");
    expect(info.daysToNext).toBe(11);
    expect(info.ovulation).toEqual({ start: "2026-10-31", end: "2026-11-03" }); // cycle days 13-16
    expect(info.averageLength).toBe(29);
    expect(info.loggedCycles).toBe(5);
  });

  it("returns null without a logged period", () => {
    expect(cycleInfo([], today)).toBeNull();
  });

  it("keeps counting when her period is late", () => {
    const info = cycleInfo(["2026-10-01"], "2026-11-06", 28, 5)!;
    expect(info.day).toBe(9); // 36 days since, rolls into a predicted cycle
    expect(info.nextPeriod > "2026-11-06").toBe(true);
  });
});

describe("fertile window", () => {
  it("is the 5 days before ovulation, ovulation day and the day after", () => {
    expect(ovulationDay(28)).toBe(14);
    const w = fertileWindow(["2026-11-01"], "2026-11-03", 28)!;
    expect(w).toEqual({ start: "2026-11-09", end: "2026-11-15", ovulation: "2026-11-14" });
  });

  it("matches the ovulation phase for a 28-day cycle", () => {
    expect(ovulationWindow(["2026-11-01"], "2026-11-03", 28, 5)).toEqual({ start: "2026-11-12", end: "2026-11-15" });
  });
});

describe("dayKind", () => {
  it("marks logged, predicted and phase days", () => {
    expect(dayKind(priya, last, today, 29, 5)).toBe("period");
    expect(dayKind(priya, addDays(last, 4), today, 29, 5)).toBe("period");
    expect(dayKind(priya, addDays(last, 7), today, 29, 5)).toBe("follicular");
    expect(dayKind(priya, today, today, 29, 5)).toBe("luteal");
    expect(dayKind(priya, "2026-11-17", today, 29, 5)).toBe("predicted");
    expect(dayKind(priya, "2026-11-22", today, 29, 5)).toBe("follicular");
    expect(dayKind([], today, today)).toBeNull();
  });
});
