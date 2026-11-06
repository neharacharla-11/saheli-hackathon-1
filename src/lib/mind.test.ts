import { describe, expect, it } from "vitest";
import {
  BREATH_PATTERNS,
  breathAt,
  cycleSeconds,
  heavyStretch,
  mentionsSelfHarm,
  patternSentences,
  scorePmdd,
  statsByPhase,
} from "./mind";
import { addDays } from "./dates";
import type { DayLog } from "./types";

const box = BREATH_PATTERNS.find((p) => p.id === "box")!;
const f478 = BREATH_PATTERNS.find((p) => p.id === "478")!;

describe("breathing", () => {
  it("has the right cycle lengths", () => {
    expect(cycleSeconds(box)).toBe(16);
    expect(cycleSeconds(f478)).toBe(19);
    expect(cycleSeconds(BREATH_PATTERNS[0])).toBe(10);
  });
  it("walks through in, hold, out", () => {
    expect(breathAt(f478, 1).label).toBe("Breathe in");
    expect(breathAt(f478, 5).label).toBe("Hold");
    expect(breathAt(f478, 12).label).toBe("Breathe out");
    expect(breathAt(f478, 20).label).toBe("Breathe in");
  });
  it("grows on the in-breath and is full while holding", () => {
    expect(breathAt(box, 0).scale).toBeCloseTo(0);
    expect(breathAt(box, 2).scale).toBeCloseTo(0.5);
    expect(breathAt(box, 5).scale).toBe(1);
    expect(breathAt(box, 14).scale).toBe(0);
  });
});

describe("PMDD check", () => {
  it("flags the full pattern only when it gets in the way", () => {
    const answers = [3, 2, 2, 2, 2, 1, 2, 1, 1, 1, 1];
    expect(scorePmdd(answers, true).level).toBe("flag");
    expect(scorePmdd(answers, false).level).toBe("strong");
  });
  it("shows some strong symptoms for Nisha's answers", () => {
    const r = scorePmdd([2, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1], false);
    expect(r.level).toBe("strong");
    expect(r.title).toBe("Some strong premenstrual symptoms");
  });
  it("is mild with few symptoms", () => {
    expect(scorePmdd([1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1], false).level).toBe("mild");
  });
  it("always says it's a flag, not a diagnosis", () => {
    for (const lvl of [[3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]) {
      expect(scorePmdd(lvl, true).body).toContain("a flag, not a diagnosis");
    }
  });
});

describe("patterns", () => {
  it("finds lower energy and more low moods in the luteal phase", () => {
    const start = "2026-05-01";
    const starts = [0, 28, 56, 84].map((n) => addDays(start, n));
    const logs: Record<string, DayLog> = {};
    for (let i = 0; i < 112; i++) {
      const date = addDays(start, i);
      const day = (i % 28) + 1;
      const luteal = day >= 16;
      logs[date] = { energy: luteal ? 2 : 4, mood: luteal && i % 2 ? "low" : "good", stress: 2 };
    }
    const stats = statsByPhase(logs, starts, 28, 5);
    const lines = patternSentences(stats);
    expect(lines[0]).toMatch(/lowest in your luteal phase/);
    expect(lines.join(" ")).toMatch(/Harder moods show up most in your luteal phase/);
  });
  it("needs enough data", () => {
    expect(patternSentences(statsByPhase({}, [], 28, 5))).toEqual([]);
  });
});

describe("support signals", () => {
  it("notices a heavy stretch", () => {
    const today = "2026-11-06";
    const logs: Record<string, DayLog> = {
      [today]: { mood: "low" },
      [addDays(today, -1)]: { mood: "overwhelmed" },
      [addDays(today, -2)]: { mood: "good" },
      [addDays(today, -3)]: { mood: "low" },
    };
    expect(heavyStretch(logs, today)).toBe(true);
    expect(heavyStretch({ [today]: { mood: "low" } }, today)).toBe(false);
  });
  it("spots self-harm words", () => {
    expect(mentionsSelfHarm("Some days I don't want to live")).toBe(true);
    expect(mentionsSelfHarm("I want to end it all")).toBe(true);
    expect(mentionsSelfHarm("Work was hard but I'm okay")).toBe(false);
  });
});
