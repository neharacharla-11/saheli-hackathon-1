"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, Dumbbell, Plus, Salad } from "lucide-react";
import { ProgressBar, TickRow, WaterTracker } from "@/components/checklist/parts";
import { useChecklist } from "@/components/checklist/useChecklist";
import { PHASE_TIPS } from "@/lib/bodyWeather";
import { PHASE_VAR, type Phase } from "@/lib/cycle";
import { useFoodToday } from "@/lib/myDay";
import { coachOnlyReason, dailyTargets } from "@/lib/nutrition";
import { useProfileStore } from "@/lib/store";
import { buildSession, modeFor, workoutsThisWeek } from "@/lib/workoutLibrary";
import { todayISO } from "@/lib/dates";
import type { ProfileData } from "@/lib/types";

/* ---------------- Today's food ---------------- */

export function FoodCard({ today, phase }: { today: string; phase: Phase | null }) {
  const profile = useProfileStore((s) => s.profile);
  const glasses = useProfileStore((s) => s.water[today] ?? 0);
  const food = useFoodToday(today);
  if (!profile) return null;
  const girl = profile.stage === "first-period";
  const coach = coachOnlyReason(profile);
  const targets = dailyTargets(profile, phase);
  const kcal = Math.round(food.reduce((a, f) => a + f.kcal, 0));
  const protein = Math.round(food.reduce((a, f) => a + f.protein, 0));

  return (
    <section className="card flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Salad size={18} className="text-primary-ink" aria-hidden="true" /> Today&apos;s food
        </h2>
        <Link href="/app/nourish" className="text-sm font-semibold text-primary-ink hover:underline">
          Log a meal
        </Link>
      </div>
      {girl ? (
        <p className="text-[15px] text-ink-soft">
          Three meals, two snacks and plenty of water help your body grow. There are no numbers to count here.
        </p>
      ) : coach || !targets ? (
        <>
          <p className="font-display tabular text-[1.9rem] leading-tight text-ink">
            {kcal.toLocaleString("en-IN")} <span className="font-sans text-base text-ink-soft">kcal logged</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {coach
              ? "Your coach will set your targets personally. Meanwhile, you can still log meals."
              : "Add your age, height and weight in Nourish to see your daily target."}
          </p>
        </>
      ) : (
        <>
          <p className="font-display tabular text-[1.9rem] leading-tight text-ink">
            {kcal.toLocaleString("en-IN")}{" "}
            <span className="font-sans text-base text-ink-soft">of {targets.kcal.toLocaleString("en-IN")} kcal</span>
          </p>
          <div className="mt-2.5">
            <ProgressBar value={kcal / targets.kcal} label="Calories eaten today" />
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Protein <span className="tabular">{protein}</span> of <span className="tabular">{targets.protein}</span> g
            {targets.lutealExtra > 0 && ` · includes +${targets.lutealExtra} kcal for your luteal phase`}
          </p>
        </>
      )}
      <div className="my-4 border-t border-line" />
      <WaterTracker date={today} glasses={glasses} compact />
    </section>
  );
}

/* ---------------- Move today ---------------- */

export function MoveCard({ phase }: { phase: Phase | null }) {
  const profile = useProfileStore((s) => s.profile);
  const done = useProfileStore((s) => (s as ProfileData).workoutsDone);
  if (!profile) return null;
  const w = buildSession(modeFor(profile.stage, phase), "home", 30);
  const week = workoutsThisWeek(done, todayISO());
  return (
    <section className="card flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Dumbbell size={18} className="text-primary-ink" aria-hidden="true" /> Move today
        </h2>
        <p className="tabular text-sm text-ink-soft">
          This week: {week} workout{week === 1 ? "" : "s"}
        </p>
      </div>
      <p className="font-display text-[1.6rem] leading-snug text-ink">{w.title}</p>
      <p className="mt-1.5 flex-1 text-[15px] text-ink-soft">{w.line}</p>
      <Link href="/app/move" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary-ink hover:underline">
        30 min · Home <ArrowRight size={16} />
      </Link>
    </section>
  );
}

/* ---------------- Daily checklist ---------------- */

export function ChecklistCard({ today }: { today: string }) {
  const { items, ticked, done, total } = useChecklist(today);
  return (
    <section className="card flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <CircleCheck size={18} className="text-primary-ink" aria-hidden="true" /> Daily checklist
        </h2>
        <p className="tabular text-sm text-ink-soft">
          {done} of {total}
        </p>
      </div>
      <ProgressBar value={total ? done / total : 0} label="Checklist done today" />
      <ul className="mt-2">
        {items.map((it) => (
          <TickRow key={it.id} item={it} date={today} on={ticked.has(it.id)} />
        ))}
      </ul>
      <Link
        href="/app/checklist"
        className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-primary-ink hover:underline"
      >
        <Plus size={16} /> Add a medicine or reminder <ArrowRight size={15} />
      </Link>
    </section>
  );
}

/* ---------------- Tips for her phase ---------------- */

export function PhaseTips({ phase }: { phase: Phase | null }) {
  if (!phase) return null;
  const t = PHASE_TIPS[phase];
  return (
    <section className="panel">
      <h2 className="font-display text-[1.45rem] leading-tight text-ink">{t.title}</h2>
      <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {t.tips.map((tip) => (
          <li key={tip} className="flex gap-2.5 text-[15px] text-ink">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: PHASE_VAR[phase] }} aria-hidden="true" />
            {tip}
          </li>
        ))}
      </ul>
      <p className="mt-4 font-semibold text-ink">{t.craving}</p>
    </section>
  );
}
