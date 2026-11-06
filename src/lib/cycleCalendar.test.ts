import { describe, expect, it } from "vitest";
import { cycleIcs, monthGrid, noticeCycle, weightSeries } from "./cycleCalendar";

describe("monthGrid", () => {
  it("starts on Sunday", () => {
    const g = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(g[0][0]).toBe("2026-11-01");
    const oct = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(oct[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(oct[0][4]).toBe("2026-10-01");
    expect(oct.every((w) => w.length === 7)).toBe(true);
  });
});

describe("noticeCycle", () => {
  it("calls regular cycles usual", () => {
    const n = noticeCycle(["2026-07-24", "2026-08-22", "2026-09-20", "2026-10-19"], 5, 2);
    expect(n.normal[0]).toContain("29 days");
    expect(n.check).toEqual([]);
  });

  it("flags long cycles and long periods", () => {
    const n = noticeCycle(["2026-04-01", "2026-05-20", "2026-07-10"], 9, 4);
    expect(n.check.join(" ")).toContain("longer than the usual");
    expect(n.check.join(" ")).toContain("longer than 7 days");
    expect(n.check.join(" ")).toContain("heavy for about 4 days");
  });
});

describe("cycleIcs", () => {
  it("makes all-day events", () => {
    const ics = cycleIcs("2026-11-17", 29, 5, 2);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261117");
    expect(ics).toContain("DTEND;VALUE=DATE:20261122");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261216");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});

describe("weightSeries", () => {
  it("keeps the last 90 days in order", () => {
    const s = weightSeries({ "2026-01-01": 60, "2026-10-01": 61, "2026-11-05": 60.5 }, "2026-11-06");
    expect(s.map((p) => p.date)).toEqual(["2026-10-01", "2026-11-05"]);
    expect(s[1].x).toBeGreaterThan(s[0].x);
  });
});
