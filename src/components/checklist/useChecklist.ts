"use client";

import { cycleDay, learnedCycleLength, phaseForDay, type Phase } from "@/lib/cycle";
import { checklistItems, tickedFor } from "@/lib/dailyCare";
import { useProfileStore } from "@/lib/store";
import type { CustomSupplement, ProfileData } from "@/lib/types";

const NONE: CustomSupplement[] = [];

/** Her phase today using her learned cycle length, or null when cycles don't apply. */
export function usePhaseToday(today: string): Phase | null {
  const profile = useProfileStore((s) => s.profile);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  if (!profile || ["pregnancy", "postpartum", "menopause"].includes(profile.stage)) return null;
  const L = learnedCycleLength(periodStarts, profile.cycleLength);
  const d = cycleDay(periodStarts, today, L);
  return d ? phaseForDay(d, L, profile.periodLength) : null;
}

export function useChecklist(date: string) {
  const profile = useProfileStore((s) => s.profile);
  const custom = useProfileStore((s) => (s as ProfileData).customSupplements ?? NONE);
  const ticks = useProfileStore((s) => s.checklist[date]);
  const glasses = useProfileStore((s) => s.water[date] ?? 0);
  const phase = usePhaseToday(date);
  const items = checklistItems(profile, phase, custom);
  const ticked = tickedFor(ticks, glasses);
  const done = items.filter((i) => ticked.has(i.id)).length;
  return { items, ticked, done, total: items.length, glasses, custom, phase };
}
