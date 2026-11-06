"use client";

import { Check, GlassWater, Minus, Plus } from "lucide-react";
import { WATER_GOAL, type ChecklistItem } from "@/lib/dailyCare";
import { setWater, toggleChecklist } from "@/lib/dailyCareActions";

/** Minus, 8 glass tiles you can tap, plus. */
export function WaterTracker({ date, glasses, compact = false }: { date: string; glasses: number; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <GlassWater size={18} className="text-accent-ink" aria-hidden="true" /> Water
        </p>
        <p className="text-sm text-ink-soft" aria-live="polite">
          <span className="tabular">{glasses}</span> of <span className="tabular">{WATER_GOAL}</span> glasses
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setWater(date, glasses - 1)}
          disabled={glasses <= 0}
          aria-label="One glass less"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink hover:bg-surface-2"
        >
          <Minus size={16} />
        </button>
        <div className="grid flex-1 grid-cols-8 gap-1.5">
          {Array.from({ length: WATER_GOAL }, (_, i) => {
            const full = i < glasses;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setWater(date, full && i === glasses - 1 ? i : i + 1)}
                aria-label={`${i + 1} glass${i ? "es" : ""}`}
                aria-pressed={full}
                className={`${compact ? "h-9" : "h-11"} rounded-lg border transition-colors ${
                  full ? "border-accent bg-accent" : "border-line bg-surface-2 hover:bg-line"
                }`}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setWater(date, glasses + 1)}
          aria-label="One more glass"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary hover:brightness-105"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/** A round tick button with the item name. Water ticks itself. */
export function TickRow({
  item,
  date,
  on,
  big = false,
}: {
  item: ChecklistItem;
  date: string;
  on: boolean;
  big?: boolean;
}) {
  const auto = item.id === "water";
  return (
    <li className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        aria-label={item.name}
        disabled={auto}
        onClick={() => toggleChecklist(date, item.id)}
        className={`grid shrink-0 place-items-center rounded-full border-2 transition-colors disabled:opacity-100 ${
          big ? "h-10 w-10" : "h-6 w-6"
        } ${on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface hover:border-primary/60"}`}
      >
        {on && <Check size={big ? 20 : 14} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 leading-snug ${on ? "text-ink-soft" : "text-ink"} ${big ? "font-semibold" : "text-[15px]"}`}>
          <span>{item.name}</span>
          {item.when && !big && <span className="text-sm text-ink-soft">· {item.when}</span>}
          {item.focus && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-primary-ink">Focus now</span>
          )}
        </p>
        {big && (
          <p className="text-sm text-ink-soft">
            {item.when ? `${item.when} · ` : ""}
            {item.line}
          </p>
        )}
      </div>
    </li>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
