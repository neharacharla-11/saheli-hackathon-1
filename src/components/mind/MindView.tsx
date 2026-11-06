"use client";

import { addDays, todayISO } from "@/lib/dates";
import { heavyStretch, mentionsSelfHarm } from "@/lib/mind";
import { useProfileStore } from "@/lib/store";
import { BreatheCard } from "./Breathe";
import type { ReactNode } from "react";
import { CheckInCard } from "./CheckIn";
import { PatternsCard, PmddCard, SupportCard } from "./Insights";
import { SoundsCard } from "./Sounds";

const PMDD_STAGES = new Set(["cycle", "pcos", "ttc"]);

/** A support card at the top when she's had heavy days or wrote something worrying. */
export function MindSupport() {
  const logs = useProfileStore((s) => s.dayLogs);
  const today = todayISO();
  // Notes she wrote in the last 2 weeks (check-in notes; and journal entries)
  // journal comes from the Journal card (another phase); read it loosely so Mind works without it
  const journal = useProfileStore((s) => (s as { journal?: { at: string; text: string }[] }).journal);
  const recentText = [
    ...Object.entries(logs)
      .filter(([d]) => d >= addDays(today, -14))
      .map(([, l]) => l.note ?? ""),
    ...(journal ?? []).filter((j) => j.at.slice(0, 10) >= addDays(today, -14)).map((j) => j.text),
  ].join("\n");
  const urgent = mentionsSelfHarm(recentText);
  const heavy = heavyStretch(logs, today);
  if (!urgent && !heavy) return null;
  return <SupportCard urgent={urgent} />;
}

/** Sleep, then check-in and breathing side by side, then calm sounds. The sleep card comes from the health sync. */
export function MindTop({ sleep }: { sleep?: ReactNode }) {
  return (
    <div className="space-y-5">
      <MindSupport />
      {sleep}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        <CheckInCard />
        <BreatheCard />
      </div>
      <SoundsCard />
    </div>
  );
}

/** PMDD check (cycle stages only) and patterns. */
export function MindBottom() {
  const stage = useProfileStore((s) => s.profile?.stage);
  return (
    <div className="space-y-5">
      {stage && PMDD_STAGES.has(stage) && <PmddCard />}
      <PatternsCard />
    </div>
  );
}
