"use client";

import { activeProfileStore, newId } from "./store";
import { todayISO } from "./dates";
import type { CustomSupplement, DayLog, ProfileData } from "./types";

/** Write to the active profile (her own, or the open sample). */
function set(fn: (s: ProfileData) => Partial<ProfileData>) {
  activeProfileStore().setState((s) => fn(s) as never);
}

export function toggleChecklist(date: string, id: string) {
  set((s) => {
    const cur = new Set(s.checklist[date] ?? []);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    return { checklist: { ...s.checklist, [date]: [...cur] } };
  });
}

export function setWater(date: string, glasses: number) {
  const g = Math.max(0, Math.min(16, Math.round(glasses)));
  set((s) => ({ water: { ...s.water, [date]: g } }));
}

export function saveWeight(date: string, kg: number) {
  set((s) => ({ weights: { ...s.weights, [date]: Math.round(kg * 100) / 100 } }));
}

export function removeWeight(date: string) {
  set((s) => {
    const next = { ...s.weights };
    delete next[date];
    return { weights: next };
  });
}

export function addCustomSupplement(c: Omit<CustomSupplement, "id">): CustomSupplement {
  const item = { ...c, id: newId() };
  set((s) => ({ customSupplements: [...(s.customSupplements ?? []), item] }));
  return item;
}

export function removeCustomSupplement(id: string) {
  set((s) => ({ customSupplements: (s.customSupplements ?? []).filter((c) => c.id !== id) }));
}

/** The 10-second check-in writes to the same day log as the full check-in on Mind. */
export function quickCheckIn(patch: Partial<DayLog>, seconds?: number, date = todayISO()) {
  set((s) => {
    const log = { ...s.dayLogs[date], ...patch };
    const done = !!log.mood && log.energy !== undefined;
    return {
      dayLogs: { ...s.dayLogs, [date]: log },
      quickCheckins: done ? { ...s.quickCheckins, [date]: true } : s.quickCheckins,
      ...(done && seconds !== undefined && !s.checkinSeconds?.[date]
        ? { checkinSeconds: { ...(s.checkinSeconds ?? {}), [date]: seconds } }
        : {}),
    };
  });
}

export function toggleSymptom(symptom: string, date = todayISO()) {
  set((s) => {
    const cur = new Set(s.dayLogs[date]?.symptoms ?? []);
    if (cur.has(symptom)) cur.delete(symptom);
    else cur.add(symptom);
    return { dayLogs: { ...s.dayLogs, [date]: { ...s.dayLogs[date], symptoms: [...cur] } } };
  });
}

/** Tick an item without toggling it off (e.g. "20 minutes of movement" after a workout). */
export function markChecklist(date: string, id: string) {
  set((s) => {
    const cur = s.checklist[date] ?? [];
    return cur.includes(id) ? {} : { checklist: { ...s.checklist, [date]: [...cur, id] } };
  });
}

/** A finished guided workout: log it and tick "20 minutes of movement" for the day. */
export function logWorkout(w: import("./workoutLibrary").WorkoutDone) {
  set((s) => ({ workoutsDone: [...(s.workoutsDone ?? []), w].slice(-500) }));
  markChecklist(w.date, "move");
}
