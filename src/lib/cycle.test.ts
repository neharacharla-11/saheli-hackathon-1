import { describe, expect, it } from "vitest";
import { averageCycleLength, cycleDay, nextPeriod, phaseForDay, phaseRanges } from "./cycle";
import { addDays, daysBetween } from "./dates";

describe("phaseRanges", () => {
  it("matches the landing page ranges for a 28-day cycle", () => {
    expect(phaseRanges(28, 5)).toEqual({
      period: [1, 5],
      follicular: [6, 11],
      ovulation: [12, 15],
      luteal: [16, 28],
    });
  });

  it("puts day 19 of a 29-day cycle in the luteal phase", () => {
    expect(phaseForDay(19, 29, 5)).toBe("luteal");
  });

  it("puts day 13 of a 28-day cycle in the ovulation window", () => {
    expect(phaseForDay(13, 28, 5)).toBe("ovulation");
  });
});

describe("cycleDay and nextPeriod", () => {
  const starts = ["2026-09-21", "2026-10-19"];

  it("counts from the latest start", () => {
    expect(cycleDay(starts, "2026-10-19", 29)).toBe(1);
    expect(cycleDay(starts, "2026-11-06", 29)).toBe(19);
  });

  it("returns null with no logged period", () => {
    expect(cycleDay([], "2026-11-06")).toBeNull();
  });

  it("predicts the next period after today", () => {
    expect(nextPeriod(starts, "2026-11-06", 29)).toBe("2026-11-17");
  });

  it("averages gaps between starts", () => {
    expect(averageCycleLength(starts)).toBe(28);
    expect(averageCycleLength(["2026-10-01"])).toBeNull();
  });
});

describe("dates", () => {
  it("adds days across a month end", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
  });
});
