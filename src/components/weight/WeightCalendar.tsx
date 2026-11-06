"use client";

import { useId, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { monthGrid, monthLabel, shiftMonth, WEEKDAYS, weightSeries } from "@/lib/cycleCalendar";
import { formatShort, parseISODate, todayISO } from "@/lib/dates";
import { canShowWeight, fromDisplayWeight, toDisplayWeight, validWeightKg, weightUnit } from "@/lib/dailyCare";
import { removeWeight, saveWeight } from "@/lib/dailyCareActions";
import { useProfileStore } from "@/lib/store";

/** "Your weight calendar": a month of tiny scales, and a 90-day chart beside it. */
export function WeightCalendarSection() {
  const profile = useProfileStore((s) => s.profile);
  const weights = useProfileStore((s) => s.weights);
  const today = todayISO();
  const now = parseISODate(today);
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  if (!profile || !canShowWeight(profile)) return null;
  const units = profile.units;
  const unit = weightUnit(units);
  const weeks = monthGrid(ym.year, ym.month);
  const atThisMonth = ym.year === now.getFullYear() && ym.month === now.getMonth();

  return (
    <section id="weight" className="card scroll-mt-24">
      <p className="label">Weight</p>
      <h2 className="font-display text-[1.6rem] leading-tight text-ink">Your weight calendar</h2>
      <p className="mt-1 text-sm text-ink-soft">Tap a day to add, change or remove a weigh-in.</p>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="font-semibold text-ink" aria-live="polite">
              {monthLabel(ym.year, ym.month)}
            </p>
            <button
              type="button"
              onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))}
              disabled={atThisMonth}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={`Weigh-ins in ${monthLabel(ym.year, ym.month)}`}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-semibold tracking-[0.06em] text-ink-soft" role="columnheader">
                {d}
              </div>
            ))}
            {weeks.flat().map((date, i) =>
              date ? (
                <ScaleTile
                  key={date}
                  date={date}
                  kg={weights[date]}
                  units={units}
                  today={today}
                  selected={selected === date}
                  onSelect={() => setSelected(date > today ? null : date)}
                />
              ) : (
                <div key={`e${i}`} />
              ),
            )}
          </div>
          {selected && (
            <DayEditor
              key={selected}
              date={selected}
              kg={weights[selected]}
              units={units}
              unit={unit}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
        <WeightChart weights={weights} today={today} units={units} unit={unit} />
      </div>
    </section>
  );
}

