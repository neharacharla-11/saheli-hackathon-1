"use client";

import { cycleDay, nextPeriod, phaseForDay, type Phase } from "./cycle";
import { addDays, todayISO } from "./dates";
import { activeProfileStore, newId, useProfileStore } from "./store";
import { coachOnlyReason, dailyTargets } from "./nutrition";
import type { ChatMessage, CustomFood, FoodEntry, GroceryItem, MealSlot, PlanRequest, ProfileData } from "./types";

const NO_FOOD: FoodEntry[] = [];

/** Her day: cycle day, phase and today's targets. */
export function useMyDay() {
  const profile = useProfileStore((s) => s.profile);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const today = todayISO();
  const log = useProfileStore((s) => s.dayLogs[today]);
  const usesCycle = !!profile && !["pregnancy", "postpartum", "menopause"].includes(profile.stage);
  const day = usesCycle && profile ? cycleDay(periodStarts, today, profile.cycleLength) : null;
  const phase: Phase | null = day && profile ? phaseForDay(day, profile.cycleLength, profile.periodLength) : null;
  const next = usesCycle && profile ? nextPeriod(periodStarts, today, profile.cycleLength) : null;
  const targets = dailyTargets(profile, phase);
  const coachReason = coachOnlyReason(profile);
  return { profile, today, day, phase, nextPeriod: next, log, targets, coachReason };
}

export function useFoodToday(date = todayISO()): FoodEntry[] {
  return useProfileStore((s) => (s as ProfileData).food?.[date] ?? NO_FOOD);
}

/* ---------------- Actions (write to the active profile's store) ---------------- */

function set(fn: (s: ProfileData) => Partial<ProfileData>) {
  const store = activeProfileStore();
  store.setState((s) => fn(s) as never);
}

export function addFoodEntries(date: string, entries: Omit<FoodEntry, "id" | "at">[]) {
  const at = new Date().toISOString();
  set((s) => ({
    food: { ...(s.food ?? {}), [date]: [...(s.food?.[date] ?? []), ...entries.map((e) => ({ ...e, id: newId(), at }))] },
  }));
}

export function removeFoodEntry(date: string, id: string) {
  set((s) => ({ food: { ...(s.food ?? {}), [date]: (s.food?.[date] ?? []).filter((e) => e.id !== id) } }));
}

export function addCustomFood(food: Omit<CustomFood, "id">): CustomFood {
  const f = { ...food, id: `own-${newId()}` };
  set((s) => ({ customFoods: [...(s.customFoods ?? []), f] }));
  return f;
}

export function setChat(chat: ChatMessage[]) {
  set(() => ({ chat: chat.slice(-200) }));
}

export function setGrocery(grocery: GroceryItem[]) {
  set(() => ({ grocery }));
}

export function setPlanRequest(kind: "diet" | "workout", req: PlanRequest | null) {
  set(() => (kind === "diet" ? { dietRequest: req } : { workoutRequest: req }));
}

export const MEALS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "snack", label: "Snack" },
  { id: "dinner", label: "Dinner" },
];

/** A sensible meal for the time of day. */
export function mealForNow(d = new Date()): MealSlot {
  const h = d.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

export function lastNDays(n: number, today = todayISO()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}
