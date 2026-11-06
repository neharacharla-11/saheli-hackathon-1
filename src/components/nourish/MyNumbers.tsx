"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { ACTIVITY_LABEL, cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/nutrition";
import { activeProfileStore } from "@/lib/store";
import { useMyDay } from "@/lib/myDay";
import type { Activity, DietType, Goal, Profile } from "@/lib/types";
import { CardTitle, fmt } from "./bits";
import { coachLine } from "./EatenToday";

const GOALS: { id: Goal; label: string }[] = [
  { id: "feel-better", label: "Feel better" },
  { id: "maintain", label: "Stay as I am" },
  { id: "lose", label: "Lose weight gently" },
  { id: "gain", label: "Gain healthy weight" },
  { id: "strength", label: "Get stronger" },
];

const DIETS: { id: DietType; label: string }[] = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "eggetarian", label: "Eggetarian" },
  { id: "non-vegetarian", label: "Non-vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain" },
];

export function MyNumbers() {
  const { profile, targets, coachReason } = useMyDay();
  if (!profile) return null;
  const hideWeight = coachReason === "eating" || profile.stage === "pregnancy";

  return (
    <section id="my-numbers" className="card scroll-mt-24" aria-labelledby="my-numbers-title">
      <CardTitle icon={Calculator} title={<span id="my-numbers-title">My numbers</span>} />
      <div className="grid gap-6 md:grid-cols-2">
        <AboutForm profile={profile} hideWeight={hideWeight} />
        <div className="rounded-2xl bg-surface-2 p-5">
          <p className="label mb-3">YOUR NUMBERS</p>
          {targets ? (
            <dl className="flex flex-col divide-y divide-line">
              <Row label="Energy at rest (BMR)" value={`${fmt(targets.bmr)} kcal`} note="What your body uses just to keep you alive. Saheli never goes below this." />
              <Row label="Maintenance" value={`${fmt(targets.maintenance)} kcal`} note="With your everyday activity." />
              <Row
                label="Today's target"
                value={`${fmt(targets.kcal)} kcal`}
                note={[
                  targets.deficit ? `A gentle ${fmt(targets.deficit)} kcal below maintenance` : "",
                  targets.lutealExtra ? `+${targets.lutealExtra} for your luteal phase` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
                strong
              />
              <Row label="Protein" value={`${targets.protein} g`} note="Spread across your meals." />
              <Row label="Fibre" value={`${targets.fibre} g`} />
            </dl>
          ) : coachReason ? (
            <p className="text-[15px] text-ink">{coachLine(coachReason)}</p>
          ) : (
            <p className="text-[15px] text-ink">Add your age, height and weight and Saheli will work out your numbers. Nothing leaves your phone.</p>
          )}
          <p className="mt-4 text-xs text-ink-soft">Worked out with the Mifflin-St Jeor equation. A guide, not a rule: eat to your hunger.</p>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <dt className={`text-[15px] ${strong ? "font-semibold text-ink" : "text-ink"}`}>{label}</dt>
        <dd className={`tabular ${strong ? "font-display text-[1.4rem] text-primary-ink" : "font-semibold text-ink"}`}>{value}</dd>
      </div>
      {note && <p className="text-xs text-ink-soft">{note}</p>}
    </div>
  );
}

function AboutForm({ profile, hideWeight }: { profile: Profile; hideWeight: boolean }) {
  const imperial = profile.units === "imperial";
  const ft = profile.heightCm ? cmToFtIn(profile.heightCm) : null;
  const [v, setV] = useState({
    age: profile.age?.toString() ?? "",
    cm: profile.heightCm ? Math.round(profile.heightCm).toString() : "",
    ft: ft?.ft.toString() ?? "",
    inch: ft?.inch.toString() ?? "",
    kg: profile.weightKg ? (Math.round(profile.weightKg * 10) / 10).toString() : "",
    lb: profile.weightKg ? Math.round(kgToLb(profile.weightKg)).toString() : "",
  });
  const [saved, setSaved] = useState(false);

  function save(patch: Partial<Profile>) {
    activeProfileStore().getState().updateProfile(patch);
    setSaved(true);
  }

  function saveNumbers() {
    const age = Number(v.age);
    const heightCm = imperial ? ftInToCm(Number(v.ft) || 0, Number(v.inch) || 0) : Number(v.cm);
    const weightKg = imperial ? lbToKg(Number(v.lb)) : Number(v.kg.replace(",", "."));
    const patch: Partial<Profile> = {};
    if (age >= 10 && age <= 100) patch.age = Math.round(age);
    if (heightCm >= 120 && heightCm <= 220) patch.heightCm = Math.round(heightCm * 10) / 10;
    if (!hideWeight && weightKg >= 30 && weightKg <= 250) patch.weightKg = Math.round(weightKg * 10) / 10;
    save(patch);
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveNumbers();
      }}
      onChange={() => setSaved(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="label">ABOUT YOU</p>
        <div className="flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold" role="group" aria-label="Units">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={profile.units === u}
              onClick={() => save({ units: u })}
              className={`h-7 rounded-full px-3 ${profile.units === u ? "bg-ink text-surface" : "text-ink"}`}
            >
              {u === "metric" ? "kg · cm" : "lb · ft"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Age
          <input className="input" inputMode="numeric" value={v.age} onChange={(e) => setV({ ...v, age: e.target.value })} />
        </label>
        {imperial ? (
          <div className="flex flex-col gap-1 text-sm font-semibold text-ink">
            Height
            <div className="flex gap-2">
              <input className="input px-3" inputMode="numeric" aria-label="Feet" placeholder="ft" value={v.ft} onChange={(e) => setV({ ...v, ft: e.target.value })} />
              <input className="input px-3" inputMode="numeric" aria-label="Inches" placeholder="in" value={v.inch} onChange={(e) => setV({ ...v, inch: e.target.value })} />
            </div>
          </div>
        ) : (
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
            Height (cm)
            <input className="input" inputMode="decimal" value={v.cm} onChange={(e) => setV({ ...v, cm: e.target.value })} />
          </label>
        )}
        {!hideWeight && (
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
            Weight ({imperial ? "lb" : "kg"})
            <input
              className="input"
              inputMode="decimal"
              value={imperial ? v.lb : v.kg}
              onChange={(e) => setV(imperial ? { ...v, lb: e.target.value } : { ...v, kg: e.target.value })}
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Activity
          <select className="input" value={profile.activity ?? "light"} onChange={(e) => save({ activity: e.target.value as Activity })}>
            {Object.entries(ACTIVITY_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Goal
          <select className="input" value={profile.goal ?? "feel-better"} onChange={(e) => save({ goal: e.target.value as Goal })}>
            {GOALS.filter((g) => !hideWeight || (g.id !== "lose" && g.id !== "gain")).map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Food
          <select className="input" value={profile.diet ?? "vegetarian"} onChange={(e) => save({ diet: e.target.value as DietType })}>
            {DIETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        {saved && (
          <span className="text-sm font-semibold text-accent-ink" role="status">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
