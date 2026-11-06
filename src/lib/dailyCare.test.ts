import { describe, expect, it } from "vitest";
import {
  canShowWeight,
  checkinStreak,
  checklistItems,
  fromDisplayWeight,
  tickedFor,
  tiredOnHeavyDays,
  toDisplayWeight,
  weightSummary,
} from "./dailyCare";
import { bodyWeather } from "./bodyWeather";
import { addDays } from "./dates";
import type { DayLog, SafetyFlags } from "./types";

const safe: SafetyFlags = { pregnant: false, breastfeeding: false, medicalCondition: false, conditions: [], eatingConcerns: false };

describe("canShowWeight", () => {
  it("follows the safety rules", () => {
    expect(canShowWeight({ stage: "cycle", safety: safe })).toBe(true);
    expect(canShowWeight({ stage: "cycle", safety: { ...safe, eatingConcerns: true } })).toBe(false);
    expect(canShowWeight({ stage: "first-period", safety: safe })).toBe(false);
    expect(canShowWeight({ stage: "pregnancy", safety: { ...safe, pregnant: true } })).toBe(false);
    expect(canShowWeight({ stage: "menopause", safety: safe })).toBe(true);
    expect(canShowWeight(null)).toBe(false);
  });
});

describe("weight units and summary", () => {
  it("converts kg and lb", () => {
    expect(toDisplayWeight(61.3, "metric")).toBe(61.3);
    expect(toDisplayWeight(61.3, "imperial")).toBe(135.1);
    expect(fromDisplayWeight(135.1, "imperial")).toBeCloseTo(61.28, 1);
  });

  it("finds the last weight and the change since a week ago", () => {
    const w = { "2026-10-20": 62.4, "2026-10-29": 61.8, "2026-11-05": 61.3 };
    const s = weightSummary(w, "2026-11-06");
    expect(s.last).toEqual({ date: "2026-11-05", kg: 61.3 });
    expect(s.weekChange).toBe(-0.5);
    expect(s.change90).toBe(-1.1);
    expect(weightSummary({}, "2026-11-06")).toEqual({});
  });
});

describe("checklist", () => {
  it("has 5 supplements as advised, water, sleep and movement, plus her medicines", () => {
    const items = checklistItems({ stage: "cycle" }, "luteal", [{ id: "a", name: "Iron + folic acid", when: "After lunch" }]);
    expect(items.map((i) => i.id)).toEqual(["iron", "vitd", "b12", "omega3", "magnesium", "water", "sleep", "move", "own-a"]);
    expect(items.find((i) => i.focus)?.id).toBe("magnesium");
    expect(items.at(-1)?.when).toBe("After lunch");
  });

  it("shows no supplements for first periods", () => {
    expect(checklistItems({ stage: "first-period" }, "period").map((i) => i.id)).toEqual(["water", "sleep", "move"]);
  });

  it("ticks water at 8 glasses", () => {
    expect(tickedFor(["iron"], 8).has("water")).toBe(true);
    expect(tickedFor(["iron", "water"], 5).has("water")).toBe(false);
  });
});

describe("check-in streak", () => {
  it("counts days in a row, starting yesterday if today isn't done", () => {
    const today = "2026-11-06";
    const quick: Record<string, boolean> = {};
    for (let i = 1; i <= 9; i++) quick[addDays(today, -i)] = true;
    expect(checkinStreak(quick, today)).toBe(9);
    quick[today] = true;
    expect(checkinStreak(quick, today)).toBe(10);
    expect(checkinStreak({}, today)).toBe(0);
  });
});

describe("patterns", () => {
  it("notices tiredness on heavy-flow days", () => {
    const today = "2026-11-06";
    const logs: Record<string, DayLog> = {};
    [3, 4, 32, 33, 61].forEach((i, n) => {
      logs[addDays(today, -i)] = { flow: "heavy", ...(n < 4 ? { symptoms: ["Fatigue"] } : { energy: 4 }) };
    });
    const p = tiredOnHeavyDays(logs, today)!;
    expect(p.line).toContain("4 of your 5");
    expect(p.tests).toContain("Ferritin");
    expect(tiredOnHeavyDays({}, today)).toBeNull();
  });
});

describe("bodyWeather", () => {
  it("is typical for the phase without logs", () => {
    const w = bodyWeather("luteal");
    expect(w.bars.map((b) => b.label)).toEqual(["Energy", "Mood", "Cravings", "Sleep", "Focus"]);
    expect(w.bars.find((b) => b.key === "cravings")?.word).toBe("Likely");
    expect(w.learnedFrom).toBe(0);
  });

  it("learns energy from her luteal days", () => {
    const starts = ["2026-09-21", "2026-10-20"];
    const logs: Record<string, DayLog> = {};
    for (let i = 0; i < 8; i++) logs[addDays("2026-10-08", i)] = { energy: 1, mood: "low" }; // luteal days of the first cycle
    const w = bodyWeather("luteal", logs, starts, 29, 5);
    const energy = w.bars.find((b) => b.key === "energy")!;
    expect(energy.level).toBe(1);
    expect(energy.learned).toBe(true);
    expect(w.learnedFrom).toBe(1);
  });
});
