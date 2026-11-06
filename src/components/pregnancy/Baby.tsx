"use client";

import { useEffect, useState } from "react";
import { Footprints, Phone, RotateCcw, Smile, Timer, TriangleAlert } from "lucide-react";
import { todayISO } from "@/lib/dates";
import { helpFor, telLink } from "@/lib/helplines";
import { summariseContractions } from "@/lib/pregnancy";
import { PREG_SYMPTOMS } from "@/lib/pregnancyContent";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import { newId, timeLabel, updateData } from "./data";
import { AlertBox, CardHead } from "./ui";

/** A clock that ticks every second while `on` is true. */
function useNow(on: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [on]);
  return now;
}

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ---------------- Kick counter ---------------- */

const KICK_GOAL = 10;
const KICK_LIMIT_MS = 2 * 60 * 60_000;

export function KickCounter({ week }: { week: number }) {
  const sessions = useProfileStore((s) => s.kicks) ?? [];
  const country = useProfileStore((s) => s.profile?.country);
  const [start, setStart] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const now = useNow(start !== null);
  const elapsed = start ? now - start : 0;
  const overdue = start !== null && elapsed >= KICK_LIMIT_MS && count < KICK_GOAL;
  const recent = [...sessions].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 5);

  function finish(final: number) {
    if (start === null) return;
    const end = Date.now();
    if (final > 0) {
      updateData((s) => ({
        kicks: [...(s.kicks ?? []), { id: newId(), start: new Date(start).toISOString(), end: new Date(end).toISOString(), count: final }],
      }));
    }
    setStart(null);
    setCount(0);
  }

  function tap() {
    if (start === null) {
      setStart(Date.now());
      setCount(1);
      return;
    }
    const next = count + 1;
    setCount(next);
    if (next >= KICK_GOAL) finish(next);
  }

  const help = helpFor(country);

  return (
    <section className="card">
      <CardHead icon={Footprints} title="Kick counter" right={week < 28 ? "Daily from week 28" : "Once a day"} />
      <p className="text-[15px] text-ink-soft">
        When baby is usually active, lie on your left side and count every kick, roll or flutter until you reach 10.
      </p>
      <div className="mt-5 flex flex-col items-center">
        <button
          type="button"
          onClick={tap}
          className="grid h-36 w-36 place-items-center rounded-full bg-primary text-on-primary shadow-[var(--shadow-soft)] transition-transform active:scale-95"
          aria-label={start === null ? "Start counting kicks" : `Count a kick, ${count} so far`}
        >
          <span className="text-center">
            <span className="block font-display text-[3rem] leading-none tabular">{start === null ? "0" : count}</span>
            <span className="mt-1 block text-xs font-semibold">{start === null ? "Tap to start" : "Tap each kick"}</span>
          </span>
        </button>
        <p className="mt-3 text-sm text-ink-soft tabular" aria-live="polite">
          {start === null ? `Goal: ${KICK_GOAL} movements` : `${count} of ${KICK_GOAL} · ${mmss(elapsed)}`}
        </p>
        {start !== null && (
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => finish(count)}>
              Stop and save
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStart(null); setCount(0); }}>
              <RotateCcw size={14} aria-hidden /> Reset
            </button>
          </div>
        )}
      </div>
      {overdue && (
        <div className="mt-4">
          <AlertBox tone="danger" icon={TriangleAlert} title="Fewer than 10 movements in 2 hours">
            Call your hospital or maternity unit now. Don&apos;t wait until tomorrow.{" "}
            <a href={telLink(help.emergency.number)} className="font-semibold underline">
              Call {help.emergency.number}
            </a>
          </AlertBox>
        </div>
      )}
      {recent.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {recent.map((k) => {
            const mins = Math.max(1, Math.round((new Date(k.end).getTime() - new Date(k.start).getTime()) / 60_000));
            return (
              <li key={k.id} className="flex items-center justify-between gap-3 py-2 text-[15px]">
                <span className="text-ink-soft">{timeLabel(k.start)}</span>
                <span className="font-semibold text-ink tabular">
                  {k.count} in {mins} min
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-sm text-ink-soft">
        If baby is moving less than usual, or the pattern changes, call your doctor the same day. Don&apos;t use a home heartbeat monitor to check.
      </p>
    </section>
  );
}

/* ---------------- How are you feeling today? ---------------- */

export function PregSymptoms() {
  const today = todayISO();
  const picked = useProfileStore((s) => s.dayLogs[today]?.symptoms) ?? [];
  const chosen = PREG_SYMPTOMS.filter((s) => picked.includes(s.id));

  function toggle(id: string) {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    activeProfileStore().getState().logDay(today, { symptoms: next });
  }

  return (
    <section className="card">
      <CardHead icon={Smile} title="How are you feeling today?" />
      <div className="flex flex-wrap gap-2">
        {PREG_SYMPTOMS.map((s) => (
          <button key={s.id} type="button" className="chip" aria-pressed={picked.includes(s.id)} onClick={() => toggle(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {chosen.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {chosen.map((s) =>
            s.urgent ? (
              <li key={s.id}>
                <AlertBox tone="danger" icon={TriangleAlert} title={s.label}>
                  {s.tip}
                </AlertBox>
              </li>
            ) : (
              <li key={s.id} className="rounded-2xl bg-surface-2 p-3.5 text-[15px] text-ink">
                <span className="font-semibold">{s.label}: </span>
                {s.tip}
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">Tap anything you feel today and Saheli shows what helps.</p>
      )}
    </section>
  );
}

/* ---------------- Contraction timer ---------------- */

export function ContractionTimer({ week }: { week: number }) {
  const list = useProfileStore((s) => s.contractions) ?? [];
  const country = useProfileStore((s) => s.profile?.country);
  const active = list.find((c) => c.end === undefined);
  const now = useNow(list.length > 0);
  const summary = summariseContractions(list, now);
  const preterm = week < 37;
  const help = helpFor(country);
  const recent = [...list].sort((a, b) => b.start - a.start).slice(0, 8);

  if (week < 28) {
    return (
      <section className="card">
        <CardHead icon={Timer} title="Contraction timer" />
        <p className="text-[15px] text-ink-soft">
          The contraction timer opens at week 28. Before then, any regular tightenings, pain or bleeding: call your doctor straight away.
        </p>
      </section>
    );
  }

  function press() {
    const t = Date.now();
    if (active) {
      updateData((s) => ({ contractions: (s.contractions ?? []).map((c) => (c.end === undefined ? { ...c, end: t } : c)) }));
    } else {
      // keep the last 12 hours only
      updateData((s) => ({ contractions: [...(s.contractions ?? []).filter((c) => c.start > t - 12 * 3_600_000), { start: t }] }));
    }
  }

  return (
    <section className="card">
      <CardHead
        icon={Timer}
        title="Contraction timer"
        right={
          list.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateData(() => ({ contractions: [] }))}>
              Clear
            </button>
          )
        }
      />
      <div className="grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={press}
            className={`grid h-36 w-36 place-items-center rounded-full text-center shadow-[var(--shadow-soft)] transition-transform active:scale-95 ${
              active ? "bg-ink text-bg" : "bg-primary text-on-primary"
            }`}
          >
            <span>
              <span className="block font-display text-[2.2rem] leading-none tabular">{active ? mmss(now - active.start) : "Start"}</span>
              <span className="mt-1.5 block text-xs font-semibold">{active ? "Tap when it ends" : "Tap when it starts"}</span>
            </span>
          </button>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Last hour", `${summary.count}`],
              ["Lasting", summary.avgDurationSec ? `${Math.round(summary.avgDurationSec)} s` : "–"],
              ["Apart", summary.avgIntervalMin ? `${summary.avgIntervalMin.toFixed(1)} min` : "–"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface-2 p-3 text-center">
                <p className="font-display text-[1.5rem] leading-none text-ink tabular">{v}</p>
                <p className="mt-1 text-xs text-ink-soft">{k}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            The 5-1-1 rule: contractions every 5 minutes, each lasting about 1 minute, for 1 hour. Then it&apos;s time to call your hospital and get ready to go.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {preterm && summary.regular && (
          <AlertBox tone="danger" icon={TriangleAlert} title="Call your doctor or hospital straight away">
            Regular contractions before 37 weeks can be early labour. Call now, don&apos;t wait for the 5-1-1 rule.{" "}
            <a href={telLink(help.emergency.number)} className="font-semibold underline">
              Call {help.emergency.number}
            </a>
          </AlertBox>
        )}
        {!preterm && summary.rule511 && (
          <AlertBox tone="danger" icon={Phone} title="It's time to call your hospital">
            Your contractions match the 5-1-1 rule. Call your hospital or midwife and get ready to go.
          </AlertBox>
        )}
        {preterm && !summary.regular && (
          <p className="text-sm text-ink-soft">
            You&apos;re {week} weeks. Practice tightenings come and go. If they become regular, painful or you have any bleeding or fluid, call your doctor straight away.
          </p>
        )}
        <p className="text-sm text-ink-soft">Waters breaking, bleeding, or baby moving less: call straight away, whatever the timer says.</p>
      </div>

      {recent.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line text-[15px]">
          {recent.map((c, i) => {
            const prev = recent[i + 1];
            return (
              <li key={c.start} className="flex justify-between gap-3 py-2">
                <span className="text-ink-soft tabular">
                  {new Date(c.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="text-ink tabular">
                  {c.end ? `${Math.round((c.end - c.start) / 1000)} s` : "now"}
                  {prev ? ` · ${((c.start - prev.start) / 60_000).toFixed(1)} min apart` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
