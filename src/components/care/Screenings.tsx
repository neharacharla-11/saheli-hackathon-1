"use client";

import { useState } from "react";
import { CalendarCheck, Check, HeartHandshake, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { forAge, SCREENINGS, screeningStatus, screeningSummary, STATUS_TEXT, daysSince, type Screening, type ScreeningState } from "@/lib/care";
import { formatShort, parseISODate, todayISO } from "@/lib/dates";
import { useMyDay } from "@/lib/myDay";
import { activeProfileStore, useProfileStore } from "@/lib/store";

const NO_DATES: Record<string, string> = {};
const NO_CHECKS: string[] = [];
const yearDate = (iso: string) => parseISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const PILL: Record<ScreeningState, string> = {
  "not-recorded": "bg-[#FDE2E2] text-[#9B1B30]",
  "due-now": "bg-[#FDE2E2] text-[#9B1B30]",
  "due-soon": "bg-[#FEF3C7] text-[#92400E]",
  "up-to-date": "bg-[color-mix(in_srgb,var(--accent)_25%,var(--surface))] text-accent-ink",
  "not-at-age": "bg-surface-2 text-ink-soft",
};

export function ScreeningsPage() {
  const age = useProfileStore((s) => s.profile?.age);
  const dates = useProfileStore((s) => s.screenings ?? NO_DATES);
  const [all, setAll] = useState(false);
  const today = todayISO();

  const summary = age ? screeningSummary(age, dates, today) : null;
  const list = SCREENINGS.filter((s) => all || !age || forAge(s, age));

  return (
    <>
      <PageHeader
        eyebrow="SCREENINGS"
        title="Checks for your age"
        lead={
          summary
            ? `At ${age}, ${summary.recommended} ${summary.recommended === 1 ? "check is" : "checks are"} recommended for you. ${summary.needAttention === 0 ? "You're up to date." : `${summary.needAttention} ${summary.needAttention === 1 ? "is" : "are"} due or not yet recorded.`}`
            : "The screenings that matter for you, and when they're due."
        }
      />
      <div className="flex flex-col gap-5">
        {!age && <AgeAsk />}
        <BreastCheck />
        <div className="grid gap-5 sm:grid-cols-2">
          {list.map((s, i) => (
            <ScreeningCard key={s.id} s={s} age={age} last={dates[s.id]} wide={i === list.length - 1 && list.length % 2 === 1} />
          ))}
        </div>
        {age && (
          <button type="button" className="self-start text-sm font-semibold text-primary-ink underline underline-offset-4" onClick={() => setAll((v) => !v)}>
            {all ? "Show only the checks for my age" : `Show every check (${SCREENINGS.length})`}
          </button>
        )}
        <p className="text-sm text-ink-soft">
          Guidelines differ a little between countries. Saheli explains, it doesn&apos;t prescribe. Your doctor may suggest checks sooner or more often.
        </p>
      </div>
    </>
  );
}

function AgeAsk() {
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  return (
    <form
      className="card flex flex-wrap items-end gap-3 border-2 border-[color-mix(in_srgb,var(--primary)_40%,transparent)]"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(v);
        if (!Number.isInteger(n) || n < 9 || n > 100) return setErr("Please type your age in years.");
        activeProfileStore().getState().updateProfile({ age: n });
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
        How old are you?
        <input className="input h-11 w-32" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} />
      </label>
      <button className="btn btn-primary" type="submit">
        Show my checks
      </button>
      <p className="w-full text-sm text-ink-soft">{err || "Saheli uses your age only to pick the right checks. It stays on your phone."}</p>
    </form>
  );
}

