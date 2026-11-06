"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarCheck, CalendarPlus, Check, HeartPulse, Plus, Scale, Stethoscope, Trash2, TriangleAlert } from "lucide-react";
import { daysBetween, formatShort, parseISODate, todayISO } from "@/lib/dates";
import {
  bmiOf,
  BP_MESSAGE,
  bpLevel,
  downloadIcs,
  gainRange,
  gainRangeAtWeek,
  kgTo,
  pregnancyWeek,
  toKg,
  USUAL_SCANS,
  weekStart,
  weightUnit,
  type BPLevel,
} from "@/lib/pregnancy";
import { useProfileStore } from "@/lib/store";
import type { Appointment } from "@/lib/pregnancyTypes";
import { newId, nowISO, setStage, timeLabel, updateData, updatePregnancy } from "./data";
import { AlertBox, CardHead, Field, Pill } from "./ui";

/* ---------------- Scans and check-ups ---------------- */

export function Scans({ dueDate }: { dueDate: string }) {
  const all = useProfileStore((s) => s.appointments) ?? [];
  const today = todayISO();
  const list = all.filter((a) => a.kind !== "plan").sort((a, b) => a.date.localeCompare(b.date));
  const next = list.find((a) => a.date >= today);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<"scan" | "checkup">("scan");

  function addUsual() {
    const items: Appointment[] = USUAL_SCANS.map((s): Appointment => ({
      id: newId(),
      date: weekStart(dueDate, s.week),
      title: s.title,
      kind: /scan/i.test(s.title) ? "scan" : "checkup",
      note: `${s.note} Ask your doctor for your exact date.`,
    })).filter((a) => a.date >= today);
    updateData((s) => ({ appointments: [...(s.appointments ?? []), ...items] }));
  }

  function save() {
    if (!title.trim() || !date) return;
    updateData((s) => ({ appointments: [...(s.appointments ?? []), { id: newId(), title: title.trim(), date, kind }] }));
    setTitle("");
    setDate("");
    setAdding(false);
  }

  const weekOf = (d: string) => Math.floor(daysBetween(weekStart(dueDate, 0), d) / 7);

  return (
    <section className="card">
      <CardHead
        icon={Stethoscope}
        title="Scans and check-ups"
        right={
          list.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                downloadIcs(
                  "saheli-pregnancy-checkups.ics",
                  all.filter((a) => a.date >= today).map((a) => ({ date: a.date, title: a.title, note: a.note, uid: a.id })),
                )
              }
            >
              <CalendarPlus size={16} aria-hidden /> Add all to my calendar
            </button>
          )
        }
      />
      {next && (
        <div className="mb-4 rounded-2xl border-2 border-primary/40 bg-surface-2 p-4">
          <p className="label">Next</p>
          <p className="mt-1 font-display text-[1.35rem] leading-snug text-ink">{next.title}</p>
          <p className="mt-0.5 text-[15px] text-ink-soft tabular">
            {parseISODate(next.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
            {daysBetween(today, next.date) === 0 ? "today" : `in ${daysBetween(today, next.date)} days`} · week {weekOf(next.date)}
          </p>
          {next.note && <p className="mt-1.5 text-sm text-ink">{next.note}</p>}
        </div>
      )}
      {list.length === 0 ? (
        <div className="rounded-2xl bg-surface-2 p-4">
          <p className="text-ink">No scans or check-ups yet.</p>
          <p className="mt-1 text-sm text-ink-soft">Add the usual ones for your weeks, then change the dates to match what your doctor gives you.</p>
          <button type="button" className="btn btn-primary mt-3" onClick={addUsual}>
            Add the usual scans
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((a) => {
            const done = a.date < today;
            return (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? "bg-accent/30 text-accent-ink" : "border-2 border-line"}`}
                  aria-hidden
                >
                  {done && <Check size={13} strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] ${done ? "text-ink-soft" : "font-semibold text-ink"}`}>{a.title}</p>
                  <p className="text-xs text-ink-soft tabular">
                    {formatShort(a.date)} · week {weekOf(a.date)}
                    {done ? " · done" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                  aria-label={`Remove ${a.title}`}
                  onClick={() => updateData((s) => ({ appointments: (s.appointments ?? []).filter((x) => x.id !== a.id) }))}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {adding ? (
        <div className="mt-4 grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Growth scan" />
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Type</span>
            <div className="flex gap-2">
              <button type="button" className="chip" aria-pressed={kind === "scan"} onClick={() => setKind("scan")}>Scan</button>
              <button type="button" className="chip" aria-pressed={kind === "checkup"} onClick={() => setKind("checkup")}>Check-up</button>
            </div>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" className="btn btn-primary" onClick={save} disabled={!title.trim() || !date}>Save</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm mt-3 -ml-2 text-primary-ink" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden /> Add a scan or check-up
        </button>
      )}
    </section>
  );
}

/* ---------------- Reminders ---------------- */

const REMINDERS = [
  { id: "iron", label: "Iron and folic acid", time: "After dinner", hour: 21, note: "With water or orange juice, not tea." },
  { id: "calcium", label: "Calcium", time: "After lunch", hour: 14, note: "Keep 2 hours away from iron." },
  { id: "kicks", label: "Count baby's kicks", time: "Evening", hour: 19, note: "From week 28, when baby is usually active." },
  { id: "water", label: "Drink a glass of water", time: "Every few hours", hour: 11, note: "8 to 10 glasses a day." },
];

function dailyIcs(id: string, label: string, hour: number, note: string): string {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const hh = String(hour).padStart(2, "0");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Saheli//Pregnancy//EN",
    "BEGIN:VEVENT", `UID:${id}-daily@saheli`, `DTSTAMP:${stamp}`, `DTSTART:${d}T${hh}0000`, `DTEND:${d}T${hh}1000`,
    "RRULE:FREQ=DAILY", `SUMMARY:${label}`, `DESCRIPTION:${note}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${label}`, "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function Reminders() {
  const on = useProfileStore((s) => s.pregnancy?.reminders) ?? {};
  const [perm, setPerm] = useState<string>(() => (typeof Notification === "undefined" ? "unsupported" : Notification.permission));

  async function toggle(id: string) {
    const next = !on[id];
    updatePregnancy({ reminders: { ...on, [id]: next } });
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      setPerm(await Notification.requestPermission());
    }
  }

  function addToCalendar(r: (typeof REMINDERS)[number]) {
    const blob = new Blob([dailyIcs(r.id, r.label, r.hour, r.note)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saheli-${r.id}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="card">
      <CardHead icon={Bell} title="Reminders" />
      <ul className="divide-y divide-line">
        {REMINDERS.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{r.label}</p>
              <p className="text-sm text-ink-soft">
                {r.time} · {r.note}
              </p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm text-primary-ink" onClick={() => addToCalendar(r)}>
              <CalendarCheck size={16} aria-hidden /> Calendar
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={!!on[r.id]}
              aria-label={`${r.label} reminder`}
              onClick={() => toggle(r.id)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on[r.id] ? "bg-primary" : "bg-line"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on[r.id] ? "left-6" : "left-1"}`} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-soft">
        {perm === "denied"
          ? "Notifications are blocked in your browser settings. Add reminders to your calendar instead."
          : "Saheli reminds you on this phone. On iPhone, add Saheli to your home screen first, or use Calendar."}
      </p>
    </section>
  );
}

/* ---------------- Blood pressure ---------------- */

const LEVEL_TONE: Record<BPLevel, "ok" | "warn" | "danger" | "muted"> = {
  normal: "ok",
  low: "muted",
  raised: "warn",
  high: "danger",
  severe: "danger",
};
const LEVEL_WORD: Record<BPLevel, string> = { normal: "Healthy", low: "Low", raised: "A little high", high: "High", severe: "Very high" };

export function BloodPressure() {
  const list = useProfileStore((s) => s.bp) ?? [];
  const sorted = [...list].sort((a, b) => b.at.localeCompare(a.at));
  const latest = sorted[0];
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [pulse, setPulse] = useState("");
  const [error, setError] = useState("");

  function save() {
    const s = Number(sys);
    const d = Number(dia);
    const p = pulse ? Number(pulse) : undefined;
    if (!(s >= 60 && s <= 260) || !(d >= 30 && d <= 160) || d >= s) {
      setError("Check the numbers: the top one (systolic) is bigger, like 120 over 80.");
      return;
    }
    setError("");
    updateData((st) => ({ bp: [...(st.bp ?? []), { id: newId(), at: nowISO(), sys: s, dia: d, pulse: p && p > 20 && p < 250 ? p : undefined }] }));
    setSys("");
    setDia("");
    setPulse("");
  }

  const level = latest ? bpLevel(latest.sys, latest.dia) : null;

  return (
    <section className="card">
      <CardHead icon={HeartPulse} title="Blood pressure" right={latest && `${list.length} readings`} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Top (systolic)">
              <input className="input tabular" inputMode="numeric" value={sys} onChange={(e) => setSys(e.target.value.replace(/\D/g, ""))} placeholder="120" />
            </Field>
            <Field label="Bottom (diastolic)">
              <input className="input tabular" inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, ""))} placeholder="80" />
            </Field>
            <Field label="Pulse">
              <input className="input tabular" inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value.replace(/\D/g, ""))} placeholder="Optional" />
            </Field>
          </div>
          {error && <p className="mt-2 text-sm text-[#9B1B30]">{error}</p>}
          <button type="button" className="btn btn-primary mt-3" onClick={save} disabled={!sys || !dia}>
            Save reading
          </button>
          <p className="mt-3 text-sm text-ink-soft">
            Sit quietly for 5 minutes, arm resting at heart level. 140/90 or more: call your doctor today. 160/110 or more: go to hospital now.
          </p>
        </div>
        <div>
          {latest && level ? (
            <>
              <p className="label">Latest</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display text-[2.6rem] leading-none text-ink tabular">
                  {latest.sys}/{latest.dia}
                </span>
                <Pill tone={LEVEL_TONE[level]}>{LEVEL_WORD[level]}</Pill>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {timeLabel(latest.at)}
                {latest.pulse ? ` · pulse ${latest.pulse}` : ""}
              </p>
              <div className="mt-3">
                {level === "severe" || level === "high" ? (
                  <AlertBox tone="danger" icon={TriangleAlert} title={BP_MESSAGE[level].title}>
                    {BP_MESSAGE[level].body}
                  </AlertBox>
                ) : (
                  <AlertBox tone={level === "raised" ? "warn" : "calm"} title={BP_MESSAGE[level].title}>
                    {BP_MESSAGE[level].body}
                  </AlertBox>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-surface-2 p-4 text-[15px] text-ink">
              No readings yet. Log one after each check-up, or at home if your doctor asks you to.
            </div>
          )}
        </div>
      </div>
      {sorted.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {sorted.slice(0, 8).map((r) => {
            const l = bpLevel(r.sys, r.dia);
            return (
              <li key={r.id} className="flex items-center gap-3 py-2.5 text-[15px]">
                <span className="w-[76px] font-semibold text-ink tabular">
                  {r.sys}/{r.dia}
                </span>
                <span className="min-w-0 flex-1 text-sm text-ink-soft">{timeLabel(r.at)}</span>
                <Pill tone={LEVEL_TONE[l]}>{LEVEL_WORD[l]}</Pill>
                <button
                  type="button"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                  aria-label={`Remove reading ${r.sys}/${r.dia}`}
                  onClick={() => updateData((st) => ({ bp: (st.bp ?? []).filter((x) => x.id !== r.id) }))}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Healthy weight gain ---------------- */

export function WeightGain({ dueDate }: { dueDate: string }) {
  const profile = useProfileStore((s) => s.profile);
  const pre = useProfileStore((s) => s.pregnancy?.prePregnancyKg);
  const weights = useProfileStore((s) => s.pregWeights) ?? {};
  const units = profile?.units ?? "metric";
  const unit = weightUnit(units);
  const [preIn, setPreIn] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [todayIn, setTodayIn] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(600);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [pre, profile?.heightCm]);

  if (!profile || profile.safety.eatingConcerns) return null;

  const today = todayISO();
  const height = profile.heightCm;
  const fmt = (kg: number) => kgTo(units, kg).toFixed(1);

  if (!pre || !height) {
    return (
      <section className="card">
        <CardHead icon={Scale} title="Healthy weight gain" />
        <p className="text-[15px] text-ink">
          Healthy gain depends on your weight before pregnancy. Add it once and Saheli shows your range.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={`Weight before pregnancy (${unit})`}>
            <input className="input tabular" inputMode="decimal" value={preIn} onChange={(e) => setPreIn(e.target.value)} placeholder={units === "imperial" ? "128" : "58"} />
          </Field>
          {!height && (
            <Field label="Height (cm)">
              <input className="input tabular" inputMode="numeric" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="160" />
            </Field>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const kg = toKg(units, Number(preIn));
              const h = height ?? Number(heightIn);
              if (!(kg > 30 && kg < 250) || !(h > 120 && h < 220)) return;
              if (!height) setStage({ heightCm: h });
              updatePregnancy({ prePregnancyKg: Math.round(kg * 10) / 10 });
            }}
          >
            Save
          </button>
        </div>
      </section>
    );
  }

  const range = gainRange(bmiOf(pre, height));
  const lmp = weekStart(dueDate, 0);
  const points = Object.entries(weights)
    .map(([d, kg]) => ({ week: daysBetween(lmp, d) / 7, gain: kg - pre, d, kg }))
    .filter((p) => p.week >= 0 && p.week <= 42)
    .sort((a, b) => a.week - b.week);
  const last = points[points.length - 1];
  const nowWeek = pregnancyWeek(dueDate, today).week;
  const [lo, hi] = gainRangeAtWeek(range, last ? last.week : nowWeek);
  const status = !last ? null : last.gain < lo - 0.3 ? "under" : last.gain > hi + 0.3 ? "over" : "in";

  // chart
  const W = Math.max(280, boxW);
  const H = W < 480 ? 200 : 240;
  const pad = { l: 34, r: 12, t: 12, b: 26 };
  const maxY = Math.max(range.maxKg + 2, ...points.map((p) => p.gain + 1));
  const minY = Math.min(-1, ...points.map((p) => p.gain - 1));
  const x = (w: number) => pad.l + (w / 40) * (W - pad.l - pad.r);
  const y = (g: number) => pad.t + ((maxY - g) / (maxY - minY)) * (H - pad.t - pad.b);
  const weeks = Array.from({ length: 41 }, (_, i) => i);
  const band =
    weeks.map((w) => `${x(w)},${y(gainRangeAtWeek(range, w)[1])}`).join(" ") +
    " " +
    [...weeks].reverse().map((w) => `${x(w)},${y(gainRangeAtWeek(range, w)[0])}`).join(" ");
  const ticks = [0, 5, 10, 15, 20].filter((t) => t <= maxY);

  function saveToday() {
    const v = toKg(units, Number(todayIn));
    if (!(v > 30 && v < 250)) return;
    updateData((s) => ({ pregWeights: { ...(s.pregWeights ?? {}), [today]: Math.round(v * 10) / 10 } }));
    setTodayIn("");
  }

  return (
    <section className="card">
      <CardHead
        icon={Scale}
        title="Healthy weight gain"
        right={<span className="tabular">Before pregnancy: {fmt(pre)} {unit}</span>}
      />
      <p className="text-[15px] text-ink">
        For a pre-pregnancy BMI of {range.label}, a healthy total gain is{" "}
        <span className="font-semibold tabular">
          {fmt(range.minKg)} to {fmt(range.maxKg)} {unit}
        </span>{" "}
        by 40 weeks.
      </p>
      {last && (
        <p className="mt-1 text-[15px] text-ink-soft">
          You&apos;ve gained <span className="font-semibold text-ink tabular">{fmt(last.gain)} {unit}</span> by week {Math.floor(last.week)}. The usual range by now is{" "}
          <span className="tabular">
            {fmt(lo)} to {fmt(hi)} {unit}
          </span>
          .{" "}
          {status === "in"
            ? "You're right where you'd expect."
            : "Every body is different. Talk to your doctor at your next visit."}
        </p>
      )}
      <div ref={boxRef} className="mt-4 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label="Weight gain by week, with the healthy range">
        <defs>
          <linearGradient id="gain-band" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="4 4" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-soft)">
              {Math.round(kgTo(units, t))}
            </text>
          </g>
        ))}
        <polygon points={band} fill="url(#gain-band)" />
        {points.length > 1 && (
          <polyline
            points={points.map((p) => `${x(p.week)},${y(p.gain)}`).join(" ")}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points.map((p) => (
          <circle key={p.d} cx={x(p.week)} cy={y(p.gain)} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
        ))}
        {last && (
          <text x={Math.min(x(last.week), W - 60)} y={y(last.gain) - 10} fontSize="12" fontWeight="700" fill="var(--primary-ink)">
            +{fmt(last.gain)} {unit}
          </text>
        )}
        <line x1={x(nowWeek)} x2={x(nowWeek)} y1={pad.t} y2={H - pad.b} stroke="var(--ink-soft)" strokeOpacity="0.35" />
        {[0, 13, 28, 40].map((w) => (
          <text key={w} x={x(w)} y={H - 8} textAnchor={w === 0 ? "start" : w === 40 ? "end" : "middle"} fontSize="11" fill="var(--ink-soft)">
            {w === 0 ? "Week 0" : `${w}`}
          </text>
        ))}
      </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-accent/40" /> Healthy range</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-primary" /> Your weight</span>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <Field label={`Today's weight (${unit})`} className="w-40">
          <input className="input tabular" inputMode="decimal" value={todayIn} onChange={(e) => setTodayIn(e.target.value)} placeholder={units === "imperial" ? "e.g. 144" : "e.g. 65.5"} />
        </Field>
        <button type="button" className="btn btn-primary" onClick={saveToday} disabled={!todayIn}>
          Save
        </button>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Ranges are for one baby (US Institute of Medicine). Weighing once every week or two is plenty.
      </p>
    </section>
  );
}
