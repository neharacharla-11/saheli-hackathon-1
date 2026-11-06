"use client";

import { useId, useState, type FormEvent } from "react";
import { Pill, Trash2 } from "lucide-react";
import { ProgressBar, TickRow, WaterTracker } from "./parts";
import { useChecklist } from "./useChecklist";
import { formatTime, WHEN_OPTIONS, WHEN_TIME } from "@/lib/dailyCare";
import { addCustomSupplement, removeCustomSupplement } from "@/lib/dailyCareActions";
import { todayISO } from "@/lib/dates";

/** The Checklist tab: today's ticks, water, and her own medicines. */
export function ChecklistView() {
  const today = todayISO();
  const { items, ticked, done, total, glasses, custom } = useChecklist(today);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[56fr_44fr]">
      <section className="card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.45rem] text-ink">Today</h2>
          <p className="tabular text-sm text-ink-soft">
            {done} of {total} done
          </p>
        </div>
        <div className="mt-3">
          <ProgressBar value={total ? done / total : 0} label="Checklist done today" />
        </div>
        <ul className="mt-2">
          {items.map((it) => (
            <TickRow key={it.id} item={it} date={today} on={ticked.has(it.id)} big />
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Supplements are listed so you can tick what your doctor advised. Saheli explains, it doesn&apos;t prescribe. Food
          first: many of these come from a good thali.
        </p>
      </section>

      <div className="space-y-5">
        <section className="card">
          <WaterTracker date={today} glasses={glasses} />
          <p className="mt-3 text-xs text-ink-soft">Tap a glass to fill up to it. Tea and coffee don&apos;t count.</p>
        </section>
        <AddOwn />
        {custom.length > 0 && (
          <section className="card">
            <h2 className="font-semibold text-ink">Your medicines</h2>
            <ul className="mt-2">
              {custom.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0">
                  <Pill size={18} className="shrink-0 text-primary-ink" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {c.name}
                      {c.dose ? ` (${c.dose})` : ""}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {c.when}
                      {c.time ? ` · ${formatTime(c.time)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomSupplement(c.id)}
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function AddOwn() {
  const id = useId();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [when, setWhen] = useState(WHEN_OPTIONS[0]);
  const [time, setTime] = useState(WHEN_TIME[WHEN_OPTIONS[0]]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMsg({ ok: false, text: "Add the name of the medicine or supplement." });
      return;
    }
    addCustomSupplement({ name: name.trim(), dose: dose.trim() || undefined, when, time });
    setMsg({ ok: true, text: `${name.trim()} is on your checklist.` });
    setName("");
    setDose("");
  }

  return (
    <section className="card">
      <h2 className="font-semibold text-ink">Add your own</h2>
      <p className="mt-0.5 text-sm text-ink-soft">A medicine or supplement your doctor gave you.</p>
      <form onSubmit={add} className="mt-4 space-y-3" noValidate>
        <div>
          <label htmlFor={`${id}-n`} className="mb-1 block text-sm font-semibold text-ink">
            Name
          </label>
          <input
            id={`${id}-n`}
            className="input"
            placeholder="e.g. Thyroid tablet"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${id}-d`} className="mb-1 block text-sm font-semibold text-ink">
              Dose
            </label>
            <input
              id={`${id}-d`}
              className="input"
              placeholder="e.g. 50 mcg"
              value={dose}
              maxLength={20}
              onChange={(e) => setDose(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${id}-t`} className="mb-1 block text-sm font-semibold text-ink">
              Time
            </label>
            <input id={`${id}-t`} type="time" className="input tabular" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-w`} className="mb-1 block text-sm font-semibold text-ink">
            When
          </label>
          <select
            id={`${id}-w`}
            className="input"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
              setTime(WHEN_TIME[e.target.value] ?? time);
            }}
          >
            {WHEN_OPTIONS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Add to checklist
        </button>
        {msg && (
          <p className={`text-sm ${msg.ok ? "text-accent-ink" : "text-danger"}`} role="status">
            {msg.text}
          </p>
        )}
      </form>
    </section>
  );
}
