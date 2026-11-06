"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Dumbbell, Flame, Info, Play } from "lucide-react";
import { MoveFigure } from "./MoveFigure";
import { GuidedWorkout } from "./GuidedWorkout";
import { Notice } from "@/components/nourish/bits";
import { useMyDay } from "@/lib/myDay";
import { useProfileStore } from "@/lib/store";
import { PHASE_VAR } from "@/lib/cycle";
import { todayISO } from "@/lib/dates";
import {
  buildSession,
  canBrowsePhases,
  doseLabel,
  MODE_LABEL,
  modeFor,
  PHASE_MODES,
  workoutsThisWeek,
  weekStreak,
  type Minutes,
  type Mode,
  type Move,
  type Place,
} from "@/lib/workoutLibrary";
import type { ProfileData } from "@/lib/types";

export function WorkoutCard() {
  const { profile, phase, log } = useMyDay();
  const done = useProfileStore((s) => (s as ProfileData).workoutsDone);
  // Tired or stressed today: start with a short one.
  const busy = (log?.energy ?? 3) <= 2 || (log?.stress ?? 0) >= 4;
  const own = modeFor(profile?.stage, phase);
  const browse = canBrowsePhases(profile?.stage);
  const [mode, setMode] = useState<Mode>(own);
  const [place, setPlace] = useState<Place>("home");
  const [minutes, setMinutes] = useState<Minutes>(busy ? 15 : 30);
  const [guided, setGuided] = useState(false);
  const s = buildSession(browse ? mode : own, place, minutes);
  const conditions = profile?.safety?.conditions ?? [];
  const today = todayISO();
  const week = workoutsThisWeek(done, today);
  const streak = weekStreak(done, today);

  return (
    <section className="card" aria-labelledby="workout-title">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        {browse ? (
          <div className="fade-x -mx-5 px-5 sm:mx-0 sm:px-0 sm:[mask-image:none]">
            <div className="flex w-max gap-2 pr-6 sm:pr-0" role="radiogroup" aria-label="Phase">
              {PHASE_MODES.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={mode === p}
                  onClick={() => setMode(p)}
                  className="chip"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PHASE_VAR[p] }} aria-hidden="true" />
                  {MODE_LABEL[p]}
                  {p === own && <span className={mode === p ? "text-on-primary/80" : "text-ink-soft"}>· now</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Workouts made for <span className="font-semibold text-ink">{MODE_LABEL[own].toLowerCase()}</span>.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Toggle
            label="Where"
            options={[
              ["home", "Home"],
              ["gym", "Gym"],
            ]}
            value={place}
            onChange={(v) => setPlace(v as Place)}
          />
          <Toggle
            label="How long"
            options={[
              ["15", "15 min"],
              ["30", "30 min"],
              ["45", "45 min"],
            ]}
            value={String(minutes)}
            onChange={(v) => setMinutes(Number(v) as Minutes)}
          />
        </div>
      </div>

      {/* Title and start */}
      <div className="mt-6 flex flex-col gap-5 border-t border-line pt-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="label mb-1">
            {MODE_LABEL[s.mode]} · {minutes} min · {place === "home" ? "Home" : "Gym"} · {s.level}
          </p>
          <h2 id="workout-title" className="flex items-center gap-2 font-display text-[1.8rem] leading-tight text-ink">
            <Dumbbell size={22} className="shrink-0 text-primary-ink" aria-hidden="true" />
            {s.title}
          </h2>
          <p className="mt-2 max-w-[600px] text-ink-soft">{s.line}</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold text-ink">
            <Flame size={15} className="text-primary-ink" aria-hidden="true" />
            This week: <span className="tabular">{week}</span> workout{week === 1 ? "" : "s"}
            {streak > 1 && <span className="font-normal text-ink-soft">· {streak} weeks in a row</span>}
          </p>
        </div>
        <button type="button" onClick={() => setGuided(true)} className="btn btn-primary btn-lg w-full shrink-0 md:w-auto">
          <Play size={18} fill="currentColor" /> Start workout
        </button>
      </div>

      {conditions.includes("diabetes") && (
        <div className="mt-5">
          <Notice icon={Info}>A 10-15 minute walk after each meal helps your sugar more than one long walk. Carry a small snack in case your sugar drops.</Notice>
        </div>
      )}

      <Block title="1. Warm-up" moves={s.warmup} />
      <Block title="2. Main" sub={`${s.rounds} rounds · rest ${s.restSec} sec between moves`} moves={s.main} />
      <Block title="3. Cool-down" moves={s.cooldown} />

      {s.note && (
        <div className="mt-6 rounded-2xl border-2 border-primary p-4 text-[15px] text-ink">
          <p className="font-semibold">Stay safe</p>
          <p className="mt-1 text-ink-soft">{s.note}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-ink-soft">
        Stop if anything hurts, or you feel dizzy or short of breath. Talk to your doctor before starting if you have a health condition.
      </p>

      {guided && <GuidedWorkout session={s} onClose={() => setGuided(false)} />}
    </section>
  );
}

function Block({ title, sub, moves }: { title: string; sub?: string; moves: Move[] }) {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        {sub && <p className="text-sm text-ink-soft">{sub}</p>}
      </div>
      <ul className="mt-3 grid gap-3 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
        {moves.map((m) => (
          <li key={m.id} className="flex gap-3.5 rounded-2xl border border-line bg-surface p-3.5">
            <MoveFigure icon={m.icon} size={64} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-ink">{m.name}</p>
              <p className="tabular text-sm font-semibold text-primary-ink">{doseLabel(m)}</p>
              <p className="mt-1 text-sm text-ink-soft">{m.how}</p>
              <div className="mt-2 grid gap-1 text-[13px] leading-snug sm:grid-cols-2 sm:gap-3">
                <p className="flex gap-1.5 text-ink">
                  <ArrowDown size={14} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">Easier:</span> {m.easier}
                  </span>
                </p>
                <p className="flex gap-1.5 text-ink">
                  <ArrowUp size={14} className="mt-0.5 shrink-0 text-primary-ink" aria-hidden="true" />
                  <span>
                    <span className="font-semibold">Harder:</span> {m.harder}
                  </span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full bg-surface-2 p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${value === v ? "bg-ink text-surface" : "text-ink hover:bg-surface"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
