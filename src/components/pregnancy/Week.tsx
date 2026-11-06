"use client";

import { useState } from "react";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Ruler, Scale, Trash2 } from "lucide-react";
import { formatShort, parseISODate } from "@/lib/dates";
import { dueFromLmp, TRIMESTER_LABEL, trimesterFor, weekStart, type PregnancyWeek } from "@/lib/pregnancy";
import { weekInfo } from "@/lib/pregnancyContent";
import { useProfileStore } from "@/lib/store";
import type { Appointment } from "@/lib/pregnancyTypes";
import { newId, setStage, updateData } from "./data";
import { CardHead, Field } from "./ui";

function longDate(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ---------------- Week card ---------------- */

export function WeekCard({ now, shown, setShown }: { now: PregnancyWeek; shown: number; setShown: (w: number) => void }) {
  const info = weekInfo(shown);
  const isNow = shown === now.week;
  const t = trimesterFor(shown);
  const dotSize = 56 + info.scale * 88;
  return (
    <section className="overflow-hidden rounded-[32px] border border-line bg-surface p-5 sm:p-8" aria-label="This week">
      <div className="flex items-center justify-between gap-3">
        <p className="label">
          Week {shown} · {TRIMESTER_LABEL[t]}
          {isNow ? " · now" : ""}
        </p>
        <div className="flex items-center gap-1">
          {!isNow && (
            <button type="button" onClick={() => setShown(now.week)} className="btn btn-ghost btn-sm">
              This week
            </button>
          )}
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface hover:bg-surface-2"
            onClick={() => setShown(Math.max(4, shown - 1))}
            disabled={shown <= 4}
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface hover:bg-surface-2"
            onClick={() => setShown(Math.min(40, shown + 1))}
            disabled={shown >= 40}
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid items-center gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="mx-auto grid h-[180px] w-[180px] place-items-center rounded-full bg-surface-2 sm:h-[200px] sm:w-[200px]" aria-hidden>
          <div
            className="grid place-items-center rounded-full transition-all duration-700"
            style={{
              width: dotSize,
              height: dotSize,
              background: "color-mix(in srgb, var(--primary) 22%, var(--surface))",
              boxShadow: "inset 0 0 0 2px color-mix(in srgb, var(--primary) 35%, transparent)",
            }}
          >
            <span className="font-display text-[2.4rem] leading-none text-primary-ink tabular">{shown}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-display text-[1.6rem] leading-snug text-ink sm:text-[1.9rem]">
            Baby is about the size of {info.size}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-ink">
              <Ruler size={15} className="text-primary-ink" aria-hidden /> {info.length}
            </span>
            {info.weight && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-ink">
                <Scale size={15} className="text-primary-ink" aria-hidden /> {info.weight}
              </span>
            )}
          </div>
          <p className="mt-4 text-[15px] text-ink">
            <span className="font-semibold">Baby: </span>
            {info.baby}
          </p>
          <p className="mt-1.5 text-[15px] text-ink">
            <span className="font-semibold">You: </span>
            {info.you}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Calendar of 40 weeks ---------------- */

export function PregnancyCalendar({
  dueDate,
  now,
  shown,
  setShown,
}: {
  dueDate: string;
  now: PregnancyWeek;
  shown: number;
  setShown: (w: number) => void;
}) {
  const appts = useProfileStore((s) => s.appointments) ?? [];
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const byWeek = new Map<number, Appointment[]>();
  for (const a of appts) {
    const w = Math.floor((parseISODate(a.date).getTime() - parseISODate(weekStart(dueDate, 0)).getTime()) / (7 * 86_400_000));
    if (w >= 1 && w <= 40) byWeek.set(w, [...(byWeek.get(w) ?? []), a]);
  }

  const plans = appts.filter((a) => a.kind === "plan").sort((a, b) => a.date.localeCompare(b.date));

  function save() {
    if (!title.trim() || !date) return;
    updateData((s) => ({ appointments: [...(s.appointments ?? []), { id: newId(), title: title.trim(), date, kind: "plan" }] }));
    setTitle("");
    setDate("");
    setAdding(false);
  }

  return (
    <section className="card">
      <CardHead
        icon={CalendarDays}
        title="Your pregnancy calendar"
        right={
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAdding((v) => !v)}>
            <CalendarPlus size={16} aria-hidden /> Add a plan
          </button>
        }
      />
      {adding && (
        <div className="mb-5 grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
          <Field label="What's the plan?">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Baby shower, hospital tour" />
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <button type="button" className="btn btn-primary" onClick={save} disabled={!title.trim() || !date}>
            Save plan
          </button>
        </div>
      )}
      <ol className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 sm:gap-2">
        {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => {
          const items = byWeek.get(w) ?? [];
          const hasScan = items.some((a) => a.kind !== "plan");
          const hasPlan = items.some((a) => a.kind === "plan");
          const current = w === now.week;
          const past = w < now.week;
          const selected = w === shown;
          const scale = weekInfo(w).scale;
          return (
            <li key={w}>
              <button
                type="button"
                onClick={() => setShown(Math.max(4, w))}
                aria-pressed={selected}
                aria-label={`Week ${w}, starts ${formatShort(weekStart(dueDate, w))}${hasScan ? ", check-up or scan" : ""}${hasPlan ? ", a plan" : ""}`}
                className={`relative flex h-[68px] w-full flex-col items-center justify-between rounded-2xl border px-1 py-1.5 transition-colors ${
                  current
                    ? "border-primary bg-primary text-on-primary"
                    : selected
                      ? "border-primary bg-surface-2"
                      : past
                        ? "border-transparent bg-surface-2/70 text-ink-soft"
                        : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="text-[11px] font-bold tabular">W{w}</span>
                <span
                  aria-hidden
                  className="rounded-full"
                  style={{
                    width: 6 + scale * 14,
                    height: 6 + scale * 14,
                    background: current ? "var(--on-primary)" : "color-mix(in srgb, var(--primary) 45%, var(--surface))",
                    opacity: current ? 0.85 : 1,
                  }}
                />
                <span className="text-[10px] leading-none tabular">{formatShort(weekStart(dueDate, w))}</span>
                {(hasScan || hasPlan) && (
                  <span className="absolute right-1.5 top-1.5 flex gap-0.5" aria-hidden>
                    {hasScan && <span className="h-1.5 w-1.5 rounded-full" style={{ background: current ? "var(--on-primary)" : "var(--accent-ink)" }} />}
                    {hasPlan && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--ph-ovulation)" }} />}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> This week</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-ink" /> Scan or check-up</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ph-ovulation" /> Your plan</span>
      </div>
      {plans.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {plans.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
              <span className="min-w-0">
                <span className="font-semibold text-ink">{p.title}</span>
                <span className="text-ink-soft"> · {formatShort(p.date)}</span>
              </span>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                aria-label={`Remove ${p.title}`}
                onClick={() => updateData((s) => ({ appointments: (s.appointments ?? []).filter((a) => a.id !== p.id) }))}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Dates ---------------- */

export function PregnancyDates({ dueDate, now }: { dueDate: string; now: PregnancyWeek }) {
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"due" | "lmp">("due");
  const [value, setValue] = useState(dueDate);

  const rows: [string, string][] = [
    ["Due date", longDate(dueDate)],
    ["First day of last period", longDate(now.lmp)],
    ["Second trimester starts", longDate(weekStart(dueDate, 14))],
    ["Third trimester starts", longDate(weekStart(dueDate, 28))],
    ["Full term from", longDate(weekStart(dueDate, 37))],
  ];

  function save() {
    if (!value) return;
    const due = mode === "due" ? value : dueFromLmp(value);
    setStage({ dueDate: due });
    setEditing(false);
  }

  return (
    <section className="card">
      <CardHead
        icon={CalendarDays}
        title="My pregnancy dates"
        right={
          !editing && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setValue(dueDate); setMode("due"); setEditing(true); }}>
              Change
            </button>
          )
        }
      />
      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={mode === "due"} onClick={() => { setMode("due"); setValue(dueDate); }}>
              I know my due date
            </button>
            <button type="button" className="chip" aria-pressed={mode === "lmp"} onClick={() => { setMode("lmp"); setValue(now.lmp); }}>
              I know my last period
            </button>
          </div>
          <Field label={mode === "due" ? "Due date" : "First day of your last period"}>
            <input className="input" type="date" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={save} disabled={!value}>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
          <p className="text-sm text-ink-soft">If your dating scan gave a different date, use the one your doctor gave you.</p>
        </div>
      ) : (
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-[15px]">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="font-semibold text-ink tabular">{v}</dd>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5 text-[15px]">
            <dt className="text-ink-soft">Days to go</dt>
            <dd className="font-semibold text-ink tabular">
              {now.daysToGo > 0 ? now.daysToGo : now.daysToGo === 0 ? "Today is the day" : `${-now.daysToGo} days past your due date`}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
