"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, LineChart, Phone, TriangleAlert, HeartHandshake } from "lucide-react";
import { formatShort, todayISO } from "@/lib/dates";
import { PHASE_LABEL, PHASE_VAR } from "@/lib/cycle";
import { COUNTRIES, helpFor, OTHER_COUNTRY, telLink } from "@/lib/helplines";
import { lastDays, patternSentences, PMDD_QUESTIONS, PMDD_SCALE, scorePmdd, statsByPhase } from "@/lib/mind";
import type { PmddCheck } from "@/lib/mindTypes";
import { useProfileStore } from "@/lib/store";
import { AlertBox, CardHead } from "@/components/pregnancy/ui";
import { useWidth } from "./useWidth";
import { updateData } from "@/components/pregnancy/data";

const CYCLE_STAGES = new Set(["cycle", "pcos", "ttc", "first-period"]);

/* ---------------- Helplines ---------------- */

const MIND_LINES: Record<string, { label: string; number: string; display?: string }[]> = {
  IN: [{ label: "KIRAN mental health", number: "18005990019", display: "1800-599-0019" }],
  AU: [
    { label: "Lifeline", number: "131114", display: "13 11 14" },
    { label: "Beyond Blue", number: "1300224636", display: "1300 22 4636" },
  ],
  GB: [{ label: "Shout (text SHOUT)", number: "85258", display: "85258" }],
};

