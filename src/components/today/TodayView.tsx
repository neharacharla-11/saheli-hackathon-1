"use client";

import { useState, type ReactNode } from "react";
import { CheckIn10 } from "./CheckIn10";
import { CycleCard } from "./CycleCard";
import { PatternNudge } from "./PatternNudge";
import { ChecklistCard, FoodCard, MoveCard, PhaseTips } from "./TodayCards";
import { WeightCard } from "@/components/weight/WeightCard";
import { usePhaseToday } from "@/components/checklist/useChecklist";
import { canShowWeight } from "@/lib/dailyCare";
import { learnedCycleLength, phaseForDay, PHASE_LABEL } from "@/lib/cycle";
import { todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";

/**
 * Today, in order: check-in, pattern, cycle card (or the other sessions'
 * pregnancy card passed in as `stageCard`), food and movement, checklist and
 * weight, extra cards (sugar), tips for her phase, and the demo slider.
 */
export function TodayView({ stageCard, extra }: { stageCard?: ReactNode; extra?: ReactNode }) {
  const today = todayISO();
  const profile = useProfileStore((s) => s.profile);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const realPhase = usePhaseToday(today);
  const [previewDay, setPreviewDay] = useState<number | null>(null);
  if (!profile) return null;

  const L = learnedCycleLength(periodStarts, profile.cycleLength);
  const cycles = realPhase !== null;
  const phase = previewDay && cycles ? phaseForDay(previewDay, L, profile.periodLength) : realPhase;
  const weight = canShowWeight(profile);

  return (
    <div className="space-y-5">
      <CheckIn10 />
      <PatternNudge />
      {stageCard}
      <CycleCard previewDay={previewDay} />
      <div className="grid gap-5 md:grid-cols-2">
        <FoodCard today={today} phase={phase} />
        <MoveCard phase={phase} />
      </div>
      <div className={`grid gap-5 ${weight ? "md:grid-cols-2" : ""}`}>
        <ChecklistCard today={today} />
        {weight && <WeightCard />}
      </div>
      {extra}
      <PhaseTips phase={phase} />
      {cycles && (
        <details className="rounded-[20px] border border-dashed border-line px-5 py-3 text-sm text-ink-soft">
          <summary className="font-semibold">Demo: preview any cycle day</summary>
          <div className="mt-3 flex flex-wrap items-center gap-3 pb-1">
            <label htmlFor="preview-day" className="shrink-0">
              Cycle day <span className="tabular font-semibold text-ink">{previewDay ?? "today"}</span>
              {previewDay && phase && ` · ${PHASE_LABEL[phase]}`}
            </label>
            <input
              id="preview-day"
              type="range"
              min={1}
              max={L}
              value={previewDay ?? 1}
              onChange={(e) => setPreviewDay(Number(e.target.value))}
              className="min-w-[160px] flex-1 accent-[var(--primary)]"
            />
            {previewDay && (
              <button type="button" onClick={() => setPreviewDay(null)} className="btn btn-secondary btn-sm">
                Back to today
              </button>
            )}
          </div>
          <p className="text-xs">Only changes this screen. Nothing is saved.</p>
        </details>
      )}
    </div>
  );
}
