import { describe, expect, it } from "vitest";
import { bmr, coachOnlyReason, dailyTargets } from "./nutrition";
import { FOODS, fitsDiet, scale, searchFoods } from "./foods";
import type { Profile } from "./types";

const base: Profile = {
  name: "Test",
  country: "IN",
  units: "metric",
  stage: "cycle",
  age: 27,
  heightCm: 162,
  weightKg: 58,
  activity: "light",
  goal: "maintain",
  cycleLength: 29,
  periodLength: 5,
  companionName: "Bestie",
  safety: { pregnant: false, breastfeeding: false, medicalCondition: false, conditions: [], eatingConcerns: false },
  createdAt: "2026-01-01",
};

describe("nutrition targets", () => {
  it("uses Mifflin-St Jeor for women", () => {
    expect(bmr(58, 162, 27)).toBe(Math.round(580 + 1012.5 - 135 - 161));
  });

  it("adds 100 kcal in the luteal phase", () => {
    const a = dailyTargets(base, "follicular")!;
    const b = dailyTargets(base, "luteal")!;
    expect(b.kcal - a.kcal).toBe(100);
    expect(b.lutealExtra).toBe(100);
  });

  it("never goes below BMR, even with a weight-loss goal and low activity", () => {
    const p = { ...base, goal: "lose" as const, activity: "low" as const, weightKg: 50, heightCm: 150, age: 50 };
    const t = dailyTargets(p, "follicular")!;
    expect(t.kcal).toBeGreaterThanOrEqual(t.bmr);
    expect(t.deficit).toBeLessThanOrEqual(500);
  });

  it("takes a gentle deficit for weight loss", () => {
    const p = { ...base, goal: "lose" as const, weightKg: 82, heightCm: 158, age: 35 };
    const t = dailyTargets(p, "follicular")!;
    expect(t.deficit).toBeGreaterThan(0);
    expect(t.kcal).toBeLessThan(t.maintenance);
    expect(t.kcal).toBeGreaterThanOrEqual(t.bmr);
  });

  it("is coach-only for pregnancy, breastfeeding, conditions, eating concerns and girls", () => {
    expect(dailyTargets({ ...base, stage: "pregnancy" }, null)).toBeNull();
    expect(dailyTargets({ ...base, safety: { ...base.safety, breastfeeding: true } }, null)).toBeNull();
    expect(dailyTargets({ ...base, safety: { ...base.safety, medicalCondition: true } }, null)).toBeNull();
    expect(dailyTargets({ ...base, safety: { ...base.safety, eatingConcerns: true } }, null)).toBeNull();
    expect(coachOnlyReason({ ...base, stage: "first-period" })).toBe("growing");
    expect(coachOnlyReason(base)).toBeNull();
  });

  it("needs her numbers", () => {
    expect(dailyTargets({ ...base, weightKg: undefined }, null)).toBeNull();
  });
});

describe("food list", () => {
  it("has about 150 foods with unique ids", () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(140);
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  });

  it("searches by name", () => {
    expect(searchFoods("dosa").map((f) => f.id)).toContain("masala-dosa");
    expect(searchFoods("jowar bhakri")[0].id).toBe("bhakri-jowar");
  });

  it("filters by diet", () => {
    const chicken = FOODS.find((f) => f.id === "chicken-curry")!;
    const egg = FOODS.find((f) => f.id === "omelette")!;
    expect(fitsDiet(chicken, "vegetarian")).toBe(false);
    expect(fitsDiet(egg, "eggetarian")).toBe(true);
    expect(fitsDiet(egg, "vegetarian")).toBe(false);
  });

  it("scales portions", () => {
    expect(scale({ kcal: 104, protein: 3.1, carbs: 18, fat: 2.4, fibre: 2.7 }, 2).kcal).toBe(208);
  });
});
