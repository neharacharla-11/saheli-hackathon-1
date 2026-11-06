"use client";

import Link from "next/link";
import { Moon } from "lucide-react";
import { addDays, formatShort, todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";

/** Sleep from her health app, last 14 nights. Shown on Mind. */
export function SleepCard() {
  const health = useProfileStore((s) => s.health);
  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const vals = days.map((d) => health?.sleepMin?.[d] ?? null);
  const have = vals.filter((v): v is number => v !== null);

  if (!have.length) {
    return (
      <section className="card" aria-labelledby="sleep-title">
        <h2 id="sleep-title" className="flex items-center gap-2 font-semibold text-ink">
          <Moon size={18} className="text-primary-ink" aria-hidden="true" /> Your sleep
        </h2>
        <p className="mt-2 text-ink-soft">Bring in your sleep from Apple Health or your Android health app to see how rest and mood go together.</p>
        <Link href="/app/settings" className="btn btn-secondary btn-sm mt-4">
          Connect a health app
        </Link>
      </section>
    );
  }

  const avg = have.reduce((a, b) => a + b, 0) / have.length;
  const max = Math.max(9 * 60, ...have);
  const W = 560;
  const H = 120;
  const gap = 8;
  const bw = (W - gap * 13) / 14;
  const y = (v: number) => H - (v / max) * H;
  const h = (m: number) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m`;

  return (
    <section className="card" aria-labelledby="sleep-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sleep-title" className="flex items-center gap-2 font-semibold text-ink">
          <Moon size={18} className="text-primary-ink" aria-hidden="true" /> Your sleep · last 14 nights
        </h2>
        <span className="text-sm text-ink-soft">From your health app</span>
      </div>
      <p className="mt-2 font-display text-[2rem] leading-none text-ink tabular">
        {h(avg)} <span className="text-base text-ink-soft">a night on average</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="mt-4 h-auto w-full" role="img" aria-label={`Sleep for the last 14 nights, average ${h(avg)}`}>
        <line x1={0} x2={W} y1={y(7 * 60)} y2={y(7 * 60)} stroke="var(--line)" strokeDasharray="4 4" />
        {vals.map((v, i) => {
          const x = i * (bw + gap);
          if (v === null) return <rect key={days[i]} x={x} y={H - 3} width={bw} height={3} rx={1.5} fill="var(--line)" />;
          return (
            <rect key={days[i]} x={x} y={y(v)} width={bw} height={H - y(v)} rx={4} fill={v >= 7 * 60 ? "var(--ph-luteal)" : "color-mix(in srgb, var(--ph-luteal) 55%, var(--surface))"}>
              <title>
                {formatShort(days[i])}: {h(v)}
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
        <span>{formatShort(days[0])}</span>
        <span>Dashed line: 7 hours</span>
        <span>Today</span>
      </div>
      {avg < 7 * 60 && <p className="mt-3 text-sm text-ink">Most adults feel best with 7 to 9 hours. Low sleep can make cravings, low moods and PMS feel stronger.</p>}
    </section>
  );
}
