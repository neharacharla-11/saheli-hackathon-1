import { describe, expect, it } from "vitest";
import { cToF, detectThermalShift, fertileWindow, opkStatus, parseTemperature, temperatureStatus, type TempReading } from "./fertility";
import { babyStats, fewWetNappies, mostBothersome, mrsBand, mrsTotal, postpartumScreen, sinceBirthTitle } from "./stageCare";
import { addDays } from "./dates";

const start = "2026-10-20";
const series = (temps: number[]): TempReading[] => temps.map((c, i) => ({ date: addDays(start, i), c }));

describe("3 over 6 thermal shift", () => {
  it("needs at least 9 readings", () => {
    const s = detectThermalShift(series([36.4, 36.3, 36.5, 36.4, 36.4, 36.3]));
    expect(s).toEqual({ status: "collecting", have: 6, need: 9 });
    expect(temperatureStatus(s)).toBe("Keep going: 6 of at least 9 days");
  });

  it("says no rise yet when temperatures stay low", () => {
    const s = detectThermalShift(series([36.4, 36.3, 36.5, 36.4, 36.4, 36.3, 36.5, 36.4, 36.3, 36.5]));
    expect(s.status).toBe("no-rise");
    expect(temperatureStatus(s)).toBe("No rise yet. That's expected before ovulation.");
  });

  it("finds the shift, the coverline and ovulation the day before the first high one", () => {
    //            d0    d1    d2    d3    d4    d5    d6    d7    d8    d9    d10   d11
    const t = [36.3, 36.4, 36.3, 36.5, 36.4, 36.3, 36.4, 36.4, 36.7, 36.8, 36.7, 36.8];
    const s = detectThermalShift(series(t));
    expect(s.status).toBe("shift");
    if (s.status !== "shift") return;
    // six before d8 are d2..d7, highest 36.5
    expect(s.coverline).toBe(36.5);
    expect(s.firstHighDate).toBe(addDays(start, 8));
    expect(s.ovulationDate).toBe(addDays(start, 7));
    expect(s.highDates).toHaveLength(3);
  });

  it("counts exactly 0.2 above as high (no floating point slip)", () => {
    const t = [36.3, 36.3, 36.3, 36.3, 36.3, 36.3, 36.5, 36.5, 36.5];
    expect(detectThermalShift(series(t)).status).toBe("shift");
  });

  it("needs all 3 in a row to be high", () => {
    const t = [36.3, 36.3, 36.3, 36.3, 36.3, 36.3, 36.6, 36.4, 36.6, 36.3];
    expect(detectThermalShift(series(t)).status).toBe("no-rise");
  });

  it("works with gaps and unsorted input", () => {
    const r = series([36.3, 36.4, 36.3, 36.4, 36.3, 36.4, 36.7, 36.7, 36.8]).reverse();
    r[0] = { ...r[0], date: addDays(start, 10) }; // a skipped day
    expect(detectThermalShift(r).status).toBe("shift");
  });
});

describe("temperatures", () => {
  it("accepts °C and °F and rejects values outside 35-38.5 °C kindly", () => {
    expect(parseTemperature("36.4", "C")).toEqual({ ok: true, c: 36.4 });
    const f = parseTemperature(String(cToF(36.5)), "F");
    expect(f.ok && Math.abs(f.c - 36.5) < 0.01).toBe(true);
    const low = parseTemperature("34.9", "C");
    expect(low.ok).toBe(false);
    expect(!low.ok && low.message).toMatch(/35.0 and 38.5/);
    expect(parseTemperature("39", "C").ok).toBe(false);
    expect(parseTemperature("abc", "C").ok).toBe(false);
  });
});

describe("ovulation tests", () => {
  it("explains a positive today", () => {
    const s = opkStatus({ "2026-11-03": "neg", "2026-11-04": "neg", "2026-11-05": "neg", "2026-11-06": "pos" }, "2026-10-23", "2026-11-06");
    expect(s.tone).toBe("positive");
    expect(s.text).toMatch(/12 to 36 hours/);
  });
  it("says negative so far before the surge", () => {
    expect(opkStatus({ "2026-11-05": "neg" }, "2026-10-23", "2026-11-06").tone).toBe("negative");
    expect(opkStatus({}, "2026-10-23", "2026-11-06").tone).toBe("none");
  });
  it("ignores last cycle's tests", () => {
    expect(opkStatus({ "2026-10-01": "pos" }, "2026-10-23", "2026-11-06").tone).toBe("none");
  });
});

