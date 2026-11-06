"use client";

import { Trash2, UtensilsCrossed } from "lucide-react";
import { addTotals } from "@/lib/foods";
import { MEALS, removeFoodEntry, useFoodToday, useMyDay } from "@/lib/myDay";
import { CardTitle, fmt } from "./bits";

export function TodaysMeals() {
  const { today, coachReason } = useMyDay();
  const entries = useFoodToday();
  const showNumbers = coachReason !== "eating";

  return (
    <section className="card" aria-labelledby="todays-meals">
      <CardTitle icon={UtensilsCrossed} title={<span id="todays-meals">Today&apos;s meals</span>} />
      <div className="grid gap-4 sm:grid-cols-2">
        {MEALS.map((m) => {
          const list = entries.filter((e) => e.meal === m.id);
          const total = addTotals(list).kcal;
          return (
            <div key={m.id} className="rounded-2xl border border-line p-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-ink">{m.label}</h3>
                {showNumbers && list.length > 0 && <span className="text-sm font-semibold text-ink-soft tabular">{fmt(total)} kcal</span>}
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-ink-soft">Nothing yet. Build your thali above to add {m.label.toLowerCase()}.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {list.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">{e.name}</span>
                        <span className="block truncate text-xs text-ink-soft tabular">
                          {e.qty} x {e.portion}
                          {showNumbers && ` · ${fmt(e.kcal)} kcal`}
                        </span>
                      </span>
                      <button
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                        onClick={() => removeFoodEntry(today, e.id)}
                        aria-label={`Remove ${e.name} from ${m.label}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
