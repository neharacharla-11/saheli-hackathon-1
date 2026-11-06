import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { cycleSummary, everydayCheckups, healthSuggestions, keysWithResults } from "./healthCheck";
import { buildSample } from "./sampleData";
import type { DayLog } from "./types";

const today = "2026-11-06";

function logs(n: number, log: DayLog): Record<string, DayLog> {
  const out: Record<string, DayLog> = {};
  for (let i = 0; i < n; i++) out[addDays(today, -i * 3)] = log;
  return out;
}

describe("healthSuggestions", () => {
  const profile = { stage: "cycle" as const, age: 30 };

  it("suggests iron tests for tiredness and heavy flow", () => {
    const s = healthSuggestions({ profile, dayLogs: { ...logs(8, { symptoms: ["Fatigue"] }), [addDays(today, -1)]: { flow: "heavy" }, [addDays(today, -2)]: { flow: "heavy" }, [addDays(today, -4)]: { flow: "heavy" } }, periodStarts: [], today });
    const tired = s.find((x) => x.id === "tired")!;
    expect(tired.tests.map((t) => t.label)).toEqual(["Blood count (CBC)", "Ferritin", "Vitamin B12"]);
    expect(tired.reason).toContain("heavy flow on 3 days");
  });

  it("maps each symptom to the right tests", () => {
    const ids = (log: DayLog) => healthSuggestions({ profile, dayLogs: logs(10, log), periodStarts: [], today }).map((x) => x.id);
    expect(ids({ symptoms: ["Joint pain"] })).toContain("pain");
    expect(ids({ symptoms: ["Hair fall"] })).toContain("hair");
    expect(ids({ symptoms: ["Acne"] })).toContain("pcos");
    expect(ids({ symptoms: ["Cramps"] })).toContain("painful-periods");
    expect(ids({ mood: "low" })).toContain("moods");
    expect(ids({ symptoms: ["Headache"] })).toContain("headaches");
    expect(ids({ mood: "good", energy: 4 })).toEqual([]);
  });

  it("links painful periods to the pain diary", () => {
    const s = healthSuggestions({ profile, dayLogs: {}, periodStarts: [], today, pain: [{ date: addDays(today, -5), score: 8 }, { date: addDays(today, -33), score: 7 }] });
    expect(s[0].link?.href).toBe("/app/pain");
  });

  it("flags irregular cycles but not for a girl with first periods", () => {
    const starts = [addDays(today, -130), addDays(today, -85), addDays(today, -40), addDays(today, -2)];
    expect(cycleSummary(starts, today).irregular).toBe(true);
    expect(healthSuggestions({ profile, dayLogs: {}, periodStarts: starts, today }).map((x) => x.id)).toEqual(["pcos"]);
    expect(healthSuggestions({ profile: { stage: "first-period", age: 12 }, dayLogs: {}, periodStarts: starts, today })).toEqual([]);
  });

  it("finds patterns in sample data and ticks tests she has results for", () => {
    const priya = buildSample("priya", today);
    const s = healthSuggestions({ profile: priya.profile, dayLogs: priya.dayLogs, periodStarts: priya.periodStarts, reports: priya.reports, today });
    expect(s.map((x) => x.id)).toEqual(expect.arrayContaining(["tired", "painful-periods"]));
    const have = keysWithResults(priya.reports, today);
    expect(have.has("ferritin")).toBe(true);
    const meera = buildSample("meera", today);
    expect(healthSuggestions({ profile: meera.profile, dayLogs: meera.dayLogs, periodStarts: meera.periodStarts, today }).map((x) => x.id)).toEqual(
      expect.arrayContaining(["pcos", "hair"]),
    );
  });
});

describe("everydayCheckups", () => {
  it("adapts to age", () => {
    expect(everydayCheckups({ stage: "first-period", age: 12 }).some((c) => c.id === "cervical")).toBe(false);
    expect(everydayCheckups({ stage: "menopause", age: 58 }).some((c) => c.id === "bone")).toBe(true);
  });
});
