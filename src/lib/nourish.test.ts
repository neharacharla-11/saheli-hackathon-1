import { describe, expect, it } from "vitest";
import { buildSample } from "./sampleData";
import { SAMPLES } from "./samples";
import { dailyTargets } from "./nutrition";
import { groceryFromText, planTexts, priyaDietPlan, recipesFor } from "./phaseFood";
import { buildWorkout, workoutMode } from "./workouts";
import { cleanDetails, cleanPlan, publicView } from "./server/coach";

const TODAY = "2026-11-06";

describe("sample women for Nourish, Move and Companion", () => {
  it("every woman has a chat and food today; numbers follow the safety rules", () => {
    for (const s of SAMPLES) {
      const d = buildSample(s.key, TODAY);
      expect(d.chat?.length, s.key).toBeGreaterThan(0);
      expect(d.food?.[TODAY]?.length, s.key).toBeGreaterThan(0);
      if (s.key === "anaya" || s.key === "ananya") expect(d.profile?.weightKg, s.key).toBeUndefined();
    }
  });

  it("Priya has a ready iron and vitamin D diet plan, a filled grocery list and a waiting workout request", () => {
    const d = buildSample("priya", TODAY);
    expect(d.dietRequest?.status).toBe("ready");
    expect(d.dietRequest?.plan?.intro).toMatch(/iron/i);
    expect(d.grocery?.length).toBeGreaterThan(8);
    expect(d.workoutRequest?.status).toBe("waiting");
    expect(d.health?.steps?.[TODAY]).toBeGreaterThan(0);
  });

  it("Priya's luteal target includes +100 and is above BMR", () => {
    const d = buildSample("priya", TODAY);
    const t = dailyTargets(d.profile, "luteal")!;
    expect(t.lutealExtra).toBe(100);
    expect(t.kcal).toBeGreaterThan(t.bmr);
  });

  it("coach-set women get no automatic targets", () => {
    for (const k of ["kavya", "farida", "ananya", "pooja", "meera", "anaya"]) {
      expect(dailyTargets(buildSample(k, TODAY).profile, "follicular"), k).toBeNull();
    }
  });

  it("Rekha's deficit is gentle and never below BMR", () => {
    const t = dailyTargets(buildSample("rekha", TODAY).profile, "follicular")!;
    expect(t.deficit).toBeGreaterThan(0);
    expect(t.kcal).toBeGreaterThanOrEqual(t.bmr);
  });
});

describe("grocery list", () => {
  it("fills itself from a plan and keeps her own items", () => {
    const list = groceryFromText(planTexts(priyaDietPlan(TODAY)), [{ id: "x", name: "Coriander", done: false }]);
    const names = list.map((g) => g.name);
    expect(names).toContain("Spinach (palak)");
    expect(names).toContain("Jowar flour");
    expect(names).toContain("Coriander");
  });
});

describe("workouts", () => {
  it("scales with minutes and never includes dance", () => {
    const short = buildWorkout("luteal", "home", 15);
    const long = buildWorkout("luteal", "home", 45);
    expect(long.main.length).toBeGreaterThan(short.main.length);
    for (const mode of ["period", "follicular", "ovulation", "luteal", "pregnancy", "postpartum", "menopause", "first-period"] as const) {
      for (const place of ["home", "gym"] as const) {
        const w = buildWorkout(mode, place, 45);
        expect(JSON.stringify(w)).not.toMatch(/danc|zumba/i);
      }
    }
  });

  it("follows her stage before her phase", () => {
    expect(workoutMode("pregnancy", "luteal")).toBe("pregnancy");
    expect(workoutMode("cycle", "ovulation")).toBe("ovulation");
    expect(buildWorkout("pregnancy", "home", 30).note).toMatch(/doctor/);
  });

  it("has two craving recipes for every phase", () => {
    for (const p of ["period", "follicular", "ovulation", "luteal"] as const) expect(recipesFor(p).length).toBe(2);
  });
});

describe("coach requests", () => {
  it("keeps only known goals and drops numbers without consent", () => {
    const d = cleanDetails({ name: " Priya ", goals: ["Lose fat", "hack"], shareNumbers: false, numbers: { weightKg: 58 } })!;
    expect(d.name).toBe("Priya");
    expect(d.goals).toEqual(["Lose fat"]);
    expect(d.numbers).toBeUndefined();
    expect(cleanDetails({ name: "A", goals: [] })).toBeNull();
  });

  it("needs at least one meal or day in a plan", () => {
    expect(cleanPlan({ intro: "x", meals: [{ slot: "Lunch", items: "" }] })).toBeNull();
    expect(cleanPlan({ intro: "x", meals: [{ slot: "Lunch", items: "Dal" }] })?.meals).toHaveLength(1);
  });

  it("never sends the secret hash or a draft to her phone", () => {
    const v = publicView({
      token: "abcdefghij",
      secretHash: "hash",
      kind: "diet",
      details: { name: "A", goals: ["Lose fat"], shareNumbers: false },
      status: "waiting",
      createdAt: TODAY,
      updatedAt: TODAY,
      draft: { intro: "", meals: [{ slot: "Lunch", items: "Dal" }], writtenAt: TODAY },
    });
    expect(JSON.stringify(v)).not.toMatch(/hash|draft|Dal/);
  });
});
