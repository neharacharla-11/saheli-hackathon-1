import { phaseForDay, PHASE_VAR } from "@/lib/cycle";

interface CycleRingProps {
  day: number;
  cycleLength?: number;
  periodLength?: number;
  size?: number;
  /** Small rings (the phone mockup) use a compact label. */
  compact?: boolean;
  className?: string;
}

/** A ring of short rounded dashes, one per day, coloured by phase. Today is larger and darker. */
export function CycleRing({ day, cycleLength = 28, periodLength = 5, size = 220, compact = false, className }: CycleRingProps) {
  const L = Math.max(20, Math.min(60, cycleLength));
  const c = 100;
  const r = 84;
  const dashes = Array.from({ length: L }, (_, i) => {
    const d = i + 1;
    const angle = ((d - 1) / L) * Math.PI * 2 - Math.PI / 2;
    const isToday = d === day;
    const len = isToday ? 13 : 8;
    const inner = r - len / 2;
    const outer = r + len / 2;
    return {
      d,
      isToday,
      x1: c + Math.cos(angle) * inner,
      y1: c + Math.sin(angle) * inner,
      x2: c + Math.cos(angle) * outer,
      y2: c + Math.sin(angle) * outer,
      color: PHASE_VAR[phaseForDay(d, L, periodLength)],
    };
  });
  const dashWidth = Math.max(3.2, Math.min(7, (2 * Math.PI * r) / L - 6));

  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
        {dashes.map((s) => (
          <line
            key={s.d}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={s.color}
            strokeWidth={s.isToday ? dashWidth + 2.5 : dashWidth}
            strokeLinecap="round"
            opacity={s.isToday ? 1 : 0.5}
            style={s.isToday ? { filter: "brightness(0.85)" } : undefined}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="label" style={compact ? { fontSize: "0.55rem" } : undefined}>
          {compact ? "Day" : "Cycle day"}
        </span>
        <span
          className="font-display tabular leading-none text-ink"
          style={{ fontSize: compact ? size * 0.3 : Math.round(size * 0.255) }}
          role="img"
          aria-label={`Cycle day ${day}`}
        >
          {day}
        </span>
      </div>
    </div>
  );
}

export interface WeatherRow {
  label: string;
  level: number; // 0-5
  word: string;
}

/** Body Weather bars: label, 5 segments, a word. */
export function WeatherBars({ rows, color, compact = false }: { rows: WeatherRow[]; color: string; compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-1" : "space-y-2.5"}>
      {rows.map((r) => (
        <li
          key={r.label}
          className="grid items-center gap-2.5"
          style={{ gridTemplateColumns: compact ? "44px 1fr 40px" : "72px 1fr 64px" }}
        >
          <span className={compact ? "text-[9px] text-ink-soft" : "text-sm text-ink-soft"}>{r.label}</span>
          <span className="flex gap-1" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full ${compact ? "h-1" : "h-2"}`}
                style={{ background: i < r.level ? color : "var(--line)" }}
              />
            ))}
          </span>
          <span className={`text-right font-semibold text-ink ${compact ? "text-[9px]" : "text-sm"}`}>
            <span className="sr-only">{r.label}: </span>
            {r.word}
          </span>
        </li>
      ))}
    </ul>
  );
}
