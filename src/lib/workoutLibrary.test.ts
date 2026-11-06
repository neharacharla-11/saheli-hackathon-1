import { describe, expect, it } from "vitest";
import {
  buildSession,
  canBrowsePhases,
  doseLabel,
  guidedSteps,
  modeFor,
  weekStreak,
  workoutsThisWeek,
  type Mode,
  type WorkoutDone,
} from "./workoutLibrary";

const MODES: Mode[] = ["period", "follicular", "ovulation", "luteal", "pregnancy", "postpartum", "menopause", "first-period"];

describe("sessions", () => {
  it("has home and gym workouts for every phase and stage, each move with easier and harder options", () => {
    for (const mode of MODES) {
      for (const place of ["home", "gym"] as const) {
        const s = buildSession(mode, place, 45);
        expect(s.main.length).toBe(6);
        for (const m of [...s.warmup, ...s.main, ...s.cooldown]) {
          expect(m.how.length).toBeGreaterThan(10);
          expect(m.easier).toBeTruthy();
          expect(m.harder).toBeTruthy();
          expect(Boolean(m.reps) !== Boolean(m.seconds)).toBe(true);
        }
      }
    }
  });

  it("uses machines and dumbbells at the gym", () => {
    const names = buildSession("follicular", "gym", 45).main.map((m) => m.name).join(" ");
    expect(names).toMatch(/machine|dumbbell/i);
    expect(buildSession("ovulation", "gym", 45).main.map((m) => m.name).join(" ")).toMatch(/Leg press/);
  });

  it("keeps period, pregnancy and after-birth workouts gentle", () => {
    for (const mode of ["period", "pregnancy", "postpartum"] as const) {
      const s = buildSession(mode, "gym", 45);
      expect(s.gentle).toBe(true);
      expect(s.rounds).toBeLessThanOrEqual(2);
      const names = s.main.map((m) => m.name).join(" ");
      expect(names).not.toMatch(/jump|hard|heavy|sprint|bench press|mountain/i);
    }
    expect(buildSession("pregnancy", "home", 30).note).toContain("lying flat");
  });

  it("scales with minutes", () => {
    expect(buildSession("luteal", "home", 15).main).toHaveLength(3);
    expect(buildSession("luteal", "home", 30).main).toHaveLength(4);
  });

  it("labels doses", () => {
    const s = buildSession("follicular", "home", 30);
    expect(doseLabel(s.main[0])).toBe("12 reps");
    expect(doseLabel(s.main.find((m) => m.id === "lunge")!)).toBe("10 reps each side");
    expect(doseLabel(s.warmup[0])).toBe("1 min");
  });
});

describe("modes", () => {
  it("follows stage, then phase", () => {
    expect(modeFor("pregnancy", "luteal")).toBe("pregnancy");
    expect(modeFor("cycle", "ovulation")).toBe("ovulation");
    expect(modeFor("cycle", null)).toBe("follicular");
    expect(canBrowsePhases("cycle")).toBe(true);
    expect(canBrowsePhases("postpartum")).toBe(false);
  });
});

describe("guidedSteps", () => {
  it("runs warm-up, rounds with rests between moves, then cool-down", () => {
    const s = buildSession("follicular", "home", 15); // 2 warm-up, 3 moves x 2 rounds, 2 cool-down
    const steps = guidedSteps(s);
    const moves = steps.filter((x) => x.kind === "move");
    const rests = steps.filter((x) => x.kind === "rest");
    expect(moves).toHaveLength(2 + 3 * 2 + 2);
    expect(rests).toHaveLength(3 * 2 - 1);
    expect(steps[0].section).toBe("Warm-up");
    expect(steps.at(-1)?.section).toBe("Cool-down");
    expect(rests.every((r) => r.seconds === s.restSec)).toBe(true);
    // Timed per-side moves count both sides.
    const hip = steps.find((x) => x.move.id === "hipCircles");
    expect(hip).toBeUndefined(); // only 2 warm-ups at 15 min
    const plank = steps.find((x) => x.move.id === "plank");
    expect(plank).toBeUndefined();
    const lunge = steps.find((x) => x.kind === "move" && x.move.id === "lunge")!;
    expect(lunge.reps).toBe(10);
    expect(lunge.seconds).toBeUndefined();
  });
});

describe("weekly workouts", () => {
  const w = (date: string): WorkoutDone => ({ date, at: `${date}T07:00`, minutes: 30, title: "x", mode: "luteal", place: "home" });
  it("counts this week from Sunday and a streak of weeks", () => {
    // 2026-11-06 is a Friday; the week starts Sunday 2026-11-01.
    const done = [w("2026-11-01"), w("2026-11-03"), w("2026-11-06"), w("2026-10-28"), w("2026-10-20")];
    expect(workoutsThisWeek(done, "2026-11-06")).toBe(3);
    expect(weekStreak(done, "2026-11-06")).toBe(3);
    expect(weekStreak([w("2026-10-28")], "2026-11-06")).toBe(1);
    expect(workoutsThisWeek(undefined, "2026-11-06")).toBe(0);
  });
});
