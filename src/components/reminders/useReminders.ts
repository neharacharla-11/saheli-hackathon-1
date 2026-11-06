"use client";

import { useMemo } from "react";
import { todayISO } from "@/lib/dates";
import { buildReminders, type MedicineLike, type Reminder } from "@/lib/reminders";
import { notificationTitle } from "@/lib/settingsStore";
import { DEFAULT_REMINDERS, useProfileStore } from "@/lib/store";
import type { ReminderSettings } from "@/lib/types";

const NO_MEDS: MedicineLike[] = [];

/** Contraception is owned by the Care pages; read its pill time loosely. */
interface ContraceptionLike {
  method?: string;
  pillTime?: string;
}

export function useReminderSettings(): ReminderSettings {
  const r = useProfileStore((s) => s.reminders);
  return useMemo(() => ({ ...DEFAULT_REMINDERS, ...r }), [r]);
}

export function useReminderList(): Reminder[] {
  const settings = useReminderSettings();
  const medicines = useProfileStore((s) => (s.customSupplements as MedicineLike[] | undefined) ?? NO_MEDS);
  const contraception = useProfileStore((s) => (s as unknown as { contraception?: ContraceptionLike | null }).contraception);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const cycleLength = useProfileStore((s) => s.profile?.cycleLength ?? 28);
  const stage = useProfileStore((s) => s.profile?.stage);
  const today = todayISO();
  return useMemo(
    () =>
      buildReminders({
        settings,
        medicines,
        pillTime: contraception?.method && /pill/i.test(contraception.method) ? contraception.pillTime : contraception?.pillTime,
        periodStarts,
        cycleLength,
        stage,
        today,
      }),
    [settings, medicines, contraception, periodStarts, cycleLength, stage, today],
  );
}

/** In discreet mode, notifications say nothing about health. */
export function forNotification(r: Reminder): Reminder {
  const title = notificationTitle();
  if (title === "Saheli") return r;
  return { ...r, title, body: "You have a reminder." };
}
