"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarHeart, Heart, Stethoscope, Thermometer, TestTube } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { addDays, daysBetween, formatShort, todayISO } from "@/lib/dates";
import { cToF, cycleReadings, dayMonth, detectThermalShift, fertileWindow, opkStatus, parseTemperature, temperatureStatus, type ThermalShift } from "@/lib/fertility";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import type { OpkResult } from "@/lib/stageTypes";
import { DIAGNOSE, StagePicker, TipCards, TrackCard, WarningSigns } from "./shared";

const NO_TEMPS: Record<string, number> = {};
const NO_OPK: Record<string, OpkResult> = {};

function useCycleStart(): string | null {
  const starts = useProfileStore((s) => s.periodStarts);
  const today = todayISO();
  return [...starts].filter((s) => s <= today).sort().pop() ?? null;
}

export function ConceivePage() {
  const profile = useProfileStore((s) => s.profile);
  const cycleStart = useCycleStart();
  const today = todayISO();
  if (!profile) return null;
  const age = profile.age ?? 30;

  return (
    <>
      <PageHeader eyebrow="CONCEIVE" title="Your fertile window" lead="Your temperature, ovulation tests and cycle together show your best days to try." />
      <div className="flex flex-col gap-5">
        {cycleStart ? (
          <>
            <FertilitySigns cycleStart={cycleStart} />
            <FertileWindowCard cycleStart={cycleStart} cycleLength={profile.cycleLength} today={today} />
          </>
        ) : (
          <section className="card">
            <h2 className="font-display text-[1.45rem] text-ink">Start with your last period</h2>
            <p className="mt-1 text-ink-soft">Log the first day of your last period and Saheli will show your fertile window and chart your temperatures for this cycle.</p>
            <Link href="/app/cycle" className="btn btn-primary mt-4">
              Log my period
            </Link>
          </section>
        )}
        <TipCards
          cols={2}
          tips={[
            {
              title: "Before and during",
              icon: Heart,
              points: [
                "Take folic acid (400 mcg a day) from now. It protects baby's spine in the first weeks.",
                "Sex every 1 to 2 days in your fertile window is enough. No need to time it to the hour.",
                "Eat iron, protein and leafy greens, cut down on alcohol, and stop smoking.",
                "Stress doesn't stop you getting pregnant, but rest and kindness to yourself help you keep going.",
              ],
            },
            {
              title: "When to see a doctor",
              icon: Stethoscope,
              points: [
                age >= 35
                  ? "You're 35 or older, so see a doctor after 6 months of trying."
                  : "See a doctor after 12 months of trying (6 months if you're 35 or older).",
                "Sooner if your cycles are shorter than 21 or longer than 35 days, or very irregular.",
                "Sooner if you have very painful periods, PCOS, endometriosis, or a past pelvic infection.",
                "Both partners can be checked. About a third of the time it's on the man's side.",
              ],
            },
          ]}
        />
        <TrackCard
          items={[
            { label: "Your period", why: "The first day of each period starts a new chart.", href: "/app/cycle" },
            { label: "Morning temperature", why: "Before you get up, at the same time each day." },
            { label: "Ovulation tests", why: "Once a day in the afternoon, from a few days before your window." },
            { label: "Folate and iron", why: "On your blood reports, to be ready for pregnancy.", href: "/app/reports" },
          ]}
        />
        <WarningSigns
          signs={[
            "Severe pain low in your belly, especially on one side",
            "Bleeding with dizziness, fainting or shoulder pain after a positive pregnancy test",
            "Very heavy bleeding, soaking a pad every hour",
            "Fever with pain in your pelvis",
          ]}
        />
        <p className="text-sm text-ink-soft">{DIAGNOSE}</p>
        <StagePicker />
      </div>
    </>
  );
}

