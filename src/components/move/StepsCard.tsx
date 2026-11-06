"use client";

import Link from "next/link";
import { Footprints } from "lucide-react";
import { formatShort } from "@/lib/dates";
import { lastNDays } from "@/lib/myDay";
import { useProfileStore } from "@/lib/store";
import { CardTitle, fmt } from "@/components/nourish/bits";

const GOAL = 7000;

export function StepsCard() {
  const health = useProfileStore((s) => s.health);
  const days = lastNDays(14);
  const values = days.map((d) => health?.steps?.[d] ?? null);
  const have = values.filter((v): v is number => v !== null);

  if (!have.length) {
    return (
      <section className="card" aria-labelledby="steps-title">
        <CardTitle icon={Footprints} title={<span id="steps-title">Your steps</span>} />
        <p className="text-ink-soft">Bring in your steps from Apple Health or your Android health app to see how much you move each day.</p>
        <Link href="/app/settings" className="btn btn-secondary btn-sm mt-4">
          Connect a health app
        </Link>
      </section>
    );
  }

  const avg = Math.round(have.reduce((a, b) => a + b, 0) / have.length);
  const max = Math.max(GOAL * 1.25, ...have);
  const W = 560;
  const H = 150;
  const gap = 8;
  const bw = (W - gap * 13) / 14;
  const y = (v: number) => H - (v / max) * H;

  return (
    <section className="card" aria-labelledby="steps-title">
      <CardTitle
        icon={Footprints}
        title={<span id="steps-title">Your steps · last 14 days</span>}
        right={<span className="text-sm text-ink-soft">From {health?.source ?? "your health app"}</span>}
      />
      <p className="font-display text-[2rem] leading-none text-ink tabular">
        {fmt(avg)} <span className="text-base text-ink-soft">steps a day on average</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="mt-5 h-auto w-full" role="img" aria-label={`Steps for the last 14 days, average ${fmt(avg)} a day, goal ${fmt(GOAL)}`}>
        {values.map((v, i) => {
          const x = i * (bw + gap);
          if (v === null) return <rect key={days[i]} x={x} y={H - 3} width={bw} height={3} rx={1.5} fill="var(--line)" />;
          const top = y(v);
          return (
            <rect key={days[i]} x={x} y={top} width={bw} height={H - top} rx={4} fill={v >= GOAL ? "var(--accent-ink)" : "var(--accent)"} opacity={i === 13 ? 1 : 0.85}>
              <title>
                {formatShort(days[i])}: {fmt(v)} steps
              </title>
            </rect>
          );
        })}
        <line x1={0} x2={W} y1={y(GOAL)} y2={y(GOAL)} stroke="var(--ink-soft)" strokeDasharray="5 5" strokeWidth={1} opacity={0.6} />
        <text x={W} y={y(GOAL) - 6} textAnchor="end" fontSize={11} fill="var(--ink-soft)">
          {fmt(GOAL)} goal
        </text>
      </svg>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-soft">
        <span>{formatShort(days[0])}</span>
        <span>Today</span>
      </div>
    </section>
  );
}
