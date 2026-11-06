"use client";

import { useState } from "react";
import { Check, Dumbbell, Info } from "lucide-react";
import { buildWorkout, MODE_LABEL, workoutMode, type Minutes, type Place } from "@/lib/workouts";
import { useMyDay } from "@/lib/myDay";
import type { Exercise } from "@/lib/workouts";
import { Notice } from "@/components/nourish/bits";

export function WorkoutCard() {
  const { profile, phase, log } = useMyDay();
  // Tired or stressed today: start with a short one.
  const busy = (log?.energy ?? 3) <= 2 || (log?.stress ?? 0) >= 4;
  const [place, setPlace] = useState<Place>("home");
  const [minutes, setMinutes] = useState<Minutes>(busy ? 15 : 30);
  const [done, setDone] = useState<Set<string>>(new Set());
  const mode = workoutMode(profile?.stage, phase);
  const w = buildWorkout(mode, place, minutes);
  const conditions = profile?.safety?.conditions ?? [];

  const toggle = (k: string) =>
    setDone((cur) => {
      const n = new Set(cur);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <section className="card" aria-labelledby="workout-title">
      <p className="label mb-1">
        {MODE_LABEL[mode]} · {minutes} MIN · {place === "home" ? "HOME" : "GYM"} · {w.level}
      </p>
      <h2 id="workout-title" className="flex items-center gap-2 font-display text-[1.8rem] leading-tight text-ink">
        <Dumbbell size={22} className="shrink-0 text-primary-ink" aria-hidden="true" />
        {w.title}
      </h2>
      <p className="mt-2 max-w-[672px] text-ink-soft">{w.line}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Toggle
          label="Where"
          options={[
            ["home", "Home"],
            ["gym", "Gym"],
          ]}
          value={place}
          onChange={(v) => {
            setPlace(v as Place);
            setDone(new Set());
          }}
        />
        <Toggle
          label="How long"
          options={[
            ["15", "15 min"],
            ["30", "30 min"],
            ["45", "45 min"],
          ]}
          value={String(minutes)}
          onChange={(v) => {
            setMinutes(Number(v) as Minutes);
            setDone(new Set());
          }}
        />
      </div>

      {conditions.includes("diabetes") && (
        <div className="mt-4">
          <Notice icon={Info}>A 10-15 minute walk after each meal helps your sugar more than one long walk. Carry a small snack in case your sugar drops.</Notice>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Block title="1. Warm-up" items={w.warmup} prefix="w" done={done} toggle={toggle} />
        <Block title={`2. Main · ${w.rounds} rounds`} sub={w.rest} items={w.main} prefix="m" done={done} toggle={toggle} />
        <Block title="3. Cool-down" items={w.cooldown} prefix="c" done={done} toggle={toggle} />
      </div>

      {w.note && (
        <div className="mt-5 rounded-2xl border-2 border-primary p-4 text-[15px] text-ink">
          <p className="font-semibold">Stay safe</p>
          <p className="mt-1 text-ink-soft">{w.note}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-ink-soft">Stop if anything hurts, you feel dizzy or short of breath. Talk to your doctor before starting if you have a health condition.</p>
    </section>
  );
}

function Toggle({ label, options, value, onChange }: { label: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full bg-surface-2 p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
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

function Block({
  title,
  sub,
  items,
  prefix,
  done,
  toggle,
}: {
  title: string;
  sub?: string;
  items: Exercise[];
  prefix: string;
  done: Set<string>;
  toggle: (k: string) => void;
}) {
  return (
    <div>
      <p className="font-semibold text-ink">{title}</p>
      {sub && <p className="text-xs text-ink-soft">{sub}</p>}
      <ol className="mt-2 flex flex-col gap-2">
        {items.map((e, i) => {
          const k = `${prefix}${i}`;
          const on = done.has(k);
          return (
            <li key={k} className="flex gap-3 rounded-2xl bg-surface-2 p-3">
              <button
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface"}`}
                onClick={() => toggle(k)}
                aria-pressed={on}
                aria-label={`${on ? "Untick" : "Tick"} ${e.name}`}
              >
                {on && <Check size={14} strokeWidth={3} aria-hidden="true" />}
              </button>
              <div className="min-w-0">
                <p className={`text-[15px] font-semibold ${on ? "text-ink-soft" : "text-ink"}`}>
                  {e.name} <span className="font-normal text-primary-ink tabular">· {e.dose}</span>
                </p>
                <p className="text-sm text-ink-soft">{e.how}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
