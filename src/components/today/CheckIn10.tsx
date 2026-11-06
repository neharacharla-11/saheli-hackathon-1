"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Timer } from "lucide-react";
import { FACE_MOODS, MoodFace, type FaceMood } from "./MoodFace";
import { checkinStreak } from "@/lib/dailyCare";
import { quickCheckIn, toggleSymptom } from "@/lib/dailyCareActions";
import { useProfileStore } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import type { Mood } from "@/lib/types";

const BODY = ["Cramps", "Bloating", "Headache", "Fatigue", "Cravings"];

/** Moods from the full check-in on Mind, shown with the nearest face. */
const NEAREST: Record<Mood, FaceMood> = {
  great: "great",
  energetic: "great",
  good: "good",
  calm: "good",
  okay: "okay",
  low: "low",
  anxious: "stressed",
  irritable: "stressed",
  overwhelmed: "stressed",
  stressed: "stressed",
};

const MOOD_WORD: Record<Mood, string> = {
  great: "great",
  energetic: "energetic",
  good: "good",
  calm: "calm",
  okay: "okay",
  low: "low",
  anxious: "anxious",
  irritable: "irritable",
  overwhelmed: "overwhelmed",
  stressed: "stressed",
};

/** Timing for "checked in in 6 seconds". Only called from tap handlers. */
function startTimer(ref: { current: number | null }) {
  if (ref.current === null) ref.current = Date.now();
}
function secondsSince(ref: { current: number | null }): number | undefined {
  return ref.current === null ? undefined : Math.max(1, Math.round((Date.now() - ref.current) / 1000));
}

/** The 10-second check-in: mood, energy and (optional) body, in 3 taps. */
export function CheckIn10() {
  const today = todayISO();
  const log = useProfileStore((s) => s.dayLogs[today]);
  const quick = useProfileStore((s) => s.quickCheckins);
  const seconds = useProfileStore((s) => s.checkinSeconds?.[today]);
  const done = !!quick[today];
  const streak = checkinStreak(quick, today);
  const [editing, setEditing] = useState(false);
  const startedAt = useRef<number | null>(null);

  const start = () => startTimer(startedAt);
  const elapsed = () => secondsSince(startedAt);
  function pickMood(m: FaceMood) {
    start();
    quickCheckIn({ mood: m }, elapsed());
  }
  function pickEnergy(n: number) {
    start();
    quickCheckIn({ energy: n }, elapsed());
  }

  if (done && !editing && log?.mood) {
    const secs = seconds ?? 6;
    return (
      <section className="flex items-center gap-3 rounded-[20px] border-2 border-primary/40 bg-surface px-4 py-3 sm:px-5" aria-label="10-second check-in">
        <MoodFace mood={NEAREST[log.mood]} picked size={32} />
        <p className="min-w-0 flex-1 text-[15px] leading-snug">
          <span className="font-semibold text-ink">Checked in, feeling {MOOD_WORD[log.mood]}</span>
          <span className="text-ink-soft">
            {" "}
            in <span className="tabular">{secs}</span> second{secs === 1 ? "" : "s"} · <span className="tabular">{streak}</span>{" "}
            {streak === 1 ? "day" : "days in a row"}
          </span>
        </p>
        <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost btn-sm shrink-0 text-primary-ink">
          Edit
        </button>
      </section>
    );
  }

  const symptoms = new Set(log?.symptoms ?? []);
  const face = log?.mood ? NEAREST[log.mood] : undefined;

  return (
    <section className="rounded-[20px] border-2 border-primary/40 bg-surface p-5 sm:p-6" aria-labelledby="checkin-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="checkin-title" className="font-semibold text-ink">
          10-second check-in
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Timer size={15} aria-hidden="true" />
          <span className="tabular">{`3 taps · ${streak}-day streak`}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.25fr_1fr_1fr] lg:gap-6">
        <fieldset>
          <legend className="mb-2 text-xs text-ink-soft">1. Mood</legend>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Mood">
            {FACE_MOODS.map((m) => {
              const on = face === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickMood(m.id)}
                  className={`flex h-[60px] flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors ${
                    on ? "border-primary bg-primary" : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  {/* On the filled pink tile the face keeps its light tint so it stays visible. */}
                  <MoodFace mood={m.id} picked={false} size={28} />
                  <span className={`text-[11px] leading-none ${on ? "font-semibold text-on-primary" : "text-ink-soft"}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs text-ink-soft">2. Energy</legend>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Energy from 1, low, to 5, high">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = log?.energy !== undefined && n <= log.energy;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={log?.energy === n}
                  aria-label={`Energy ${n}${n === 1 ? ", low" : n === 5 ? ", high" : ""}`}
                  onClick={() => pickEnergy(n)}
                  className={`flex h-[60px] flex-col items-center justify-center gap-0.5 rounded-2xl border text-base font-semibold transition-colors ${
                    filled ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-ink hover:bg-surface-2"
                  }`}
                >
                  <span className="tabular leading-none">{n}</span>
                  <span className={`h-3 text-[10px] font-medium leading-none ${filled ? "text-on-primary/85" : "text-ink-soft"}`}>
                    {n === 1 ? "Low" : n === 5 ? "High" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-xs text-ink-soft">3. Body (optional)</legend>
          <div className="flex flex-wrap gap-1.5">
            {BODY.map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={symptoms.has(b)}
                onClick={() => {
                  start();
                  toggleSymptom(b, today);
                }}
                className="chip"
              >
                {b}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/app/mind" className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
          More feelings, stress and your mood trends on Mind
        </Link>
        {editing && (
          <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary btn-sm">
            Done
          </button>
        )}
      </div>
    </section>
  );
}