function FertileWindowCard({ cycleStart, cycleLength, today }: { cycleStart: string; cycleLength: number; today: string }) {
  const w = fertileWindow(cycleStart, cycleLength);
  const day = daysBetween(cycleStart, today) + 1;
  const inWindow = today >= w.start && today <= w.end;
  const before = today < w.start;
  return (
    <section className="rounded-[32px] p-6 sm:p-8" style={{ background: "color-mix(in srgb, var(--ph-ovulation) 16%, var(--surface))" }} aria-labelledby="window-title">
      <p className="label mb-1 flex items-center gap-1.5">
        <CalendarHeart size={14} aria-hidden /> CYCLE DAY {day}
      </p>
      <h2 id="window-title" className="font-display text-[1.8rem] leading-tight text-ink">
        {inWindow ? "You're in your fertile window" : before ? `Your fertile window starts ${formatShort(w.start)}` : "Your fertile window has passed this cycle"}
      </h2>
      <p className="mt-2 text-ink">
        {formatShort(w.start)} to {formatShort(w.end)} · ovulation around {formatShort(w.ovulation)}
      </p>
      <p className="mt-2 max-w-[640px] text-sm text-ink-soft">
        Worked out from your {cycleLength}-day cycle. Your temperature and ovulation tests show what your body is actually doing this month.
      </p>
    </section>
  );
}

function FertilitySigns({ cycleStart }: { cycleStart: string }) {
  const units = useProfileStore((s) => s.profile?.units);
  const bbt = useProfileStore((s) => s.bbt ?? NO_TEMPS);
  const opk = useProfileStore((s) => s.opk ?? NO_OPK);
  const today = todayISO();
  const unit: "C" | "F" = units === "imperial" ? "F" : "C";
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const days = useMemo(() => {
    const n = Math.min(60, daysBetween(cycleStart, today) + 1);
    return Array.from({ length: n }, (_, i) => addDays(today, -i));
  }, [cycleStart, today]);

  const readings = cycleReadings(bbt, cycleStart, today);
  const shift = detectThermalShift(readings);
  const test = opkStatus(opk, cycleStart, today);
  const shown = (c: number) => (unit === "F" ? cToF(c).toFixed(1) : c.toFixed(2).replace(/0$/, ""));

  function saveTemp() {
    const r = parseTemperature(text, unit);
    if (!r.ok) return setMsg({ tone: "error", text: r.message });
    activeProfileStore().setState((s) => ({ bbt: { ...(s.bbt ?? {}), [date]: r.c } }) as never);
    setMsg({ tone: "ok", text: `Saved ${shown(r.c)} °${unit} for ${date === today ? "today" : dayMonth(date)}.` });
    setText("");
  }

  function setTest(v: OpkResult) {
    activeProfileStore().setState((s) => {
      const next = { ...(s.opk ?? {}) };
      if (next[date] === v) delete next[date];
      else next[date] = v;
      return { opk: next } as never;
    });
  }

  const dayLabel = (d: string) => {
    const n = daysBetween(cycleStart, d) + 1;
    return d === today ? `Today · day ${n}` : d === addDays(today, -1) ? `Yesterday · day ${n}` : `${dayMonth(d)} · day ${n}`;
  };

  return (
    <section className="card" aria-labelledby="fertility-signs">
      <p className="label mb-1">FERTILITY SIGNS</p>
      <h2 id="fertility-signs" className="font-display text-[1.6rem] leading-tight text-ink">
        Your temperature and ovulation tests
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatusBox icon={Thermometer} title="Temperature" tone={shift.status === "shift" ? "good" : "calm"} big={temperatureStatus(shift)}>
          {shift.status === "shift"
            ? `Your temperature rose and stayed up for 3 days, above your coverline of ${shown(shift.coverline)} °${unit}.`
            : shift.status === "collecting"
              ? "Saheli needs 9 mornings to spot the rise that comes after ovulation."
              : `${readings.length} mornings logged this cycle. The rise comes after ovulation, so keep going.`}
        </StatusBox>
        <StatusBox icon={TestTube} title="Ovulation test" tone={test.tone === "positive" || test.tone === "recent" ? "sun" : "calm"} big={test.title}>
          {test.text}
        </StatusBox>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-surface-2 p-4 md:grid-cols-[1.1fr_1.3fr_1.2fr] md:items-end">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Day
          <select className="input h-11" value={date} onChange={(e) => { setDate(e.target.value); setMsg(null); }}>
            {days.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
                {bbt[d] ? ` · ${shown(bbt[d])}°` : ""}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex flex-col gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            saveTemp();
          }}
        >
          <label htmlFor="bbt-input" className="text-sm font-semibold text-ink">
            Morning temperature (°{unit})
          </label>
          <div className="flex gap-2">
            <input
              id="bbt-input"
              className="input h-11 min-w-0 flex-1"
              inputMode="decimal"
              placeholder={bbt[date] ? `Saved ${shown(bbt[date])}` : unit === "F" ? "e.g. 97.5" : "e.g. 36.4"}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setMsg(null);
              }}
            />
            <button className="btn btn-primary h-11 shrink-0" type="submit">
              Save
            </button>
          </div>
        </form>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink" id="opk-label">
            Ovulation test
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="opk-label">
            {(["pos", "neg"] as const).map((v) => (
              <button key={v} type="button" className="chip h-11 flex-1 justify-center" aria-pressed={opk[date] === v} onClick={() => setTest(v)}>
                {v === "pos" ? "Positive" : "Negative"}
              </button>
            ))}
          </div>
        </div>
        {msg && (
          <p className={`text-sm font-semibold md:col-span-3 ${msg.tone === "error" ? "text-[#9B1B30]" : "text-accent-ink"}`} role={msg.tone === "error" ? "alert" : "status"}>
            {msg.text}
          </p>
        )}
        <p className="text-xs text-ink-soft md:col-span-3">Tap a test result again to clear it.</p>
      </div>

      <BbtChart cycleStart={cycleStart} readings={readings} opk={opk} shift={shift} unit={unit} today={today} />

      <p className="mt-4 text-sm text-ink-soft">
        Illness, alcohol, a late night or poor sleep can raise your temperature for a day. Take it before you get out of bed, at about the same time each morning. If you&apos;ve been trying for 12 months (6 if you&apos;re 35 or older), see a doctor.
      </p>
    </section>
  );
}

