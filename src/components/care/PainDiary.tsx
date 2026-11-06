"use client";

import { useState } from "react";
import { Check, ChevronDown, Trash2, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { endoFlag, PAIN_HELPED, PAIN_PLACES, painColour, painWord } from "@/lib/care";
import type { PainLog } from "@/lib/careTypes";
import { addDays, daysBetween, formatShort, todayISO } from "@/lib/dates";
import { activeProfileStore, useProfileStore } from "@/lib/store";

const NO_PAIN: PainLog[] = [];

export function PainDiaryPage() {
  const pain = useProfileStore((s) => s.pain ?? NO_PAIN);
  const starts = useProfileStore((s) => s.periodStarts);
  const periodLength = useProfileStore((s) => s.profile?.periodLength ?? 5);
  const today = todayISO();
  const flag = endoFlag(pain, starts, today, periodLength);

  return (
    <>
      <PageHeader
        eyebrow="PAIN DIARY"
        title="Your pain, taken seriously"
        lead="Period pain that stops your life isn't something to just put up with. Diagnosing endometriosis takes 4 to 12 years on average (WHO). A diary helps your doctor see the pattern sooner."
      />
      <div className="flex flex-col gap-5">
        {flag.show && <FlagBox reasons={flag.reasons} severeCycles={flag.severeCycles} />}
        <TodayPain />
        <PainChart pain={pain} starts={starts} periodLength={periodLength} today={today} />
        <Entries pain={pain} />
        <p className="text-sm text-ink-soft">Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.</p>
      </div>
    </>
  );
}

function FlagBox({ reasons, severeCycles }: { reasons: string[]; severeCycles: number }) {
  const list = reasons.length ? reasons : [`Severe pain (7 or more) in ${severeCycles} different cycles`];
  return (
    <section className="rounded-[20px] border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-5 text-[#5c1020] sm:p-6" role="alert" aria-labelledby="endo-flag">
      <h2 id="endo-flag" className="flex items-start gap-2 text-[17px] font-semibold leading-snug">
        <TriangleAlert size={19} className="mt-[3px] shrink-0" aria-hidden />
        Your diary shows signs worth checking for endometriosis or adenomyosis
      </h2>
      <p className="mt-1 text-sm">This is a flag, not a diagnosis. In the last 4 months:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-[15px]">
        {list.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-4 font-semibold">What to ask a gynaecologist</p>
      <ul className="mt-1 list-disc space-y-1 pl-6 text-[15px]">
        <li>&ldquo;Could this be endometriosis or adenomyosis?&rdquo;</li>
        <li>&ldquo;Can I have a pelvic ultrasound (or MRI) by someone experienced in endometriosis?&rdquo;</li>
        <li>&ldquo;What can I take for the pain, and are there hormonal treatments that would help?&rdquo;</li>
        <li>&ldquo;If tests are clear, could I be referred to a specialist?&rdquo;</li>
      </ul>
      <p className="mt-3 text-sm">Take your Doctor summary from Health. It includes this diary.</p>
    </section>
  );
}

function TodayPain() {
  const today = todayISO();
  const existing = useProfileStore((s) => (s.pain ?? NO_PAIN).find((p) => p.date === today));
  const [score, setScore] = useState(existing?.score ?? 0);
  const [places, setPlaces] = useState<string[]>(existing?.places ?? []);
  const [helped, setHelped] = useState<string[]>(existing?.helped ?? []);
  const [missed, setMissed] = useState(existing?.missedDay ?? false);
  const [saved, setSaved] = useState(false);
  const colour = painColour(score);

  const toggle = (list: string[], set: (v: string[]) => void, v: string, only?: string) => {
    setSaved(false);
    if (list.includes(v)) return set(list.filter((x) => x !== v));
    // "Nothing helped" can't sit alongside things that helped.
    if (only && v === only) return set([v]);
    set([...list.filter((x) => x !== only), v]);
  };

  function save() {
    const entry: PainLog = { date: today, score, places, helped, missedDay: missed };
    activeProfileStore().setState((s) => ({ pain: [...(s.pain ?? []).filter((p) => p.date !== today), entry].sort((a, b) => a.date.localeCompare(b.date)) }) as never);
    setSaved(true);
  }

  return (
    <section className="card" aria-labelledby="pain-today">
      <h2 id="pain-today" className="font-display text-[1.6rem] leading-tight text-ink">
        How bad is the pain today?
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <p className="w-20 shrink-0 text-center font-display text-[48px] leading-none tabular" style={{ color: score === 0 ? "var(--ink-soft)" : colour }} aria-hidden>
          {score}
        </p>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={score}
            onChange={(e) => {
              setScore(Number(e.target.value));
              setSaved(false);
            }}
            className="h-2 w-full"
            style={{ accentColor: score === 0 ? "var(--primary)" : colour }}
            aria-label="Pain from 0 to 10"
            aria-valuetext={`${score}, ${painWord(score)}`}
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
          <p className="mt-1 font-semibold text-ink" aria-live="polite">
            {painWord(score)}
          </p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-ink">Where?</legend>
        <div className="flex flex-wrap gap-2">
          {PAIN_PLACES.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={places.includes(p)} onClick={() => toggle(places, setPlaces, p)}>
              {p}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold text-ink">What helped?</legend>
        <div className="flex flex-wrap gap-2">
          {PAIN_HELPED.map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={helped.includes(p)} onClick={() => toggle(helped, setHelped, p, "Nothing helped")}>
              {p}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 flex cursor-pointer items-center gap-3 text-[15px] text-ink">
        <input
          type="checkbox"
          className="h-5 w-5 accent-[var(--primary)]"
          checked={missed}
          onChange={(e) => {
            setMissed(e.target.checked);
            setSaved(false);
          }}
        />
        It stopped me from work, college or plans today
      </label>
      <div className="mt-5 flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={save}>
          {existing ? "Update today" : "Save today"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-accent-ink" role="status">
            <Check size={16} aria-hidden /> Saved
          </span>
        )}
      </div>
      {score >= 8 && (
        <p className="mt-4 rounded-2xl bg-surface-2 p-3 text-sm text-ink">
          Pain this strong is worth a doctor&apos;s visit. Go to urgent care now if it came on suddenly, is on one side with fever or fainting, or you could be pregnant.
        </p>
      )}
    </section>
  );
}

function PainChart({ pain, starts, periodLength, today }: { pain: PainLog[]; starts: string[]; periodLength: number; today: string }) {
  const days = Array.from({ length: 60 }, (_, i) => addDays(today, i - 59));
  const byDate = new Map(pain.map((p) => [p.date, p]));
  const isPeriod = (d: string) => starts.some((s) => {
    const n = daysBetween(s, d);
    return n >= 0 && n < periodLength;
  });
  const W = 600;
  const H = 150;
  const step = W / 60;
  const bw = step * 0.62;
  const logged = days.filter((d) => byDate.has(d)).length;

  return (
    <section className="card" aria-labelledby="pain-chart">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pain-chart" className="font-display text-[1.45rem] text-ink">
          Last 60 days
        </h2>
        <span className="text-sm text-ink-soft">{logged} days logged</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="h-auto w-full" role="img" aria-label={`Pain over the last 60 days, ${logged} days logged`}>
        {days.map((d, i) =>
          isPeriod(d) ? <rect key={`p${d}`} x={i * step} y={0} width={step} height={H} fill="var(--ph-period)" opacity={0.18} /> : null,
        )}
        {[5, 10].map((v) => (
          <line key={v} x1={0} x2={W} y1={H - (v / 10) * H} y2={H - (v / 10) * H} stroke="var(--line)" strokeDasharray="4 4" />
        ))}
        {days.map((d, i) => {
          const p = byDate.get(d);
          if (!p) return null;
          const h = Math.max(3, (p.score / 10) * H);
          return (
            <rect key={d} x={i * step + (step - bw) / 2} y={H - h} width={bw} height={h} rx={2} fill={painColour(p.score)}>
              <title>
                {formatShort(d)}: {p.score} of 10, {painWord(p.score).toLowerCase()}
              </title>
            </rect>
          );
        })}
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--line)" />
      </svg>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-soft">
        <span>{formatShort(days[0])}</span>
        <span>Today</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <Legend colour="#F4B6CF" label="Mild (1-3)" />
        <Legend colour="#E0679A" label="Moderate (4-6)" />
        <Legend colour="#9B1B30" label="Severe (7+)" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "var(--ph-period)", opacity: 0.3 }} aria-hidden /> Period days
        </span>
      </div>
    </section>
  );
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm" style={{ background: colour }} aria-hidden /> {label}
    </span>
  );
}

function Entries({ pain }: { pain: PainLog[] }) {
  const list = [...pain].sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) return null;
  return (
    <details className="card group">
      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-[1.35rem] text-ink">All entries ({list.length})</span>
        <ChevronDown size={20} className="text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {list.map((p) => (
          <li key={p.date} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-[1.05rem] text-white tabular" style={{ background: p.score ? painColour(p.score) : "var(--ink-soft)" }}>
              {p.score}
            </span>
            <span className="min-w-0 flex-1 text-[15px]">
              <span className="block font-semibold text-ink">
                {formatShort(p.date)} · {painWord(p.score)}
                {p.missedDay ? " · missed the day" : ""}
              </span>
              <span className="block text-sm text-ink-soft">
                {[p.places.join(", "), p.helped.length ? `Helped: ${p.helped.join(", ")}` : ""].filter(Boolean).join(" · ") || "No details"}
              </span>
            </span>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
              onClick={() => activeProfileStore().setState((s) => ({ pain: (s.pain ?? []).filter((x) => x.date !== p.date) }) as never)}
              aria-label={`Delete the entry for ${formatShort(p.date)}`}
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