function BreastCheck() {
  const checks = useProfileStore((s) => s.breastChecks ?? NO_CHECKS);
  const { day, profile } = useMyDay();
  const today = todayISO();
  const since = daysSince(checks, today);
  const doneToday = checks.includes(today);
  const goodWeek = !!day && day >= 5 && day <= 12;
  const noPeriods = profile?.stage === "menopause" || profile?.stage === "pregnancy";

  function toggle() {
    activeProfileStore().setState((s) => {
      const cur = s.breastChecks ?? [];
      return { breastChecks: cur.includes(today) ? cur.filter((d) => d !== today) : [...cur, today].sort() } as never;
    });
  }

  return (
    <section className="card" aria-labelledby="breast-check">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label mb-1">EVERY MONTH</p>
          <h2 id="breast-check" className="flex items-center gap-2 font-display text-[1.6rem] leading-tight text-ink">
            <HeartHandshake size={21} className="shrink-0 text-primary-ink" aria-hidden />
            Monthly breast self-check
          </h2>
          <p className="mt-1 text-[15px] text-ink-soft">
            {since === null ? "No check logged yet." : since === 0 ? "Done today. Thank you for looking after yourself." : `Last check ${since} ${since === 1 ? "day" : "days"} ago (${formatShort(checks[checks.length - 1])}).`}{" "}
            {noPeriods ? "Pick the same day each month." : goodWeek ? "This week is a good time." : "Best a few days after your period ends."}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={doneToday}
          className={`btn shrink-0 ${doneToday ? "bg-accent-ink text-white" : "btn-primary"}`}
        >
          {doneToday ? <Check size={18} aria-hidden /> : <CalendarCheck size={18} aria-hidden />}
          {doneToday ? "Done today" : "I did it today"}
        </button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[1.3fr_1fr]">
        <ol className="grid gap-3 sm:grid-cols-2">
          {[
            ["Look", "In a mirror, arms down, then hands on hips, then arms up. Look for changes in shape, skin or nipples."],
            ["Feel lying down", "Right arm behind your head. Use the flat pads of 3 fingers of your left hand in small circles."],
            ["Cover everything", "From your collarbone to below your bra line, and into your armpit. Light, medium, then firm pressure."],
            ["Swap sides", "Then do the same on the left. It takes about 5 minutes. Get to know what's normal for you."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-surface-2 p-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-on-primary" aria-hidden>
                {i + 1}
              </span>
              <span className="text-[15px]">
                <span className="block font-semibold text-ink">{t}</span>
                <span className="text-ink-soft">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="rounded-2xl border border-[#92400E]/30 bg-[#FEF3C7] p-4 text-[#5f2b06]">
          <p className="flex items-start gap-2 font-semibold">
            <TriangleAlert size={17} className="mt-[3px] shrink-0" aria-hidden />
            See a doctor within 2 weeks if you notice
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
            <li>A new lump or thickening, in your breast or armpit</li>
            <li>Dimpling or puckering of the skin</li>
            <li>A nipple turning in</li>
            <li>Discharge or blood from a nipple</li>
            <li>A rash or crusting on the nipple or breast</li>
          </ul>
          <p className="mt-2 text-sm">Most lumps are not cancer, but every new one should be checked.</p>
        </div>
      </div>
    </section>
  );
}

function ScreeningCard({ s, age, last, wide }: { s: Screening; age?: number; last?: string; wide: boolean }) {
  const today = todayISO();
  const st = screeningStatus(s, age, last, today);
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(last ?? today);

  function set(v: string | null) {
    activeProfileStore().setState((cur) => {
      const next = { ...(cur.screenings ?? {}) };
      if (v) next[s.id] = v;
      else delete next[s.id];
      return { screenings: next } as never;
    });
    setEditing(false);
  }

  const range = s.maxAge ? `Ages ${s.minAge} to ${s.maxAge}` : s.minAge > 1 ? `From ${s.minAge}` : "All ages";

  return (
    <article className={`card flex flex-col ${wide ? "sm:col-span-2" : ""}`}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-[1.3rem] leading-tight text-ink">{s.name}</h2>
        <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ${PILL[st.state]}`}>{STATUS_TEXT[st.state]}</span>
      </div>
      <p className="text-[15px] text-ink-soft">{s.why}</p>
      <p className="mt-2 text-sm text-ink">
        <span className="font-semibold">{s.how}</span> · {range}
      </p>
      {s.note && <p className="mt-1 text-sm text-ink-soft">{s.note}</p>}
      <p className="mt-3 text-sm text-ink tabular">
        Last: {st.last ? yearDate(st.last) : "not recorded"}
        {st.next ? ` · Next: ${yearDate(st.next)}` : ""}
      </p>
      <div className="mt-auto pt-4">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="input h-10 w-auto" value={date} max={today} onChange={(e) => setDate(e.target.value)} aria-label={`When you last had: ${s.name}`} />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => date && set(date)}>
              Save
            </button>
            {last && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set(null)}>
                Clear
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            {last ? "Update date" : "I've had this"}
          </button>
        )}
      </div>
    </article>
  );
}
