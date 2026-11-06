"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronLeft, ChevronRight, Flame, Pause, Play, SkipForward, X } from "lucide-react";
import { MoveFigure } from "./MoveFigure";
import { logWorkout } from "@/lib/dailyCareActions";
import { todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";
import { doseLabel, guidedSteps, workoutsThisWeek, type GuidedStep, type Session } from "@/lib/workoutLibrary";
import type { ProfileData } from "@/lib/types";

/** Full-screen guided workout: one exercise at a time, timers, rests, and a done screen. */
export function GuidedWorkout({ session, onClose }: { session: Session; onClose: () => void }) {
  const steps = useMemo(() => guidedSteps(session), [session]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const logged = useRef(false);
  const finished = index >= steps.length;

  function next() {
    const n = Math.min(steps.length, index + 1);
    if (n === steps.length && !logged.current) {
      logged.current = true;
      logWorkout({
        date: todayISO(),
        at: new Date().toISOString(),
        minutes: session.minutes,
        title: session.title,
        mode: session.mode,
        place: session.place,
      });
    }
    setIndex(n);
    setPaused(false);
  }
  function back() {
    setIndex((i) => Math.max(0, i - 1));
    setPaused(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={`Guided workout: ${session.title}`}>
      {/* Top bar with progress */}
      <div className="border-b border-line bg-surface px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-semibold text-ink">{session.title}</p>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm shrink-0" aria-label="End workout">
            <X size={18} /> End
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-[640px]">
          <div
            className="h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={Math.min(index, steps.length)}
            aria-label="Workout progress"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(Math.min(index, steps.length) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[640px]">
          {finished ? (
            <DoneScreen session={session} onClose={onClose} />
          ) : (
            <StepView key={index} step={steps[index]} index={index} total={steps.length} paused={paused} onNext={next} />
          )}
        </div>
      </div>

      {!finished && (
        <div className="border-t border-line bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
            <button type="button" onClick={back} disabled={index === 0} className="btn btn-secondary">
              <ChevronLeft size={18} /> Back
            </button>
            {steps[index].seconds ? (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="grid h-14 w-14 place-items-center rounded-full bg-ink text-bg"
                aria-label={paused ? "Resume" : "Pause"}
              >
                {paused ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}
              </button>
            ) : (
              <span className="h-14 w-14" />
            )}
            <button type="button" onClick={next} className="btn btn-primary">
              {steps[index].kind === "rest" ? (
                <>
                  Skip rest <SkipForward size={17} />
                </>
              ) : (
                <>
                  {index === steps.length - 1 ? "Finish" : "Next"} <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function StepView({
  step,
  index,
  total,
  paused,
  onNext,
}: {
  step: GuidedStep;
  index: number;
  total: number;
  paused: boolean;
  onNext: () => void;
}) {
  const [left, setLeft] = useState(step.seconds ?? 0);
  const [count, setCount] = useState(0);
  const leftRef = useRef(step.seconds ?? 0);
  const nextRef = useRef(onNext);
  useEffect(() => {
    nextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    if (paused || !step.seconds) return;
    const t = setInterval(() => {
      leftRef.current -= 1;
      setLeft(Math.max(0, leftRef.current));
      if (leftRef.current <= 0) {
        clearInterval(t);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(150);
        nextRef.current();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [paused, step.seconds]);

  const m = step.move;
  const where = `${step.section}${step.round ? ` · round ${step.round} of ${step.rounds}` : ""}`;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");

  if (step.kind === "rest") {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="label">Rest · step {index + 1} of {total}</p>
        <p className="font-display mt-2 text-[1.9rem] leading-tight text-ink sm:text-[2.2rem]">Breathe and shake it out</p>
        <Ring value={left} max={step.seconds ?? 1} label={`${mm}:${ss}`} paused={paused} />
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left">
          <MoveFigure icon={m.icon} size={52} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Up next</p>
            <p className="font-semibold text-ink">{m.name}</p>
            <p className="tabular text-sm text-primary-ink">{doseLabel(m)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="label">
        {where} · step {index + 1} of {total}
      </p>
      <h2 className="font-display mt-2 text-[2.1rem] leading-tight text-ink sm:text-[2.4rem]">{m.name}</h2>
      <MoveFigure icon={m.icon} size={150} className="mt-4" />
      {step.seconds ? (
        <>
          <Ring value={left} max={step.seconds} label={`${mm}:${ss}`} paused={paused} />
          {m.perSide && <p className="mt-2 text-sm text-ink-soft">Switch sides halfway.</p>}
        </>
      ) : (
        <div className="mt-5 flex flex-col items-center">
          <p className="font-display tabular text-[3.2rem] leading-none text-ink">
            {step.reps}
            <span className="ml-2 font-sans text-xl text-ink-soft">reps{m.perSide ? " each side" : ""}</span>
          </p>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="mt-4 grid h-20 w-20 place-items-center rounded-full border-2 border-primary/50 bg-surface text-primary-ink transition active:scale-95"
            aria-label={`Count a rep. ${count} done`}
          >
            <span className="font-display tabular text-[2rem] leading-none">{count}</span>
          </button>
          <p className="mt-1.5 text-xs text-ink-soft">Tap to count, or just tap Next when you&apos;re done</p>
        </div>
      )}
      <p className="mt-5 max-w-md text-[15px] text-ink">{m.how}</p>
      <div className="mt-4 grid w-full max-w-md gap-2 text-left text-[13px] sm:grid-cols-2">
        <p className="flex gap-1.5 rounded-xl bg-surface-2 p-2.5 text-ink">
          <ArrowDown size={14} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
          <span>
            <span className="font-semibold">Easier:</span> {m.easier}
          </span>
        </p>
        <p className="flex gap-1.5 rounded-xl bg-surface-2 p-2.5 text-ink">
          <ArrowUp size={14} className="mt-0.5 shrink-0 text-primary-ink" aria-hidden="true" />
          <span>
            <span className="font-semibold">Harder:</span> {m.harder}
          </span>
        </p>
      </div>
    </div>
  );
}

function Ring({ value, max, label, paused }: { value: number; max: number; label: string; paused: boolean }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const frac = max ? value / max : 0;
  return (
    <div className="relative mt-5 h-[140px] w-[140px]" role="timer" aria-live="off" aria-label={`${label} left`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display tabular text-[2.4rem] leading-none text-ink">{label}</span>
        {paused && <span className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">Paused</span>}
      </div>
    </div>
  );
}

function DoneScreen({ session, onClose }: { session: Session; onClose: () => void }) {
  const done = useProfileStore((s) => (s as ProfileData).workoutsDone);
  const week = workoutsThisWeek(done, todayISO());
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <CheckCircle2 size={64} className="text-accent-ink" aria-hidden="true" />
      <h2 className="font-display mt-4 text-[2.4rem] leading-tight text-ink">Workout done</h2>
      <p className="mt-2 max-w-sm text-ink-soft">
        {session.title}, {session.minutes} minutes. Your body will thank you for this.
      </p>
      <div className="mt-6 grid w-full max-w-sm gap-3">
        <p className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left">
          <CheckCircle2 size={22} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="text-ink">
            <span className="font-semibold">20 minutes of movement</span> is ticked on your checklist
          </span>
        </p>
        <p className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left">
          <Flame size={22} className="shrink-0 text-primary-ink" aria-hidden="true" />
          <span className="text-ink">
            This week: <span className="tabular font-semibold">{week}</span> workout{week === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      <p className="mt-5 text-sm text-ink-soft">Drink a glass of water and stretch a little more if you like.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onClose} className="btn btn-primary">
          Back to Move
        </button>
        <Link href="/app" onClick={onClose} className="btn btn-secondary">
          Go to Today
        </Link>
      </div>
    </div>
  );
}
