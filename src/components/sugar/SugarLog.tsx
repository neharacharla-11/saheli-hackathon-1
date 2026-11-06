"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Droplet, Phone, Trash2 } from "lucide-react";
import { addDays, daysBetween, formatShort, todayISO } from "@/lib/dates";
import { helpFor, telLink } from "@/lib/helplines";
import { usePref } from "@/lib/prefs";
import { activeProfileStore, newId, useProfileStore } from "@/lib/store";
import {
  BAND_COLOUR,
  BAND_LABEL,
  fromMgdl,
  isUrgent,
  sugarBand,
  sugarStats,
  toMgdl,
  UNIT_LABEL,
  validSugar,
  WHEN_LABEL,
  WHEN_ORDER,
  type SugarBand,
  type SugarUnit,
} from "@/lib/sugar";
import type { SugarReading, SugarWhen } from "@/lib/types";

const NO_READINGS: SugarReading[] = [];
const MMOL_COUNTRIES = new Set(["GB", "AU", "NZ", "CA", "IE", "ZA"]);

export function useSugarUnit(): [SugarUnit, (u: SugarUnit) => void] {
  const country = useProfileStore((s) => s.profile?.country);
  return usePref<SugarUnit>("sugarUnit", MMOL_COUNTRIES.has(country ?? "") ? "mmol" : "mgdl");
}

export function useSugarReadings() {
  return useProfileStore((s) => s.sugar ?? NO_READINGS);
}

function nowLocal() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function timeOf(at: string) {
  const [h, m] = at.slice(11, 16).split(":").map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function BandPill({ band }: { band: SugarBand }) {
  const cls =
    band === "in-target"
      ? "bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] text-accent-ink"
      : isUrgent(band)
        ? "bg-[#FDE2E2] text-[#9B1B30]"
        : "bg-[#FEF3C7] text-[#92400E]";
  return <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ${cls}`}>{BAND_LABEL[band]}</span>;
}

/** What to do now for a very low or very high reading. */
export function UrgentSugar({ band, country }: { band: SugarBand; country?: string }) {
  const help = helpFor(country);
  if (!isUrgent(band)) return null;
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-5 text-[#5c1020]" role="alert">
      <p className="flex items-start gap-2 font-semibold">
        <AlertTriangle size={18} className="mt-[3px] shrink-0" aria-hidden="true" />
        {band === "very-low" ? "Your sugar is very low. Act now." : "Your sugar is very high. Call your doctor now."}
      </p>
      {band === "very-low" ? (
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          <li>Eat or drink 15 g of fast sugar: 3 to 4 glucose tablets, half a glass (150 ml) of juice or regular soft drink, or 1 tablespoon of sugar or honey.</li>
          <li>Sit down and recheck in 15 minutes. If it&apos;s still under 70 mg/dL (3.9 mmol/L), have another 15 g.</li>
          <li>When it&apos;s back up, eat a snack with some carbs, like a roti, a slice of bread or a banana.</li>
          <li>If you feel confused, very drowsy or can&apos;t swallow safely, call for help now. Don&apos;t drive.</li>
        </ol>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Call your doctor or diabetes team now and tell them the number.</li>
          <li>Drink water, and check for ketones if your doctor has shown you how.</li>
          <li>If you&apos;re vomiting, breathing fast, very thirsty and drowsy, or confused, get emergency help.</li>
        </ul>
      )}
      <a href={telLink(help.emergency.number)} className="btn mt-4 bg-[#C62828] text-white">
        <Phone size={18} aria-hidden="true" /> Call {help.emergency.display ?? help.emergency.number} ({help.emergency.label})
      </a>
    </div>
  );
}

/* ---------------- 14-day chart ---------------- */

export function SugarChart({ readings, today, unit }: { readings: SugarReading[]; today: string; unit: SugarUnit }) {
  const W = 640;
  const H = 200;
  const L = 36;
  const B = 22;
  const start = addDays(today, -13);
  const recent = readings.filter((r) => r.at.slice(0, 10) >= start && r.at.slice(0, 10) <= today);
  const maxV = Math.max(320, ...recent.map((r) => r.value));
  const minV = 40;
  const y = (v: number) => 8 + (1 - (v - minV) / (maxV - minV)) * (H - B - 8);
  const dayW = (W - L - 8) / 14;
  const x = (r: SugarReading) => {
    const day = daysBetween(start, r.at.slice(0, 10));
    const [h, m] = r.at.slice(11, 16).split(":").map(Number);
    return L + day * dayW + (((h || 0) * 60 + (m || 0)) / 1440) * dayW;
  };
  const ticks = [70, 180, 250].filter((t) => t < maxV);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Sugar readings for the last 14 days: ${recent.length} readings, target band 80 to 180 mg/dL shaded`}>
      <rect x={L} y={y(180)} width={W - L - 8} height={y(80) - y(180)} rx={4} fill="var(--accent)" opacity={0.16} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="4 4" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-soft)" className="tabular">
            {fromMgdl(t, unit)}
          </text>
        </g>
      ))}
      {recent.map((r) => {
        const band = sugarBand(r.value, r.when);
        return (
          <circle key={r.id} cx={x(r)} cy={y(r.value)} r={5} fill={BAND_COLOUR[band]} stroke="var(--surface)" strokeWidth={1.5}>
            <title>
              {formatShort(r.at.slice(0, 10))} {timeOf(r.at)}: {fromMgdl(r.value, unit)} {UNIT_LABEL[unit]}, {WHEN_LABEL[r.when].toLowerCase()}, {BAND_LABEL[band].toLowerCase()}
            </title>
          </circle>
        );
      })}
      <text x={L} y={H - 4} fontSize={11} fill="var(--ink-soft)">
        {formatShort(start)}
      </text>
      <text x={W - 8} y={H - 4} fontSize={11} fill="var(--ink-soft)" textAnchor="end">
        Today
      </text>
    </svg>
  );
}