export function MindHelplines() {
  const home = useProfileStore((s) => s.profile?.country);
  const [country, setCountry] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const code = country ?? home ?? "OTHER";
  const help = helpFor(code);
  const lines = [help.emergency, ...help.others, ...(MIND_LINES[code] ?? [])].filter(
    (l, i, all) => all.findIndex((x) => x.number === l.number) === i,
  );
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-ink">Talk to someone · {help.name}</p>
        <button type="button" className="text-sm font-semibold text-primary-ink underline underline-offset-2" onClick={() => setPicking((v) => !v)}>
          Change country
        </button>
      </div>
      {picking && (
        <div className="mb-3 flex flex-wrap gap-2">
          {[...COUNTRIES, OTHER_COUNTRY].map((c) => (
            <button
              key={c.code}
              type="button"
              className="chip chip-sm"
              aria-pressed={c.code === code}
              onClick={() => {
                setCountry(c.code);
                setPicking(false);
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        {lines.map((l) => (
          <li key={l.number}>
            <a href={telLink(l.number)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:bg-surface-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FDE2E2] text-danger">
                <Phone size={16} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-ink-soft">{l.label}</span>
                <span className="block font-semibold text-ink tabular">{l.display ?? l.number}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {code === "OTHER" && (
        <p className="mt-3 text-sm text-ink-soft">
          For a free, confidential helpline in your country, visit{" "}
          <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="font-semibold text-primary-ink underline">
            findahelpline.com
          </a>
          .
        </p>
      )}
    </div>
  );
}

/** Shown when she's had a run of heavy days, or wrote something that worries us. */
export function SupportCard({ urgent }: { urgent: boolean }) {
  const country = useProfileStore((s) => s.profile?.country);
  const help = helpFor(country);
  return (
    <section className={`rounded-[20px] bg-surface p-5 sm:p-6 ${urgent ? "border-2 border-[#9B1B30]/50" : "border-2 border-primary/40"}`} aria-labelledby="mind-support">
      <h2 id="mind-support" className="flex items-center gap-2 font-display text-[1.45rem] leading-tight text-ink">
        <HeartHandshake size={20} className="shrink-0 text-primary-ink" aria-hidden />
        {urgent ? "Please talk to someone right now" : "You've had a few heavy days"}
      </h2>
      <div className="mt-3">
        {urgent ? (
          <AlertBox tone="danger" icon={TriangleAlert} title="You don't have to carry this alone">
            If you might hurt yourself, call {help.emergency.number} now or go to the nearest hospital. Then tell someone you trust today: a friend, family or your doctor.
            <a href={telLink(help.emergency.number)} className="btn mt-3 flex w-full bg-danger text-white hover:brightness-105 sm:inline-flex sm:w-auto">
              <Phone size={16} aria-hidden /> Call {help.emergency.number}
            </a>
          </AlertBox>
        ) : (
          <p className="text-[15px] text-ink">
            Feeling low, overwhelmed or stressed for a few days in a row is hard. Talk to someone you trust, rest where you can, and if it lasts 2 weeks or more, call your doctor. Help works.
          </p>
        )}
      </div>
      <div className="mt-5 border-t border-line pt-5">
        <MindHelplines />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/companion" className="btn btn-secondary btn-sm">
          Talk it through
        </Link>
      </div>
    </section>
  );
}

/* ---------------- PMDD check ---------------- */

export function PmddCard() {
  const checks = useProfileStore((s) => s.pmdd) ?? [];
  const last = [...checks].sort((a, b) => b.date.localeCompare(a.date))[0];
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => Array(PMDD_QUESTIONS.length).fill(undefined));
  const [interferes, setInterferes] = useState<boolean | null>(null);
  const complete = answers.every((a) => a !== undefined) && interferes !== null;

  function save() {
    if (!complete) return;
    const check: PmddCheck = { date: todayISO(), answers: answers as number[], interferes: !!interferes };
    updateData((s) => ({ pmdd: [...(s.pmdd ?? []).filter((c) => c.date !== check.date), check] }));
    setOpen(false);
  }

  const result = last ? scorePmdd(last.answers, last.interferes) : null;

  return (
    <section className="card">
      <CardHead
        icon={ClipboardCheck}
        label="PMDD check"
        title="How hard is the week before your period?"
        right={last ? `Last check: ${formatShort(last.date)}` : undefined}
      />
      {!open && (
        <>
          {result ? (
            <div className="space-y-3">
              <AlertBox tone={result.level === "flag" ? "warn" : "calm"} title={result.title}>
                {result.body}
              </AlertBox>
              {result.hopelessSevere && (
                <AlertBox tone="danger" icon={TriangleAlert} title="Feeling hopeless before your period is worth a call">
                  Please tell your doctor. If you ever feel unsafe, use the helplines on this page.
                </AlertBox>
              )}
            </div>
          ) : (
            <p className="text-[15px] text-ink">
              Some women feel very low, angry or anxious in the days before their period, then better once it starts. 11 quick questions show whether it may be more than usual.
            </p>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-4"
            onClick={() => {
              setAnswers(Array(PMDD_QUESTIONS.length).fill(undefined));
              setInterferes(null);
              setOpen(true);
            }}
          >
            {last ? "Check again" : "Start the check"}
          </button>
        </>
      )}
      {open && (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">In the week before your period, over your last few cycles, how much have you had:</p>
          {PMDD_QUESTIONS.map((q, i) => (
            <fieldset key={q.text}>
              <legend className="mb-2 text-[15px] font-semibold text-ink">{q.text}</legend>
              <div className="flex flex-wrap gap-2">
                {PMDD_SCALE.map((label, v) => (
                  <button
                    key={label}
                    type="button"
                    className="chip chip-sm"
                    aria-pressed={answers[i] === v}
                    onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend className="mb-2 text-[15px] font-semibold text-ink">Do these get in the way of work, study or relationships?</legend>
            <div className="flex gap-2">
              <button type="button" className="chip chip-sm" aria-pressed={interferes === true} onClick={() => setInterferes(true)}>
                Yes
              </button>
              <button type="button" className="chip chip-sm" aria-pressed={interferes === false} onClick={() => setInterferes(false)}>
                No
              </button>
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary" onClick={save} disabled={!complete}>
              See my result
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <p className="mt-4 text-sm text-ink-soft">This check is a flag, not a diagnosis. Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.</p>
    </section>
  );
}

/* ---------------- Your patterns ---------------- */

export function PatternsCard() {
  const profile = useProfileStore((s) => s.profile);
  const logs = useProfileStore((s) => s.dayLogs);
  const starts = useProfileStore((s) => s.periodStarts);
  const [boxRef, boxW] = useWidth<HTMLElement>(520);
  if (!profile) return null;
  const today = todayISO();
  const usesCycle = CYCLE_STAGES.has(profile.stage) && starts.length > 0;
  const stats = usesCycle ? statsByPhase(logs, starts, profile.cycleLength, profile.periodLength) : [];
  const sentences = usesCycle ? patternSentences(stats) : [];
  const trend = lastDays(logs, today, 30);
  const moodDays = trend.filter((t) => t.mood !== null);
  const goodDays = moodDays.filter((t) => (t.mood as number) >= 4).length;

  if (moodDays.length < 3 && !sentences.length) {
    return (
      <section className="card">
        <CardHead icon={LineChart} title="Your patterns" />
        <p className="text-[15px] text-ink">Check in for a week or two and Saheli shows how your mood and energy move with your cycle and your life.</p>
      </section>
    );
  }

  // mood trend chart
  const W = boxW;
  const H = 150;
  const pad = { l: 8, r: 8, t: 12, b: 22 };
  const x = (i: number) => pad.l + (i / 29) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + ((5 - v) / 4) * (H - pad.t - pad.b);
  const pts = trend.map((t, i) => (t.mood !== null ? { x: x(i), y: y(t.mood) } : null));
  const segs: string[] = [];
  let cur: string[] = [];
  pts.forEach((p) => {
    if (p) cur.push(`${p.x},${p.y}`);
    else if (cur.length) {
      segs.push(cur.join(" "));
      cur = [];
    }
  });
  if (cur.length) segs.push(cur.join(" "));

  const energyBars = stats.filter((s) => s.energy !== null && s.days >= 3);

  return (
    <section className="card">
      <CardHead icon={LineChart} title="Your patterns" right="Last 6 months" />
      <ul className="space-y-2">
        {sentences.map((s) => (
          <li key={s} className="flex gap-2.5 text-[15px] text-ink">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            {s}
          </li>
        ))}
        <li className="flex gap-2.5 text-[15px] text-ink">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          In the last 30 days you felt good, calm or great on {goodDays} of the {moodDays.length} days you checked in.
        </li>
      </ul>
      <div className={`mt-5 grid grid-cols-1 gap-5 ${energyBars.length ? "md:grid-cols-[3fr_2fr]" : ""}`}>
        <figure ref={boxRef} className="min-w-0">
          <figcaption className="label mb-2">Mood · last 30 days</figcaption>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full" role="img" aria-label="Mood over the last 30 days">
            {[5, 3, 1].map((v) => (
              <line key={v} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="4 4" />
            ))}
            <defs>
              <linearGradient id="mood-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {segs.map((s) => (
              <g key={s}>
                <polygon
                  points={`${s.split(" ")[0].split(",")[0]},${y(1)} ${s} ${s.split(" ").slice(-1)[0].split(",")[0]},${y(1)}`}
                  fill="url(#mood-area)"
                />
                <polyline points={s} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ))}
            {pts.map((p, i) => p && <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.5" />)}
            <text x={pad.l} y={H - 6} fontSize="11" fill="var(--ink-soft)">
              {formatShort(trend[0].date)}
            </text>
            <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="11" fill="var(--ink-soft)">
              Today
            </text>
          </svg>
          <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
            <span>Higher is brighter</span>
            <span>Gaps are days without a check-in</span>
          </div>
        </figure>
        {energyBars.length > 0 && (
          <figure>
            <figcaption className="label mb-2">Energy by phase</figcaption>
            <ul className="space-y-2.5">
              {energyBars.map((s) => (
                <li key={s.phase} className="grid grid-cols-[96px_minmax(0,1fr)_32px] items-center gap-2 text-sm">
                  <span className="text-ink">{PHASE_LABEL[s.phase].replace(" window", "")}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full" style={{ width: `${((s.energy as number) / 5) * 100}%`, background: PHASE_VAR[s.phase] }} />
                  </span>
                  <span className="text-right text-ink-soft tabular">{(s.energy as number).toFixed(1)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-soft">Average energy, 1 to 5</p>
          </figure>
        )}
      </div>
    </section>
  );
}
