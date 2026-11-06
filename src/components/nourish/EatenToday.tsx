"use client";

import { Salad } from "lucide-react";
import { addTotals } from "@/lib/foods";
import { useFoodToday, useMyDay } from "@/lib/myDay";
import { CardTitle, fmt, Progress } from "./bits";

export function coachLine(reason: string | null): string {
  if (reason === "pregnancy") return "Your coach will set your plan personally, because pregnancy needs change week by week. Meanwhile, you can still log meals.";
  if (reason === "breastfeeding") return "Your coach will set your plan personally, because feeding your baby changes what you need. Meanwhile, you can still log meals.";
  if (reason === "condition") return "Your coach will set your plan personally, so it fits your health condition and medicines. Meanwhile, you can still log meals.";
  return "Your coach will set your plan personally. Meanwhile, you can still log meals.";
}

export function EatenToday() {
  const { targets, coachReason, phase } = useMyDay();
  const entries = useFoodToday();
  const t = addTotals(entries);
  const showNumbers = coachReason !== "eating";

  return (
    <section className="card" aria-labelledby="eaten-today">
      <CardTitle icon={Salad} title={<span id="eaten-today">Eaten today</span>} />
      {targets ? (
        <>
          <p className="font-display text-[2.2rem] leading-none text-ink tabular">
            {fmt(t.kcal)} <span className="text-lg text-ink-soft">of {fmt(targets.kcal)} kcal</span>
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {t.kcal <= targets.kcal ? `${fmt(targets.kcal - t.kcal)} kcal left` : `${fmt(t.kcal - targets.kcal)} kcal over, and that's okay`}
            {targets.lutealExtra ? ` · includes +${targets.lutealExtra} for your luteal phase` : phase ? ` · matched to your ${phase === "ovulation" ? "ovulation window" : `${phase} phase`}` : ""}
          </p>
          <div className="mt-4">
            <Progress value={t.kcal} max={targets.kcal} label="Calories eaten today" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Macro label="Protein" value={t.protein} target={targets.protein} color="var(--primary)" />
            <Macro label="Carbs" value={t.carbs} target={targets.carbs} color="var(--ph-ovulation)" />
            <Macro label="Fat" value={t.fat} target={targets.fat} color="var(--ph-luteal)" />
            <Macro label="Fibre" value={t.fibre} target={targets.fibre} color="var(--accent-ink)" />
          </div>
        </>
      ) : coachReason ? (
        <>
          <p className="text-ink">{coachLine(coachReason)}</p>
          {showNumbers && entries.length > 0 && (
            <p className="mt-3 text-sm text-ink-soft tabular">
              Logged so far: {fmt(t.kcal)} kcal · Protein {fmt(t.protein)} g · Fibre {fmt(t.fibre)} g
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-ink">Add your age, height and weight under My numbers, and Saheli will work out a gentle daily target for you.</p>
          {entries.length > 0 && (
            <p className="mt-3 text-sm text-ink-soft tabular">
              Logged so far: {fmt(t.kcal)} kcal · Protein {fmt(t.protein)} g · Fibre {fmt(t.fibre)} g
            </p>
          )}
          <a href="#my-numbers" className="btn btn-secondary btn-sm mt-4">
            Add my numbers
          </a>
        </>
      )}
    </section>
  );
}

function Macro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-ink-soft tabular">
          {fmt(value)}/{fmt(target)} g
        </span>
      </div>
      <Progress value={value} max={target} color={color} label={`${label} today`} />
    </div>
  );
}
