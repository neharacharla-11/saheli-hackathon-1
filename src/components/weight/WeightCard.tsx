"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Scale as ScaleIcon } from "lucide-react";
import { Scale } from "./Scale";
import {
  canShowWeight,
  fromDisplayWeight,
  toDisplayWeight,
  validWeightKg,
  weightSummary,
  weightUnit,
} from "@/lib/dailyCare";
import { saveWeight } from "@/lib/dailyCareActions";
import { formatShort, todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";

/** "Today's weight" on Today. Hidden by the safety rules. */
export function WeightCard() {
  const profile = useProfileStore((s) => s.profile);
  const weights = useProfileStore((s) => s.weights);
  const today = todayISO();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const id = useId();
  if (!profile || !canShowWeight(profile)) return null;

  const unit = weightUnit(profile.units);
  const sum = weightSummary(weights, today);
  const typed = parseFloat(text.replace(",", "."));
  const shown = text && Number.isFinite(typed) ? typed : sum.last ? toDisplayWeight(sum.last.kg, profile.units) : null;

  function save(e: FormEvent) {
    e.preventDefault();
    const kg = fromDisplayWeight(typed, profile!.units);
    if (!validWeightKg(kg)) {
      setError(unit === "kg" ? "Enter your weight in kg, like 62.5." : "Enter your weight in lb, like 138.");
      return;
    }
    saveWeight(today, kg);
    setText("");
    setError("");
    setSaved(true);
  }

  const change = sum.weekChange;
  const changeText =
    change === undefined
      ? null
      : change === 0
        ? "Same as a week ago"
        : `${change > 0 ? "+" : "−"}${Math.abs(toDisplayWeight(Math.abs(change), profile.units)).toFixed(1)} ${unit} since a week ago`;

  return (
    <section className="card flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <ScaleIcon size={18} className="text-primary-ink" aria-hidden="true" /> Today&apos;s weight
        </h2>
        <Link href="/app/cycle#weight" className="text-sm font-semibold text-primary-ink hover:underline">
          Weight calendar
        </Link>
      </div>

      <Scale value={shown} unit={unit} />
      <p className="sr-only" aria-live="polite">
        {shown !== null ? `${shown} ${unit}` : ""}
      </p>

      <div className="mt-4 text-sm text-ink-soft">
        {sum.last ? (
          <p>
            Last: <span className="tabular font-semibold text-ink">{toDisplayWeight(sum.last.kg, profile.units).toFixed(1)} {unit}</span> on{" "}
            {formatShort(sum.last.date)}
            {changeText && <span> · {changeText}</span>}
          </p>
        ) : (
          <p>No weigh-ins yet. Add one to start your weight calendar.</p>
        )}
      </div>

      <form onSubmit={save} className="mt-3 flex gap-2" noValidate>
        <label htmlFor={`${id}-w`} className="sr-only">
          Today&apos;s weight in {unit}
        </label>
        <input
          id={`${id}-w`}
          className="input tabular h-11 flex-1"
          inputMode="decimal"
          placeholder={unit === "kg" ? "e.g. 62.5" : "e.g. 138"}
          value={text}
          onChange={(e) => {
            setText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6));
            setSaved(false);
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={!text}>
          Save
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-accent-ink">Saved for today.</p>}
      <p className="mt-3 text-xs leading-relaxed text-ink-soft">
        Weight moves about a kilo through your cycle, mostly water before your period. Look at the trend, not one day.
      </p>
    </section>
  );
}
