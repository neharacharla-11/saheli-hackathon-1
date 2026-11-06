import { useSyncExternalStore } from "react";
import { create, useStore, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CircleMember, DayLog, JournalEntry, LabReport, LifeStage, Measure, Profile, ProfileData, ProfileMeta, ReminderSettings, SugarReading } from "./types";

export type ThemeName =
  | "rose"
  | "lavender"
  | "peach"
  | "sage"
  | "ocean"
  | "berry"
  | "honey"
  | "violet"
  | "midnight"
  | "night-garden";
export type ModePref = "light" | "dark" | "system";

export const SAMPLE_ID = "sample";
export const APP_STORE_KEY = "saheli:app";
export const profileKey = (id: string) => `saheli:profile:${id}`;

/* ---------------- App store: who's using Saheli, theme, sample ---------------- */

export interface SampleState {
  key: string;
  name: string;
  label: string; // e.g. "regular cycle"
}

interface AppState {
  profiles: ProfileMeta[];
  activeId: string | null;
  sample: SampleState | null;
  theme: ThemeName;
  mode: ModePref;
  moodAdaptive: boolean;
  language: string;
  addProfile: (meta: ProfileMeta) => void;
  updateMeta: (id: string, patch: Partial<ProfileMeta>) => void;
  setActive: (id: string) => void;
  setSample: (sample: SampleState | null) => void;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ModePref) => void;
  setMoodAdaptive: (on: boolean) => void;
  setLanguage: (lang: string) => void;
}

const storage = createJSONStorage(() => localStorage);

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profiles: [],
      activeId: null,
      sample: null,
      theme: "rose",
      mode: "light",
      moodAdaptive: true,
      language: "en",
      addProfile: (meta) =>
        set((s) => ({
          profiles: [...s.profiles.filter((p) => p.id !== meta.id), meta],
          activeId: meta.id,
          sample: null,
        })),
      updateMeta: (id, patch) =>
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      setActive: (id) => set({ activeId: id, sample: null }),
      setSample: (sample) => set({ sample }),
      setTheme: (theme) => set({ theme }),
      setMode: (mode) => set({ mode }),
      setMoodAdaptive: (moodAdaptive) => set({ moodAdaptive }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: APP_STORE_KEY,
      storage,
      version: 1,
      partialize: (s) => ({
        profiles: s.profiles,
        activeId: s.activeId,
        sample: s.sample,
        theme: s.theme,
        mode: s.mode,
        moodAdaptive: s.moodAdaptive,
        language: s.language,
      }),
    },
  ),
);

/** The profile shown right now: the open sample, or her own active profile. */
export function useActiveId(): string | null {
  return useAppStore((s) => (s.sample ? SAMPLE_ID : s.activeId));
}

/* ---------------- Profile stores: one per person ---------------- */

export interface ProfileActions {
  setProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setPeriodStarts: (starts: string[]) => void;
  logDay: (date: string, patch: Partial<DayLog>) => void;
  addCircleMember: (member: CircleMember) => void;
  updateCircleMember: (id: string, patch: Partial<CircleMember>) => void;
  removeCircleMember: (id: string) => void;
  replaceAll: (data: Partial<ProfileData>) => void;
  addReport: (report: LabReport) => void;
  updateReport: (id: string, patch: Partial<LabReport>) => void;
  removeReport: (id: string) => void;
  setShareReportsWithCoach: (on: boolean) => void;
  addSugar: (r: SugarReading) => void;
  removeSugar: (id: string) => void;
  addMeasure: (m: Measure) => void;
  removeMeasure: (id: string) => void;
  addJournal: (e: JournalEntry) => void;
  removeJournal: (id: string) => void;
  setReminders: (patch: Partial<ReminderSettings>) => void;
  setWeight: (date: string, kg: number) => void;
}

export type ProfileStore = ProfileData & ProfileActions;

export function emptyProfileData(): ProfileData {
  return {
    profile: null,
    periodStarts: [],
    dayLogs: {},
    quickCheckins: {},
    water: {},
    checklist: {},
    weights: {},
    circle: [],
    reports: [],
    shareReportsWithCoach: false,
  };
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  notify: false,
  water: true,
  waterTimes: ["10:00", "13:00", "16:00", "19:00"],
  periodTomorrow: true,
  medicines: true,
};

const stores = new Map<string, UseBoundStore<StoreApi<ProfileStore>>>();