function StatusBox({ icon: Icon, title, big, children, tone }: { icon: typeof Thermometer; title: string; big: string; children: React.ReactNode; tone: "good" | "sun" | "calm" }) {
  const bg =
    tone === "good"
      ? "color-mix(in srgb, var(--ph-follicular) 16%, var(--surface))"
      : tone === "sun"
        ? "color-mix(in srgb, var(--ph-ovulation) 20%, var(--surface))"
        : "var(--surface-2)";
  return (
    <div className="rounded-2xl p-4" style={{ background: bg }} aria-live="polite">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <Icon size={15} aria-hidden /> {title}
      </p>
      <p className="mt-1 font-display text-[1.25rem] leading-snug text-ink">{big}</p>
      <p className="mt-1 text-sm text-ink-soft">{children}</p>
    </div>
  );
}

function BbtChart({
  cycleStart,
  readings,
  opk,
  shift,
  unit,
  today,
}: {
  cycleStart: string;
  readings: { date: string; c: number }[];
  opk: Record<string, OpkResult>;
  shift: ThermalShift;
  unit: "C" | "F";
  today: string;
}) {
  const cycleLength = useProfileStore((s) => s.profile?.cycleLength ?? 28);
  const todayN = daysBetween(cycleStart, today) + 1;
  const daysShown = Math.max(cycleLength, todayN);
  const W = 680;
  const H = 240;
  const L = 46;
  const R = 12;
  const T = 14;
  const B = 44; // room for test dots and day labels
  const plotH = H - T - B;
  const temps = readings.map((r) => r.c);
  const lo = Math.min(36.0, ...temps.map((t) => t - 0.1));
  const hi = Math.max(37.0, ...temps.map((t) => t + 0.1));
  const yMin = Math.floor(lo * 5) / 5;
  const yMax = Math.ceil(hi * 5) / 5;
  const x = (dayN: number) => L + ((dayN - 1) / Math.max(1, daysShown - 1)) * (W - L - R);
  const y = (c: number) => T + (1 - (c - yMin) / (yMax - yMin)) * plotH;
  const dayN = (d: string) => daysBetween(cycleStart, d) + 1;
  // Even steps in her own unit: 0.2 °C or 0.5 °F.
  const ticks: number[] = [];
  if (unit === "F") {
    for (let f = Math.ceil(cToF(yMin) * 2) / 2; f <= cToF(yMax) + 1e-9; f += 0.5) ticks.push(((f - 32) * 5) / 9);
  } else {
    for (let v = yMin; v <= yMax + 1e-9; v += 0.2) ticks.push(Math.round(v * 10) / 10);
  }
  const fmt = (c: number) => (unit === "F" ? cToF(c).toFixed(1) : c.toFixed(1));
  const path = readings.map((r, i) => `${i ? "L" : "M"}${x(dayN(r.date)).toFixed(1)},${y(r.c).toFixed(1)}`).join(" ");
  const tests = Object.entries(opk).filter(([d]) => d >= cycleStart && d <= today);
  const ov = shift.status === "shift" ? shift.ovulationDate : null;
  const coverline = shift.status === "shift" ? shift.coverline : 0;
  const ovTemp = ov ? (readings.find((r) => r.date === ov)?.c ?? coverline) : 0;
  const testY = H - B + 14;
  const labelDays = [1, 7, 14, 21, 28].filter((d) => d <= daysShown && Math.abs(d - todayN) > 2);

  return (
    <figure className="mt-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Temperature chart for this cycle: ${readings.length} readings. ${temperatureStatus(shift)}.`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--ink-soft)" className="tabular">
              {fmt(v)}
            </text>
          </g>
        ))}
        {shift.status === "shift" && (
          <g>
            <line x1={L} x2={W - R} y1={y(shift.coverline)} y2={y(shift.coverline)} stroke="var(--primary-ink)" strokeDasharray="6 5" strokeWidth={1.5} />
            <text x={W - R} y={y(shift.coverline) - 6} textAnchor="end" fontSize={11} fill="var(--primary-ink)">
              Coverline {fmt(shift.coverline)}°
            </text>
          </g>
        )}
        <line x1={x(todayN)} x2={x(todayN)} y1={T} y2={H - B} stroke="var(--ink-soft)" strokeOpacity={0.35} strokeDasharray="2 4" />
        {path && <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {readings.map((r) => (
          <circle key={r.date} cx={x(dayN(r.date))} cy={y(r.c)} r={3.5} fill="var(--surface)" stroke="var(--primary)" strokeWidth={2}>
            <title>
              {dayMonth(r.date)}: {fmt(r.c)} °{unit}
            </title>
          </circle>
        ))}
        {ov && (
          <circle cx={x(dayN(ov))} cy={y(ovTemp)} r={7.5} fill="#E3A73A" stroke="var(--surface)" strokeWidth={2.5}>
            <title>Ovulation likely around {dayMonth(ov)}</title>
          </circle>
        )}
        {tests.map(([d, v]) => (
          <circle
            key={d}
            cx={x(dayN(d))}
            cy={testY}
            r={4.5}
            fill={v === "pos" ? "#E3A73A" : "var(--surface)"}
            stroke={v === "pos" ? "#E3A73A" : "var(--ink-soft)"}
            strokeWidth={1.5}
          >
            <title>
              {dayMonth(d)}: test {v === "pos" ? "positive" : "negative"}
            </title>
          </circle>
        ))}
        <text x={L - 8} y={testY + 4} textAnchor="end" fontSize={10} fill="var(--ink-soft)">
          Test
        </text>
        {labelDays.map((d) => (
          <text key={d} x={x(d)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--ink-soft)">
            Day {d}
          </text>
        ))}
        <text x={x(todayN)} y={H - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">
          Today
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-surface" aria-hidden /> Temperature
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#E3A73A]" aria-hidden /> Ovulation or positive test
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-ink-soft bg-surface" aria-hidden /> Negative test
        </span>
        {shift.status === "shift" && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed border-primary-ink" aria-hidden /> Coverline
          </span>
        )}
      </figcaption>
    </figure>
  );
}
