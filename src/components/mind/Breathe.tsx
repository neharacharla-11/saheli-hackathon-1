"use client";

import { useEffect, useRef, useState } from "react";
import { Wind } from "lucide-react";
import { BREATH_PATTERNS, breathAt, type BreathPattern } from "@/lib/mind";
import { CardHead } from "@/components/pregnancy/ui";

const LENGTHS = [1, 3, 5];

export function BreatheCard() {
  const [pattern, setPattern] = useState<BreathPattern>(BREATH_PATTERNS[0]);
  const [minutes, setMinutes] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const total = minutes * 60;
    const tick = (t: number) => {
      if (!startRef.current) startRef.current = t;
      const e = (t - startRef.current) / 1000;
      if (e >= total) {
        setElapsed(0);
        setRunning(false);
        setDone(true);
        return;
      }
      setElapsed(e);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, minutes]);

  const state = running ? breathAt(pattern, elapsed) : null;
  const scale = state ? state.scale : 0.35;
  const inner = 96 + scale * 128; // 96px to 224px inside a 240px circle
  const left = Math.max(0, minutes * 60 - elapsed);

  function start() {
    startRef.current = 0;
    setElapsed(0);
    setDone(false);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setElapsed(0);
  }

  return (
    <section className="card">
      <CardHead icon={Wind} title="Breathe" />
      <div className="fade-x -mx-1 flex gap-2 px-1 pb-1" role="tablist" aria-label="Breathing pattern">
        {BREATH_PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pattern.id === p.id}
            data-selected={pattern.id === p.id}
            className="chip shrink-0"
            disabled={running}
            onClick={() => setPattern(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">{pattern.line}</p>

      <div className="my-6 flex justify-center">
        <div
          className="relative grid h-[240px] w-[240px] place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)" }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: inner,
              height: inner,
              background: "color-mix(in srgb, var(--primary) 22%, var(--surface))",
              transition: running ? "none" : "width 0.6s ease, height 0.6s ease",
            }}
            aria-hidden
          />
          <div className="relative text-center" aria-live="polite">
            <p className="font-display text-[1.6rem] leading-tight text-ink">{state ? state.label : done ? "Well done" : "Ready"}</p>
            {state && <p className="mt-0.5 text-sm text-ink-soft tabular">{state.secondsLeft}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Minutes">
          {LENGTHS.map((m) => (
            <button key={m} type="button" className="chip chip-sm tabular" aria-pressed={minutes === m} disabled={running} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
        {running ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft tabular">
              {Math.floor(left / 60)}:{String(Math.floor(left % 60)).padStart(2, "0")}
            </span>
            <button type="button" className="btn btn-secondary" onClick={stop}>
              Stop
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start}>
            Start
          </button>
        )}
      </div>
      {done && !running && <p className="mt-3 text-sm text-ink-soft">Notice how your shoulders feel now. Come back any time.</p>}
    </section>
  );
}