export function profileStore(id: string): UseBoundStore<StoreApi<ProfileStore>> {
  const existing = stores.get(id);
  if (existing) return existing;
  const store = create<ProfileStore>()(
    persist(
      (set) => ({
        ...emptyProfileData(),
        setProfile: (profile) => set({ profile }),
        updateProfile: (patch) =>
          set((s) => (s.profile ? { profile: { ...s.profile, ...patch } } : {})),
        setPeriodStarts: (starts) => set({ periodStarts: [...new Set(starts)].sort() }),
        logDay: (date, patch) =>
          set((s) => ({ dayLogs: { ...s.dayLogs, [date]: { ...s.dayLogs[date], ...patch } } })),
        addCircleMember: (member) => set((s) => ({ circle: [...s.circle, member] })),
        updateCircleMember: (mid, patch) =>
          set((s) => ({ circle: s.circle.map((m) => (m.id === mid ? { ...m, ...patch } : m)) })),
        removeCircleMember: (mid) => set((s) => ({ circle: s.circle.filter((m) => m.id !== mid) })),
        replaceAll: (data) => set({ ...emptyProfileData(), ...data }),
        addReport: (report) =>
          set((s) => ({ reports: [...(s.reports ?? []).filter((r) => r.id !== report.id), report] })),
        updateReport: (rid, patch) =>
          set((s) => ({ reports: (s.reports ?? []).map((r) => (r.id === rid ? { ...r, ...patch } : r)) })),
        removeReport: (rid) => set((s) => ({ reports: (s.reports ?? []).filter((r) => r.id !== rid) })),
        setShareReportsWithCoach: (shareReportsWithCoach) => set({ shareReportsWithCoach }),
        addSugar: (r) => set((s) => ({ sugar: [...(s.sugar ?? []).filter((x) => x.id !== r.id), r] })),
        removeSugar: (rid) => set((s) => ({ sugar: (s.sugar ?? []).filter((x) => x.id !== rid) })),
        addMeasure: (m) => set((s) => ({ measures: [...(s.measures ?? []).filter((x) => x.id !== m.id), m] })),
        removeMeasure: (mid) => set((s) => ({ measures: (s.measures ?? []).filter((x) => x.id !== mid) })),
        addJournal: (e) => set((s) => ({ journal: [...(s.journal ?? []), e] })),
        removeJournal: (jid) => set((s) => ({ journal: (s.journal ?? []).filter((x) => x.id !== jid) })),
        setReminders: (patch) => set((s) => ({ reminders: { ...DEFAULT_REMINDERS, ...s.reminders, ...patch } })),
        setWeight: (date, kg) => set((s) => ({ weights: { ...s.weights, [date]: kg } })),
      }),
      {
        name: profileKey(id),
        storage,
        version: 1,
        partialize: (s) => {
          const data: Partial<ProfileStore> = { ...s };
          for (const k of Object.keys(data) as (keyof ProfileStore)[]) {
            if (typeof data[k] === "function") delete data[k];
          }
          return data as ProfileData;
        },
      },
    ),
  );
  stores.set(id, store);
  return store;
}

const NO_PROFILE = "__none__";

/** Read from the active profile's store. */
export function useProfileStore<T>(selector: (s: ProfileStore) => T): T {
  const id = useActiveId();
  return useStore(profileStore(id ?? NO_PROFILE), selector);
}

/** Actions for the active profile (stable for a given profile). */
export function activeProfileStore(): UseBoundStore<StoreApi<ProfileStore>> {
  const s = useAppStore.getState();
  return profileStore(s.sample ? SAMPLE_ID : (s.activeId ?? NO_PROFILE));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().slice(0, 12);
  return Math.random().toString(36).slice(2, 14);
}

/* ---------------- Hydration ---------------- */

const noopSubscribe = () => () => {};

/** False during server render and the first client render, true after. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/* ---------------- Labels ---------------- */

export const STAGE_LABEL: Record<LifeStage, string> = {
  cycle: "Regular cycle",
  pcos: "PCOS / PCOD",
  ttc: "Trying to conceive",
  pregnancy: "Pregnancy",
  postpartum: "New mother",
  menopause: "Perimenopause or menopause",
  "first-period": "First periods",
};

/** Menu label for "My stage". */
export const STAGE_MENU_LABEL: Record<LifeStage, string> = {
  cycle: "My stage",
  pcos: "PCOS care",
  ttc: "Conceive",
  pregnancy: "Pregnancy",
  postpartum: "Postpartum",
  menopause: "Menopause",
  "first-period": "First periods",
};
