"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Droplet } from "lucide-react";
import { WeightCalendarSection } from "@/components/weight/WeightCalendar";
import {
  cycleGaps,
  cycleInfo,
  dayKind,
  learnedCycleLength,
  PHASE_LABEL,
  PHASE_VAR,
  type DayKind,
  type Phase,
} from "@/lib/cycle";
import { cycleIcs, monthGrid, monthLabel, noticeCycle, shiftMonth, WEEKDAYS } from "@/lib/cycleCalendar";
import { addDays, formatShort, parseISODate, todayISO } from "@/lib/dates";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import type { Flow } from "@/lib/types";

const FLOWS: { id: Flow; label: string }[] = [
  { id: "spotting", label: "Spotting" },
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
];

const SYMPTOMS = ["Cramps", "Bloating", "Headache", "Fatigue", "Cravings", "Acne", "Back pain", "Tender breasts", "Mood swings", "Nausea"];

const BODY_NOW: Record<Phase, { title: string; text: string }> = {
  period: {
    title: "Period",
    text: "Oestrogen and progesterone are at their lowest, so the lining of your womb sheds. Energy dips, and cramps come from the womb tightening. Warmth, rest and iron-rich food help.",
  },
  follicular: {
    title: "Follicular",
    text: "Oestrogen rises as an egg gets ready. Most women feel energy, mood and focus lift. Your body handles harder workouts and carbs well now.",
  },
  ovulation: {
    title: "Ovulation window",
    text: "A rise in LH releases an egg. You may notice clear, stretchy discharge, a small one-sided twinge and feeling more social. This is when pregnancy is most likely.",
  },
  luteal: {
    title: "Luteal",
    text: "Progesterone rises, which warms your body slightly and slows digestion. Appetite grows by about 100 calories a day, and some women feel bloated or low before their period.",
  },
};

const SEE_DOCTOR = [
  "No period for 3 months (and you're not pregnant)",
  "Bleeding that soaks a pad or tampon every hour for a few hours",
  "Periods lasting more than 7 days",
  "Pain that painkillers don't help, or that stops your day",
  "Bleeding between periods or after sex",
  "Cycles shorter than 21 or longer than 35 days, again and again",
];

const KIND_STYLE: Record<Exclude<DayKind, null>, { bg: string; text: string; border?: string }> = {
  period: { bg: "var(--ph-period)", text: "#fff" },
  predicted: { bg: "transparent", text: "var(--ph-period)", border: "2px dashed var(--ph-period)" },
  follicular: { bg: "color-mix(in srgb, var(--ph-follicular) 18%, var(--surface))", text: "var(--ink)" },
  ovulation: { bg: "color-mix(in srgb, var(--ph-ovulation) 24%, var(--surface))", text: "var(--ink)" },
  luteal: { bg: "color-mix(in srgb, var(--ph-luteal) 18%, var(--surface))", text: "var(--ink)" },
};