/* ---------------- Sugar log section ---------------- */

export function SugarLog() {
  const readings = useSugarReadings();
  const country = useProfileStore((s) => s.profile?.country);
  const [unit, setUnit] = useSugarUnit();
  const [value, setValue] = useState("");
  const [when, setWhen] = useState<SugarWhen>("fasting");
  const [at, setAt] = useState(nowLocal);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState<SugarReading | null>(null);
  const today = todayISO();
  const stats = useMemo(() => sugarStats(readings, today), [readings, today]);
  const sorted = useMemo(() => [...readings].sort((a, b) => (a.at < b.at ? 1 : -1)), [readings]);
  const [showAll, setShowAll] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value.replace(",", "."));
    const mgdl = toMgdl(n, unit);
    if (!value.trim() || !validSugar(mgdl)) {
      setError(unit === "mmol" ? "Please enter a reading between 1.1 and 33.3 mmol/L." : "Please enter a reading between 20 and 600 mg/dL.");
      return;
    }
    if (!at || at.slice(0, 10) > today) {
      setError("Please pick when you took this reading.");
      return;
    }
    setError("");
    const r: SugarReading = { id: newId(), at, value: mgdl, when };
    activeProfileStore().getState().addSugar(r);
    setJustSaved(r);
    setValue("");
    setAt(nowLocal());
  }

  const justBand = justSaved ? sugarBand(justSaved.value, justSaved.when) : null;

  return (
    <section className="space-y-5" aria-labelledby="sugar-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="sugar-title" className="flex items-center gap-2 font-display text-[1.6rem] leading-tight text-ink">
          <Droplet size={22} className="text-primary-ink" aria-hidden="true" /> Sugar log
        </h2>
        <div className="inline-flex rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Sugar unit">
          {(["mgdl", "mmol"] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={unit === u}
              onClick={() => setUnit(u)}
              className={`h-9 rounded-full px-4 text-sm font-semibold ${unit === u ? "bg-surface text-ink shadow-[var(--shadow-soft)]" : "text-ink-soft"}`}
            >
              {UNIT_LABEL[u]}
            </button>
          ))}
        </div>
      </div>

      {justSaved && justBand && isUrgent(justBand) && <UrgentSugar band={justBand} country={country} />}

      <div className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <form onSubmit={save} className="card space-y-4" noValidate>
          <h3 className="font-semibold text-ink">Add a reading</h3>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Reading ({UNIT_LABEL[unit]})</span>
            <input
              className="input tabular"
              inputMode="decimal"
              placeholder={unit === "mmol" ? "e.g. 6.2" : "e.g. 112"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">When</legend>
            <div className="flex flex-wrap gap-2">
              {WHEN_ORDER.map((w) => (
                <button key={w} type="button" className="chip" aria-pressed={when === w} onClick={() => setWhen(w)}>
                  {WHEN_LABEL[w]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Time</span>
            <input type="datetime-local" className="input" value={at} max={`${today}T23:59`} onChange={(e) => setAt(e.target.value)} />
          </label>
          {error && (
            <p className="text-sm text-[#9B1B30]" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full sm:w-auto">
            Save reading
          </button>
          {justSaved && justBand && !isUrgent(justBand) && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink" role="status">
              Saved {fromMgdl(justSaved.value, unit)} {UNIT_LABEL[unit]} <BandPill band={justBand} />
              {justBand === "low" && <span className="text-ink-soft">Have 15 g of fast sugar and recheck in 15 minutes.</span>}
            </p>
          )}
        </form>

        <div className="card">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="label">Last reading</p>
              {stats.last ? (
                <>
                  <p className="font-display text-[1.8rem] leading-tight text-ink tabular">{fromMgdl(stats.last.value, unit)}</p>
                  <p className="text-xs text-ink-soft">
                    {formatShort(stats.last.at.slice(0, 10))}, {WHEN_LABEL[stats.last.when].toLowerCase()}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-ink-soft">None yet</p>
              )}
            </div>
            <div>
              <p className="label">Fasting average</p>
              <p className="font-display text-[1.8rem] leading-tight text-ink tabular">{stats.fastingAvg !== null ? fromMgdl(stats.fastingAvg, unit) : "—"}</p>
              <p className="text-xs text-ink-soft">{stats.fastingCount} in 14 days</p>
            </div>
            <div>
              <p className="label">In target</p>
              <p className="font-display text-[1.8rem] leading-tight text-ink tabular">{stats.inTargetPct !== null ? `${stats.inTargetPct}%` : "—"}</p>
              <p className="text-xs text-ink-soft">{stats.count} readings, 14 days</p>
            </div>
          </div>
          <div className="mt-4">
            <SugarChart readings={readings} today={today} unit={unit} />
          </div>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOUR["in-target"] }} /> In target
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOUR.high }} /> Low or high
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_COLOUR["very-high"] }} /> Very low or very high
            </span>
            <span>Shaded: {fromMgdl(80, unit)} to {fromMgdl(180, unit)} {UNIT_LABEL[unit]}</span>
          </p>
        </div>
      </div>

      <div className="card !py-2">
        {sorted.length === 0 ? (
          <p className="py-4 text-ink-soft">Your readings will be listed here. Add your first one above.</p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {(showAll ? sorted : sorted.slice(0, 10)).map((r) => {
                const band = sugarBand(r.value, r.when);
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BAND_COLOUR[band] }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink tabular">
                        {fromMgdl(r.value, unit)} <span className="text-sm font-normal text-ink-soft">{UNIT_LABEL[unit]}</span>
                      </span>
                      <span className="block text-sm text-ink-soft">
                        {formatShort(r.at.slice(0, 10))}, {timeOf(r.at)} · {WHEN_LABEL[r.when]}
                      </span>
                    </span>
                    <BandPill band={band} />
                    <button
                      type="button"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                      aria-label={`Delete reading ${fromMgdl(r.value, unit)} from ${formatShort(r.at.slice(0, 10))}`}
                      onClick={() => activeProfileStore().getState().removeSugar(r.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {sorted.length > 10 && (
              <button type="button" className="btn btn-ghost btn-sm my-2" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show fewer" : `Show all ${sorted.length} readings`}
              </button>
            )}
          </>
        )}
      </div>
      <p className="text-sm text-ink-soft">
        Targets are general guides: fasting and before meals up to 130 mg/dL (7.2 mmol/L), 2 hours after a meal under 180 (10 mmol/L). Your doctor may set
        different ones for you.
      </p>
    </section>
  );
}
