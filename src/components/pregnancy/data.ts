"use client";

import { activeProfileStore, newId, useAppStore, useProfileStore, type ProfileStore } from "@/lib/store";
import type { ProfileData } from "@/lib/types";
import type { BabyBook, PregnancyExtras } from "@/lib/pregnancyTypes";

/** Write to the active profile (her own, or the open sample). */
export function updateData(fn: (s: ProfileStore) => Partial<ProfileData>) {
  const store = activeProfileStore();
  store.setState(fn(store.getState()));
}

export function updatePregnancy(patch: Partial<PregnancyExtras>) {
  updateData((s) => ({ pregnancy: { ...s.pregnancy, ...patch } }));
}

export const EMPTY_BOOK: BabyBook = { names: [], wishes: [], letters: [] };

export function useBabyBook(): BabyBook {
  return useProfileStore((s) => s.babyBook) ?? EMPTY_BOOK;
}

export function updateBook(fn: (b: BabyBook) => BabyBook) {
  updateData((s) => ({ babyBook: fn(s.babyBook ?? EMPTY_BOOK) }));
}

/** Change her life stage, keeping the profile list label in step. */
export function setStage(patch: Partial<NonNullable<ProfileData["profile"]>>) {
  const store = activeProfileStore();
  store.getState().updateProfile(patch);
  const app = useAppStore.getState();
  if (!app.sample && app.activeId && patch.stage) app.updateMeta(app.activeId, { stage: patch.stage });
}

export { newId };

export function nowISO(): string {
  return new Date().toISOString();
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