export function CycleView() {
  const profile = useProfileStore((s) => s.profile);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const dayLogs = useProfileStore((s) => s.dayLogs);
  const today = todayISO();
  const now = parseISODate(today);
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(today);
  if (!profile) return null;

  const usesCycle = !["pregnancy", "postpartum", "menopause"].includes(profile.stage);
  const info = cycleInfo(periodStarts, today, profile.cycleLength, profile.periodLength);
  const L = learnedCycleLength(periodStarts, profile.cycleLength);
  const P = profile.periodLength;
  const heavyDays = Object.entries(dayLogs).filter(([d, l]) => d >= addDays(today, -180) && l.flow === "heavy").length;
  const recentPeriods = Math.max(1, periodStarts.filter((d) => d >= addDays(today, -180)).length);
  const noticed = noticeCycle(periodStarts, P, heavyDays / recentPeriods);
  const history = [...periodStarts].sort().reverse();
  const gaps = cycleGaps(periodStarts);

  function downloadIcs() {
    if (!info) return;
    const blob = new Blob([cycleIcs(info.nextPeriod, L, P)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saheli-cycle.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-5">
      {!usesCycle && (
        <div className="panel text-[15px] text-ink">
          {profile.stage === "pregnancy"
            ? "While you're pregnant there are no periods to track. Your week-by-week guide is in Pregnancy."
            : profile.stage === "postpartum"
              ? "Periods can take weeks or months to come back after birth, longer if you breastfeed. Log the day one starts and Saheli will pick up from there."
              : "If your periods have stopped, you don't need to track them. If you still get some, log them here and Saheli will keep an eye on the pattern."}
          {profile.stage === "pregnancy" && (
            <Link href="/app/pregnancy" className="ml-1 font-semibold text-primary-ink hover:underline">
              Open Pregnancy
            </Link>
          )}
        </div>
      )}

      {/* Stat tiles */}
      {info && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Cycle day" value={String(info.day)} sub={PHASE_LABEL[info.phase]} dot={PHASE_VAR[info.phase]} />
          <Stat label="Next period" value={formatShort(info.nextPeriod)} sub={`in ${info.daysToNext} day${info.daysToNext === 1 ? "" : "s"}`} />
          <Stat
            label="Ovulation window"
            value={`${formatShort(info.ovulation.start)} – ${formatShort(info.ovulation.end)}`}
            sub="Estimated"
            small
          />
          <Stat
            label="Average cycle"
            value={`${info.averageLength ?? L} days`}
            sub={info.loggedCycles ? `From ${info.loggedCycles} logged cycle${info.loggedCycles === 1 ? "" : "s"}` : "From what you told us"}
          />
        </div>
      )}

      {/* Calendar and day panel */}
      <div className="grid items-start gap-5 lg:grid-cols-[55fr_45fr]">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-display text-[1.35rem] text-ink" aria-live="polite">
              {monthLabel(ym.year, ym.month)}
            </h2>
            <button
              type="button"
              onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))}
              className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1.5" role="grid">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-[11px] font-semibold tracking-[0.06em] text-ink-soft" role="columnheader">
                {d}
              </div>
            ))}
            {monthGrid(ym.year, ym.month)
              .flat()
              .map((date, i) => {
                if (!date) return <div key={`e${i}`} />;
                const kind = usesCycle ? dayKind(periodStarts, date, today, L, P) : dayLogs[date]?.flow ? "period" : null;
                const st = kind ? KIND_STYLE[kind] : null;
                const isToday = date === today;
                const isSel = date === selected;
                return (
                  <div key={date} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setSelected(date)}
                      aria-pressed={isSel}
                      aria-label={`${formatShort(date)}${kind ? `, ${kind === "predicted" ? "predicted period" : kind === "period" ? "period" : PHASE_LABEL[kind]}` : ""}`}
                      className={`tabular grid h-10 w-10 place-items-center rounded-full text-sm font-medium transition-shadow sm:h-11 sm:w-11 ${
                        isSel ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : isToday ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""
                      }`}
                      style={{ background: st?.bg, color: st?.text ?? "var(--ink)", border: st?.border }}
                    >
                      {parseISODate(date).getDate()}
                    </button>
                  </div>
                );
              })}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
            {[
              ["Period", "var(--ph-period)", false],
              ["Predicted", "var(--ph-period)", true],
              ["Follicular", "var(--ph-follicular)", false],
              ["Ovulation", "var(--ph-ovulation)", false],
              ["Luteal", "var(--ph-luteal)", false],
            ].map(([label, color, dashed]) => (
              <li key={label as string} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded-full"
                  style={dashed ? { border: `2px dashed ${color}` } : { background: color as string }}
                  aria-hidden="true"
                />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <DayPanel key={selected} date={selected} today={today} />
      </div>

      {/* Saheli noticed */}
      {usesCycle && (
        <section className="card">
          <h2 className="font-display text-[1.45rem] text-ink">Saheli noticed</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] p-4">
              <p className="label">Usually normal</p>
              <ul className="mt-2 space-y-1.5 text-[15px] text-ink">
                {noticed.normal.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-[#FEF3C7] p-4 text-[#5b3a06]">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.09em] text-[#92400E]">Worth a check</p>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                {noticed.check.length ? noticed.check.map((t) => <li key={t}>{t}</li>) : <li>Nothing stands out right now.</li>}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-soft">Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.</p>
        </section>
      )}

      <WeightCalendarSection />

      {/* Body now, and when to see a doctor */}
      {info && (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="card">
            <p className="label">What&apos;s happening in your body</p>
            <h2 className="font-display text-[1.45rem] text-ink">{BODY_NOW[info.phase].title}</h2>
            <p className="mt-2 text-[15px] text-ink-soft">{BODY_NOW[info.phase].text}</p>
          </section>
          <section className="card">
            <p className="label">When to see a doctor</p>
            <ul className="mt-2 space-y-1.5 text-[15px] text-ink">
              {SEE_DOCTOR.map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* History and calendar export */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="card">
          <h2 className="font-display text-[1.45rem] text-ink">Period history</h2>
          {history.length ? (
            <ul className="mt-3">
              {history.slice(0, 8).map((d, i) => {
                const len = i === 0 ? null : gaps[gaps.length - i];
                return (
                  <li key={d} className="flex items-center justify-between border-t border-line py-2.5 first:border-t-0">
                    <span className="flex items-center gap-2.5 text-ink">
                      <Droplet size={16} className="text-ph-period" aria-hidden="true" />
                      {parseISODate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="tabular text-sm text-ink-soft">{len ? `${len}-day cycle` : "Current cycle"}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">No periods logged yet. Pick the day your last period started in the calendar.</p>
          )}
        </section>
        <section className="card flex flex-col items-start">
          <h2 className="font-display text-[1.45rem] text-ink">Add your cycle to your calendar</h2>
          <p className="mt-1.5 flex-1 text-[15px] text-ink-soft">
            Your next 6 predicted periods as all-day events, for your phone&apos;s calendar. Only dates, nothing else.
          </p>
          <button type="button" onClick={downloadIcs} disabled={!info} className="btn btn-secondary mt-4">
            <CalendarPlus size={18} /> Download calendar file
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, dot, small }: { label: string; value: string; sub: string; dot?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className={`font-display tabular mt-1 leading-tight text-ink ${small ? "text-[1.2rem] sm:text-[1.35rem]" : "text-[1.6rem]"}`}>
        {value}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
        {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden="true" />}
        {sub}
      </p>
    </div>
  );
}

function DayPanel({ date, today }: { date: string; today: string }) {
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const log = useProfileStore((s) => s.dayLogs[date]);
  const [flow, setFlow] = useState<Flow | undefined>(log?.flow);
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? []);
  const [saved, setSaved] = useState(false);
  const isStart = periodStarts.includes(date);
  const future = date > today;

  function togglePeriodStart() {
    const s = activeProfileStore().getState();
    s.setPeriodStarts(isStart ? periodStarts.filter((d) => d !== date) : [...periodStarts, date]);
    if (!isStart && !flow) setFlow("medium");
  }

  function save() {
    activeProfileStore().getState().logDay(date, { flow, symptoms });
    setSaved(true);
  }

  return (
    <section className="card">
      <p className="label">{date === today ? "Today" : future ? "Coming up" : "Looking back"}</p>
      <h2 className="font-display text-[1.6rem] leading-tight text-ink">
        {parseISODate(date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </h2>
      {future ? (
        <p className="mt-3 text-[15px] text-ink-soft">You can log this day when it comes.</p>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePeriodStart}
            aria-pressed={isStart}
            className={`btn mt-4 w-full ${isStart ? "btn-primary" : "btn-secondary"}`}
          >
            <Droplet size={17} /> {isStart ? "Period started this day" : "My period started this day"}
          </button>
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold text-ink">Flow</legend>
            <div className="flex flex-wrap gap-2">
              {FLOWS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={flow === f.id}
                  onClick={() => {
                    setFlow(flow === f.id ? undefined : f.id);
                    setSaved(false);
                  }}
                  className="chip"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold text-ink">Symptoms</legend>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setSymptoms(on ? symptoms.filter((x) => x !== s) : [...symptoms, s]);
                      setSaved(false);
                    }}
                    className="chip"
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-5 flex items-center gap-3">
            <button type="button" onClick={save} className="btn btn-primary">
              Save
            </button>
            {saved && (
              <p className="text-sm text-accent-ink" role="status">
                Saved
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