function ScaleTile({
  date,
  kg,
  units,
  today,
  selected,
  onSelect,
}: {
  date: string;
  kg?: number;
  units: "metric" | "imperial";
  today: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const future = date > today;
  const logged = kg !== undefined;
  const isToday = date === today;
  const day = parseISODate(date).getDate();
  const value = logged ? toDisplayWeight(kg, units) : null;
  const body = logged ? "color-mix(in srgb, var(--primary) 32%, var(--surface))" : "var(--surface-2)";
  const heart = logged ? "var(--primary)" : "color-mix(in srgb, var(--primary) 30%, var(--surface))";
  const label = `${formatShort(date)}${logged ? `, ${value}` : future ? "" : ", no weigh-in"}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={future}
      aria-label={label}
      aria-pressed={selected}
      className={`relative rounded-[12px] p-0 transition-transform disabled:opacity-35 ${!future ? "hover:-translate-y-0.5" : ""} ${
        selected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : isToday ? "ring-2 ring-ink ring-offset-1 ring-offset-surface" : ""
      }`}
    >
      <svg viewBox="0 0 48 52" className="block h-auto w-full" aria-hidden="true">
        <rect x="1.5" y="1.5" width="45" height="49" rx="12" fill={body} />
        {/* dial */}
        <path d="M11 20 A13 13 0 0 1 37 20 Z" fill="var(--surface)" />
        {logged ? (
          <text x="24" y="17.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-sans)">
            {value!.toFixed(value! >= 100 ? 0 : 1)}
          </text>
        ) : (
          <line x1="24" y1="19" x2="20" y2="11.5" stroke="var(--ink-soft)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        )}
        {/* heart with the date */}
        <path
          d="M24 46 C15 40 12.5 35.5 14 32 C15.4 28.8 19.8 28.6 24 32.2 C28.2 28.6 32.6 28.8 34 32 C35.5 35.5 33 40 24 46 Z"
          fill={heart}
        />
        <text
          x="24"
          y="38.6"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fill={logged ? "var(--on-primary)" : "var(--primary-ink)"}
          fontFamily="var(--font-sans)"
        >
          {day}
        </text>
      </svg>
    </button>
  );
}

function DayEditor({
  date,
  kg,
  units,
  unit,
  onClose,
}: {
  date: string;
  kg?: number;
  units: "metric" | "imperial";
  unit: "kg" | "lb";
  onClose: () => void;
}) {
  const id = useId();
  const [text, setText] = useState(kg !== undefined ? String(toDisplayWeight(kg, units)) : "");
  const [error, setError] = useState("");

  function save(e: FormEvent) {
    e.preventDefault();
    const v = fromDisplayWeight(parseFloat(text.replace(",", ".")), units);
    if (!validWeightKg(v)) return setError(`Enter a weight in ${unit}.`);
    saveWeight(date, v);
    onClose();
  }

  return (
    <form onSubmit={save} className="mt-4 rounded-2xl bg-surface-2 p-4" noValidate>
      <div className="flex items-center justify-between">
        <label htmlFor={`${id}-w`} className="font-semibold text-ink">
          {formatShort(date)}
        </label>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <div className="relative min-w-[120px] flex-1">
          <input
            id={`${id}-w`}
            className="input tabular h-11 pr-10"
            inputMode="decimal"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">{unit}</span>
        </div>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {kg !== undefined && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              removeWeight(date);
              onClose();
            }}
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </form>
  );
}

/** "Last 90 days": a soft pink area graph with a dot per weigh-in and the latest value. */
function WeightChart({
  weights,
  today,
  units,
  unit,
}: {
  weights: Record<string, number>;
  today: string;
  units: "metric" | "imperial";
  unit: "kg" | "lb";
}) {
  const gradId = useId().replace(/:/g, "");
  const pts = weightSeries(weights, today).map((p) => ({ ...p, v: toDisplayWeight(p.kg, units) }));
  if (pts.length < 2) {
    return (
      <div className="rounded-2xl border border-line p-5">
        <p className="font-semibold text-ink">Last 90 days</p>
        <p className="mt-2 text-sm text-ink-soft">Add two or more weigh-ins to see your trend here.</p>
      </div>
    );
  }
  const W = 320;
  const H = 170;
  const pad = { l: 8, r: 44, t: 16, b: 22 };
  const vals = pts.map((p) => p.v);
  const lo = Math.floor(Math.min(...vals) - 0.5);
  const hi = Math.ceil(Math.max(...vals) + 0.5);
  const x = (f: number) => pad.l + f * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts[pts.length - 1].x).toFixed(1)} ${H - pad.b} L${x(pts[0].x).toFixed(1)} ${H - pad.b} Z`;
  const last = pts[pts.length - 1];
  const change = Math.round((last.v - pts[0].v) * 10) / 10;

  return (
    <div className="rounded-2xl border border-line p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">Last 90 days</p>
        <span
          className={`tabular rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            change <= 0 ? "bg-[color-mix(in_srgb,var(--accent)_25%,var(--surface))] text-accent-ink" : "bg-surface-2 text-primary-ink"
          }`}
        >
          {change > 0 ? "+" : change < 0 ? "−" : ""}
          {Math.abs(change).toFixed(1)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block h-auto w-full" role="img" aria-label={`Weight over the last 90 days, from ${pts[0].v} to ${last.v} ${unit}`}>
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <line key={v} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="3 4" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p) => (
          <circle key={p.date} cx={x(p.x)} cy={y(p.v)} r="2.6" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.6" />
        ))}
        <circle cx={x(last.x)} cy={y(last.v)} r="4" fill="var(--primary)" />
        <text x={x(last.x) + 7} y={y(last.v) + 4} fontSize="11" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-sans)">
          {last.v.toFixed(1)}
        </text>
        <text x={pad.l} y={H - 5} fontSize="11" fill="var(--ink-soft)" fontFamily="var(--font-sans)">
          {formatShort(pts[0].date)}
        </text>
        <text x={W - pad.r} y={H - 5} fontSize="11" fill="var(--ink-soft)" textAnchor="end" fontFamily="var(--font-sans)">
          Today
        </text>
      </svg>
      <p className="mt-2 text-xs text-ink-soft">Weight can rise by about a kilo before your period. It&apos;s water, and it passes.</p>
    </div>
  );
}