describe("fertile window", () => {
  it("is the 5 days before ovulation, the day itself and the day after", () => {
    const w = fertileWindow("2026-10-23", 29);
    expect(w.ovulation).toBe("2026-11-06"); // cycle day 15
    expect(w.start).toBe("2026-11-01");
    expect(w.end).toBe("2026-11-07");
  });
});

describe("baby care", () => {
  const now = new Date(2026, 10, 6, 19, 0);
  const iso = (h: number, m = 0) => new Date(2026, 10, 6, h, m).toISOString();
  it("counts today, picks the next side and flags few wet nappies after 6 PM from day 5", () => {
    const baby = {
      feeds: [
        { id: "a", at: iso(14), kind: "left" as const, minutes: 12 },
        { id: "b", at: iso(18, 20), kind: "right" as const, minutes: 10 },
      ],
      nappies: [
        { id: "n1", at: iso(9), kind: "wet" as const },
        { id: "n2", at: iso(12), kind: "both" as const },
        { id: "n3", at: iso(15), kind: "dirty" as const },
      ],
      sleeps: [{ id: "s", start: iso(16), end: iso(17, 30) }],
    };
    const s = babyStats(baby, now);
    expect(s.feedsToday).toBe(2);
    expect(s.nextSide).toBe("left");
    expect(s.wetToday).toBe(2);
    expect(s.dirtyToday).toBe(2);
    expect(s.sleptTodayMin).toBe(90);
    expect(fewWetNappies(s, "2026-08-28", now)).toBe(true);
    expect(fewWetNappies(s, "2026-11-04", now)).toBe(false); // too young
    expect(fewWetNappies(s, "2026-08-28", new Date(2026, 10, 6, 15))).toBe(false); // before 6 PM
  });
  it("titles weeks since birth", () => {
    expect(sinceBirthTitle("2026-08-28", "2026-11-06")).toBe("10 weeks since birth");
    expect(sinceBirthTitle("2026-11-01", "2026-11-06")).toBe("5 days since birth");
  });
  it("screens mood gently and always escalates thoughts of harm", () => {
    expect(postpartumScreen([0, 1, 1, 0, 0])).toBe("ok");
    expect(postpartumScreen([2, 2, 1, 1, 0])).toBe("talk");
    expect(postpartumScreen([0, 0, 0, 0, 1])).toBe("urgent");
  });
});

describe("Menopause Rating Scale", () => {
  it("adds 11 items to a score out of 44 with bands", () => {
    const s = { date: "2026-11-06", scores: { hot: 3, sleep: 3, mood: 2, joints: 2, tired: 2, anxious: 1, irritable: 2, dryness: 1, bladder: 0, desire: 1, heart: 0 } };
    expect(mrsTotal(s)).toBe(17);
    expect(mrsBand(17).label).toBe("Severe");
    expect(mrsBand(16).label).toBe("Moderate");
    expect(mrsBand(8).label).toBe("Mild");
    expect(mrsBand(4).label).toBe("Little or none");
    expect(mostBothersome(s).map((x) => x.id)).toEqual(["hot", "sleep", "mood"]);
  });
});

describe("My stage sample women", async () => {
  const { buildSample } = await import("./sampleData");
  const { cycleReadings } = await import("./fertility");
  const { mrsTotal } = await import("./stageCare");
  const TODAY = "2026-11-06";
  it("Sara: low temperatures every day this cycle and a positive test today", () => {
    const d = buildSample("sara", TODAY);
    const start = [...d.periodStarts].filter((x) => x <= TODAY).sort().pop()!;
    const r = cycleReadings(d.bbt, start, TODAY);
    expect(r.length).toBeGreaterThanOrEqual(9);
    expect(r.every((x) => x.c >= 36.3 && x.c <= 36.5)).toBe(true);
    expect(detectThermalShift(r).status).toBe("no-rise");
    expect(opkStatus(d.opk, start, TODAY).tone).toBe("positive");
  });
  it("Kavya: a baby 10 weeks old with feeds, nappies and sleep", () => {
    const d = buildSample("kavya", TODAY);
    expect(sinceBirthTitle(d.profile!.babyBirthDate!, TODAY)).toBe("10 weeks since birth");
    expect(d.baby!.feeds.length).toBeGreaterThan(8);
    expect(d.baby!.nappies.length).toBeGreaterThan(6);
  });
  it("Sunita and Lata: 6 weekly scores getting better", () => {
    for (const k of ["sunita", "lata"]) {
      const s = buildSample(k, TODAY).menoScores!;
      expect(s).toHaveLength(6);
      const t = s.map(mrsTotal);
      expect(t[5]).toBeLessThan(t[0]);
    }
    expect(buildSample("sunita", TODAY).menoScores!.map(mrsTotal)).toEqual([24, 22, 21, 19, 17, 15]);
  });
});
