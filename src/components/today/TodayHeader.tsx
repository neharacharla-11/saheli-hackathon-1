"use client";

import { cycleDay, phaseForDay, PHASE_LABEL, PHASE_VAR } from "@/lib/cycle";
import { formatLong, todayISO } from "@/lib/dates";
import { STAGE_LABEL, useProfileStore } from "@/lib/store";

export function TodayHeader() {
  const profile = useProfileStore((s) => s.profile);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const today = todayISO();
  if (!profile) return null;

  const usesCycle = !["pregnancy", "menopause"].includes(profile.stage);
  const day = usesCycle ? cycleDay(periodStarts, today, profile.cycleLength) : null;
  const phase = day ? phaseForDay(day, profile.cycleLength, profile.periodLength) : null;

  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-ink-soft">{formatLong(today)}</p>
        <h1 className="font-display text-[2.3rem] leading-[1.1] text-ink sm:text-[2.6rem]">Hello, {profile.name}</h1>
      </div>
      <span className="inline-flex h-9 items-center gap-2 rounded-full bg-surface-2 px-3.5 text-sm font-semibold text-ink">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: phase ? PHASE_VAR[phase] : "var(--primary)" }}
          aria-hidden="true"
        />
        {phase ? `${PHASE_LABEL[phase]} · day ${day}` : STAGE_LABEL[profile.stage]}
      </span>
    </header>
  );
}
