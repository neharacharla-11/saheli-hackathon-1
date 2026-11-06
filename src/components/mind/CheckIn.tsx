"use client";

import { useState } from "react";
import { HeartHandshake, Moon } from "lucide-react";
import Link from "next/link";
import { useWidth } from "./useWidth";
import { addDays, formatShort, todayISO } from "@/lib/dates";
import { activeProfileStore, useAppStore, useProfileStore } from "@/lib/store";
import type { DayLog, Mood } from "@/lib/types";
import { CardHead } from "@/components/pregnancy/ui";

const MOODS: { id: Mood; label: string }[] = [
  { id: "great", label: "Great" },
  { id: "energetic", label: "Energetic" },
  { id: "calm", label: "Calm" },
  { id: "okay", label: "Okay" },
  { id: "low", label: "Low" },
  { id: "anxious", label: "Anxious" },
  { id: "irritable", label: "Irritable" },
  { id: "overwhelmed", label: "Overwhelmed" },
];

// Moods that change the colours (see ThemeController). Okay leaves them as they are.
const ADAPTS = new Set<Mood>(["great", "energetic", "calm", "low", "anxious", "irritable", "overwhelmed", "stressed"]);

function NumberRow({
  label,
  low,
  high,
  value,
  onPick,
}: {
  label: string;
  low: string;
  high: string;
  value?: number;
  onPick: (n: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-ink-soft">{label}</legend>
      <div className="flex items-start gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <button
              type="button"
              aria-pressed={value === n}
              aria-label={`${label} ${n} of 5`}
              onClick={() => onPick(n)}
              className={`grid h-11 w-11 place-items-center rounded-full border text-[15px] font-semibold tabular transition-colors ${
                value === n ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {n}
            </button>
            <span className="h-4 text-[11px] text-ink-soft">{n === 1 ? low : n === 5 ? high : ""}</span>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckInCard() {
  const today = todayISO();
  const log = useProfileStore((s) => s.dayLogs[today]);
  const moodAdaptive = useAppStore((s) => s.moodAdaptive);
  const [note, setNote] = useState(log?.note ?? "");
  const [saved, setSaved] = useState(false);
  const logDay = (patch: Partial<DayLog>) => activeProfileStore().getState().logDay(today, patch);

  return (
    <section className="card">
      <CardHead icon={HeartHandshake} title="Today's check-in" />
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-ink-soft">How are you feeling?</legend>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.id} type="button" className="chip" aria-pressed={log?.mood === m.id} onClick={() => logDay({ mood: m.id })}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 grid gap-4">
        <NumberRow label="Energy" low="Low" high="High" value={log?.energy} onPick={(n) => logDay({ energy: n })} />
        <NumberRow label="Stress" low="Low" high="High" value={log?.stress} onPick={(n) => logDay({ stress: n })} />
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Anything on your mind? (optional)</span>
        <textarea
          className="input min-h-[84px] py-3"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="A line about your day"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            logDay({ note: note.trim() || undefined });
            setSaved(true);
          }}
          disabled={note.trim() === (log?.note ?? "")}
        >
          Save note
        </button>
        {saved && <span className="text-sm text-ink-soft">Saved</span>}
      </div>
      {moodAdaptive && log?.mood && ADAPTS.has(log.mood) && (
        <p className="mt-4 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink">Saheli has adjusted its colours for how you feel.</p>
      )}
    </section>
  );
}

/* ---------------- Sleep ---------------- */

export function SleepCard() {
  const sleep = useProfileStore((s) => s.health?.sleepMin);
  const source = useProfileStore((s) => s.health?.source);
  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const values = days.map((d) => sleep?.[d] ?? null);
  const [boxRef, boxW] = useWidth<HTMLDivElement>();
  const logged = values.filter((v): v is number => v !== null);

  if (!logged.length) {
    return (
      <section className="card">
        <CardHead icon={Moon} title="Your sleep · last 14 days" />
        <p className="text-[15px] text-ink">
          Sleep shapes your mood, cravings and energy. Connect Apple Health or an Android health app and your sleep shows up here.
        </p>
        <Link href="/app/settings" className="btn btn-secondary btn-sm mt-4">
          Connect in Settings
        </Link>
      </section>
    );
  }

  const average = logged.reduce((a, b) => a + b, 0) / logged.length;
  const W = boxW;
  const H = W < 480 ? 170 : 200;
  const pad = { l: 28, r: 6, t: 10, b: 24 };
  const maxH = Math.max(9, ...logged.map((m) => m / 60 + 0.5));
  const bw = (W - pad.l - pad.r) / 14;
  const barW = Math.min(bw * 0.6, 36);
  const off = (bw - barW) / 2;
  const y = (h: number) => pad.t + (1 - h / maxH) * (H - pad.t - pad.b);

  return (
    <section className="card">
      <CardHead icon={Moon} title="Your sleep · last 14 days" right={source ? `From ${source}` : undefined} />
      <p className="font-display text-[2rem] leading-none text-ink tabular">
        {Math.floor(average / 60)} h {Math.round(average % 60)} min
        <span className="ml-2 font-sans text-[15px] text-ink-soft">a night on average</span>
      </p>
      <div ref={boxRef} className="mt-4 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label={`Sleep for the last 14 days, average ${(average / 60).toFixed(1)} hours`}>
        {[0, 3, 6, 9].filter((t) => t <= maxH).map((t) => (
          <text key={t} x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-soft)" className="tabular">
            {t}h
          </text>
        ))}
        {values.map((m, i) => {
          const h = (m ?? 0) / 60;
          const x = pad.l + i * bw + off;
          return m === null ? (
            <rect key={days[i]} x={x} y={y(0.15)} width={barW} height={y(0) - y(0.15)} rx="2" fill="var(--line)" />
          ) : (
            <rect
              key={days[i]}
              x={x}
              y={y(h)}
              width={barW}
              height={y(0) - y(h)}
              rx="4"
              fill={h >= 7 ? "var(--accent)" : "var(--primary)"}
              opacity={h >= 7 ? 0.9 : 0.75}
            >
              <title>{`${formatShort(days[i])}: ${Math.floor(m / 60)} h ${m % 60} min`}</title>
            </rect>
          );
        })}
        <line x1={pad.l} x2={W - pad.r} y1={y(7)} y2={y(7)} stroke="var(--ink-soft)" strokeOpacity="0.5" strokeDasharray="5 5" />
        <text x={W - pad.r} y={y(7) - 5} textAnchor="end" fontSize="11" fill="var(--ink-soft)">
          7 hours
        </text>
        <text x={pad.l} y={H - 6} fontSize="11" fill="var(--ink-soft)">
          {formatShort(days[0])}
        </text>
        <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="11" fill="var(--ink-soft)">
          Today
        </text>
      </svg>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        {average >= 7 * 60
          ? "You're getting the 7 hours most women need. Keep your wind-down routine."
          : "Most women need 7 to 9 hours. A calm sound or 4-7-8 breathing at bedtime can help you drift off."}
      </p>
    </section>
  );
}
