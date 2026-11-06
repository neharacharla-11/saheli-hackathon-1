import { describe, expect, it } from "vitest";
import { fromMgdl, sugarBand, sugarStats, toMgdl } from "./sugar";
import type { SugarReading } from "./types";

describe("sugarBand", () => {
  it("uses the urgent bands first", () => {
    expect(sugarBand(50, "after")).toBe("very-low");
    expect(sugarBand(65, "fasting")).toBe("low");
    expect(sugarBand(310, "random")).toBe("very-high");
  });
  it("has different targets by time of day", () => {
    expect(sugarBand(130, "fasting")).toBe("in-target");
    expect(sugarBand(131, "before")).toBe("high");
    expect(sugarBand(179, "after")).toBe("in-target");
    expect(sugarBand(180, "random")).toBe("high");
    expect(sugarBand(180, "bedtime")).toBe("in-target");
    expect(sugarBand(181, "bedtime")).toBe("high");
  });
});

describe("units", () => {
  it("converts mmol/L both ways", () => {
    expect(toMgdl(5.5, "mmol")).toBe(99);
    expect(fromMgdl(99, "mmol")).toBe("5.5");
    expect(fromMgdl(99.4, "mgdl")).toBe("99");
  });
});

describe("sugarStats", () => {
  const r = (at: string, value: number, when: SugarReading["when"]): SugarReading => ({ id: at, at, value, when });
  it("averages fasting readings and counts in target over 14 days", () => {
    const s = sugarStats(
      [r("2026-11-06T07:00", 120, "fasting"), r("2026-11-05T07:00", 140, "fasting"), r("2026-11-05T14:00", 170, "after"), r("2026-10-01T07:00", 200, "fasting")],
      "2026-11-06",
    );
    expect(s.last?.value).toBe(120);
    expect(s.fastingAvg).toBe(130);
    expect(s.count).toBe(3);
    expect(s.inTargetPct).toBe(67);
  });
  it("is empty without readings", () => {
    expect(sugarStats([], "2026-11-06")).toEqual({ last: undefined, fastingAvg: null, fastingCount: 0, inTargetPct: null, count: 0 });
  });
});
