"use client";

import { useState } from "react";
import { ChefHat, Clock, X } from "lucide-react";
import { PHASE_DAYS, recipesFor, type Recipe } from "@/lib/phaseFood";
import type { Phase } from "@/lib/cycle";
import { useMyDay } from "@/lib/myDay";
import { CardTitle } from "./bits";

const TABS: { id: Phase; label: string }[] = [
  { id: "period", label: "Period" },
  { id: "follicular", label: "Follicular" },
  { id: "ovulation", label: "Ovulation" },
  { id: "luteal", label: "Luteal" },
];

export function PhaseMeals() {
  const { phase, profile } = useMyDay();
  const [tab, setTab] = useState<Phase>(phase ?? "follicular");
  const [open, setOpen] = useState<Recipe | null>(null);
  const day = PHASE_DAYS[tab];
  const veg = !profile?.diet || ["vegetarian", "vegan", "jain", "eggetarian"].includes(profile.diet);
  const recipes = recipesFor(tab);

  return (
    <section className="card" aria-labelledby="phase-meals">
      <CardTitle eyebrow="EAT FOR YOUR PHASE" title={<span id="phase-meals">A day of meals for your {labelFor(tab)}</span>} />

      <div className="fade-x -mx-1 mb-5 flex gap-2 px-1 pb-1 pr-10" role="tablist" aria-label="Phase">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={(e) => {
              setTab(t.id);
              e.currentTarget.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
            }}
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-ink text-surface" : "bg-surface-2 text-ink hover:brightness-95"
            }`}
          >
            {t.label}
            {phase === t.id ? " · now" : ""}
          </button>
        ))}
      </div>

      <p className="font-semibold text-ink">{day.focus}</p>
      <p className="mt-1 max-w-[672px] text-[15px] text-ink-soft">{day.why}</p>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {day.meals.map((m, i) => (
          <li
            key={m.slot}
            className={`rounded-2xl bg-surface-2 p-4 ${i === day.meals.length - 1 && day.meals.length % 2 === 1 ? "sm:col-span-2" : ""}`}
          >
            <p className="label mb-1">{m.slot}</p>
            <p className="text-[15px] text-ink">{veg || !m.nonVeg ? m.veg : m.nonVeg}</p>
            {!veg && m.nonVeg && <p className="mt-1 text-xs text-ink-soft">Vegetarian swap: {m.veg}</p>}
          </li>
        ))}
      </ol>

      <h3 className="mb-3 mt-7 font-display text-[1.3rem] text-ink">Craving something? Make this instead</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {recipes.map((r) => (
          <div key={r.id} className="flex flex-col rounded-2xl border border-line p-4">
            <p className="text-sm text-ink-soft">{r.craving}</p>
            <p className="mt-1 font-display text-[1.2rem] leading-snug text-ink">{r.title}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
              <Clock size={14} aria-hidden="true" /> {r.minutes} min
            </p>
            <button className="btn btn-secondary btn-sm mt-3 self-start" onClick={() => setOpen(open?.id === r.id ? null : r)} aria-expanded={open?.id === r.id}>
              <ChefHat size={16} aria-hidden="true" />
              {open?.id === r.id ? "Hide recipe" : "See recipe"}
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-5" aria-live="polite">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="font-display text-[1.25rem] text-ink">{open.title}</p>
            <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface" onClick={() => setOpen(null)} aria-label="Close recipe">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label mb-1">YOU NEED</p>
              <ul className="list-disc pl-5 text-[15px] text-ink">
                {open.ingredients.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label mb-1">HOW</p>
              <ol className="list-decimal pl-5 text-[15px] text-ink">
                {open.steps.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-soft">{open.why}</p>
        </div>
      )}
    </section>
  );
}

function labelFor(p: Phase) {
  return p === "ovulation" ? "ovulation window" : `${p} phase`;
}
