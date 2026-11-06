"use client";

import Link from "next/link";
import { useState } from "react";
import { Bone, CalendarHeart, HeartPulse, MessageCircleQuestion, Salad, Stethoscope, Sun } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { addDays, daysBetween, formatShort, todayISO } from "@/lib/dates";
import { mostBothersome, MRS_ITEMS, MRS_LEVELS, MRS_MAX, mrsBand, mrsTotal } from "@/lib/stageCare";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import type { MenoScore } from "@/lib/stageTypes";
import { DIAGNOSE, StagePicker, SymptomChips, TipCards, TrackCard, WarningSigns } from "./shared";

const NO_SCORES: MenoScore[] = [];

export function MenopausePage() {
  return (
    <>
      <PageHeader eyebrow="MENOPAUSE" title="This is a new chapter, not an ending" lead="Understand what's changing, feel better day to day, and protect your heart and bones for the years ahead." />
      <div className="flex flex-col gap-5">
        <LastPeriodCard />
        <TipCards
          tips={[
            {
              title: "Day to day",
              icon: Sun,
              points: [
                "Layers, cotton and a fan by the bed help with hot flushes and night sweats.",
                "Notice your triggers: hot drinks, spicy food, alcohol and stress are common ones.",
                "Keep a steady sleep time and a cool, dark room.",
                "Slow breathing for 5 minutes can shorten a flush.",
              ],
            },
            {
              title: "Long-term health",
              icon: Bone,
              points: [
                "Bones thin faster after menopause. Lift, carry and walk most days.",
                "Heart risk rises too. Keep an eye on blood pressure, sugar and cholesterol.",
                "Get your vitamin D and calcium checked.",
                "Keep up your screenings: mammogram, Pap, BP and sugar.",
              ],
            },
            {
              title: "Talk to your doctor about",
              icon: Stethoscope,
              points: [
                "Symptoms that get in the way of work, sleep or relationships.",
                "Whether hormone therapy or other treatments are right for you.",
                "A bone density scan if you have risk factors.",
                "Vaginal dryness or bladder leaks. These are common and treatable.",
              ],
            },
          ]}
        />
        <section className="card" aria-labelledby="meno-food">
          <h2 id="meno-food" className="mb-3 flex items-center gap-2 font-display text-[1.3rem] text-ink">
            <Salad size={19} className="text-primary-ink" aria-hidden />
            Food for this stage
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FoodTile title="Bones" text="Ragi, curd, paneer, til, almonds, leafy greens, and morning sun for vitamin D." />
            <FoodTile title="Heart" text="More dal, beans, oats, nuts, seeds and fish. Less salt, fried food and sugar." />
            <FoodTile title="Flushes and mood" text="Soy, tofu and flaxseed may ease flushes a little. Protein at every meal keeps energy steady." />
          </div>
          <Link href="/app/nourish" className="btn btn-secondary btn-sm mt-4">
            See meals on Nourish
          </Link>
        </section>
        <SymptomChips
          title="How are you feeling today?"
          options={["Hot flushes", "Night sweats", "Poor sleep", "Low mood", "Irritable", "Anxious", "Brain fog", "Joint pain", "Tired", "Vaginal dryness", "Bladder leaks", "Headache"]}
        />
        <SymptomScore />
        <Treatments />
        <TrackCard
          items={[
            { label: "Your periods", why: "Even irregular ones. 12 months without one means menopause.", href: "/app/cycle" },
            { label: "Your symptom score", why: "Once a week, to see if things are getting better." },
            { label: "Blood pressure and sugar", why: "Heart risk rises after menopause.", href: "/app/logs" },
            { label: "Screenings", why: "Mammogram, Pap, bone and heart checks.", href: "/app/screenings" },
          ]}
        />
        <WarningSigns
          signs={[
            "Any bleeding after 12 months without a period",
            "Very heavy periods, or bleeding between periods",
            "Chest pain, or a racing heart with breathlessness",
            "A new lump in your breast",
            "Feeling hopeless most days, or thoughts of harming yourself",
            "Sudden severe headache or weakness on one side",
          ]}
          footer="Bleeding after menopause always needs checking, even if it's a little. Call your doctor this week."
        />
        <p className="text-sm text-ink-soft">{DIAGNOSE}</p>
        <StagePicker />
      </div>
    </>
  );
}

function FoodTile({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <p className="label mb-1">{title}</p>
      <p className="text-[15px] text-ink">{text}</p>
    </div>
  );
}

function LastPeriodCard() {
  const starts = useProfileStore((s) => s.periodStarts);
  const today = todayISO();
  const last = [...starts].filter((d) => d <= today).sort().pop();
  const months = last ? Math.floor(daysBetween(last, today) / 30.4) : null;
  return (
    <section className="card flex flex-wrap items-center justify-between gap-3" aria-label="Your last period">
      <div className="flex items-start gap-3">
        <CalendarHeart size={20} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden />
        <p className="text-[15px] text-ink">
          {last ? (
            <>
              Last period logged: <span className="font-semibold">{formatShort(last)}</span>
              {months !== null && months >= 1 ? ` (${months} ${months === 1 ? "month" : "months"} ago)` : ""}. 12 months without a period means menopause.
              {months !== null && months >= 12 && <span className="text-ink-soft"> That&apos;s you now, so you&apos;re postmenopausal.</span>}
            </>
          ) : (
            <>
              No period logged. <span className="text-ink-soft">If it&apos;s been more than 12 months, you&apos;re postmenopausal. If you still bleed sometimes, log it on Cycle.</span>
            </>
          )}
        </p>
      </div>
      <Link href="/app/cycle" className="btn btn-ghost btn-sm text-primary-ink">
        Log a period
      </Link>
    </section>
  );
}

function SymptomScore() {
  const scores = useProfileStore((s) => s.menoScores ?? NO_SCORES);
  const today = todayISO();
  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const [open, setOpen] = useState(!latest);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const done = MRS_ITEMS.every((it) => draft[it.id] !== undefined);
  const due = !latest || daysBetween(latest.date, today) >= 7;

  function save() {
    if (!done) return;
    activeProfileStore().setState((s) => ({ menoScores: [...(s.menoScores ?? []).filter((x) => x.date !== today), { date: today, scores: draft }] }) as never);
    setOpen(false);
    setDraft({});
    window.requestAnimationFrame(() => document.getElementById("symptom-score")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const total = latest ? mrsTotal(latest) : 0;
  const band = mrsBand(total);
  const change = latest && first && first !== latest ? mrsTotal(latest) - mrsTotal(first) : null;
  const top = latest ? mostBothersome(latest) : [];
  const bandStyle =
    band.tone === "green"
      ? "bg-[color-mix(in_srgb,var(--accent)_25%,var(--surface))] text-accent-ink"
      : band.tone === "amber"
        ? "bg-[#FEF3C7] text-[#92400E]"
        : band.tone === "red"
          ? "bg-[#FDE2E2] text-[#9B1B30]"
          : "bg-surface-2 text-primary-ink";

  return (
    <section id="symptom-score" className="card scroll-mt-24" aria-labelledby="mrs-title">
      <p className="label mb-1">SYMPTOM SCORE</p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="mrs-title" className="font-display text-[1.6rem] leading-tight text-ink">
          How strong are your symptoms?
        </h2>
        {latest && !open && (
          <button className={`btn ${due ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setOpen(true)}>
            {due ? "Do this week's check" : "Check again"}
          </button>
        )}
      </div>
      <p className="mt-1 text-[15px] text-ink-soft">
        A short weekly check with the Menopause Rating Scale. 11 questions, about 1 minute.
        {latest && !due && ` Next check from ${formatShort(addDays(latest.date, 7))}.`}
      </p>

      {latest && !open && (
        <div className="mt-5 grid gap-5 md:grid-cols-[240px_1fr]">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Latest · {formatShort(latest.date)}</p>
              <p className="mt-1 font-display text-[2.4rem] leading-none text-ink tabular">
                {total} <span className="text-lg text-ink-soft">of {MRS_MAX}</span>
              </p>
              <span className={`mt-2 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${bandStyle}`}>{band.label}</span>
              {change !== null && (
                <p className="mt-2 text-sm text-ink-soft">
                  {change < 0 ? `Down ${-change}` : change > 0 ? `Up ${change}` : "No change"} since your first check on {formatShort(first.date)}
                  {change < 0 ? ". Getting better." : "."}
                </p>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink">Most bothersome now</p>
              {top.length ? (
                <ul className="flex flex-col gap-1.5">
                  {top.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 text-[15px]">
                      <span className="text-ink">{t.label}</span>
                      <span className="text-sm text-ink-soft">{MRS_LEVELS[t.score]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">Nothing above mild this week.</p>
              )}
            </div>
          </div>
          <ScoreChart scores={sorted.slice(-12)} />
        </div>
      )}

      {open && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">Over the last week, how much has each bothered you?</p>
          {MRS_ITEMS.map((it) => (
            <fieldset key={it.id} className="border-b border-line pb-4 last:border-0">
              <legend className="text-[15px] font-semibold text-ink">{it.label}</legend>
              <p className="mb-2 text-xs text-ink-soft">{it.hint}</p>
              <div className="flex flex-wrap gap-2">
                {MRS_LEVELS.map((l, v) => (
                  <button key={l} type="button" className="chip chip-sm" aria-pressed={draft[it.id] === v} onClick={() => setDraft((d) => ({ ...d, [it.id]: v }))}>
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" disabled={!done} onClick={save}>
              Save this week&apos;s score
            </button>
            {latest && (
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
            )}
            {!done && <span className="text-sm text-ink-soft">{MRS_ITEMS.filter((it) => draft[it.id] === undefined).length} left</span>}
          </div>
        </div>
      )}
    </section>
  );
}

function ScoreChart({ scores }: { scores: MenoScore[] }) {
  const W = 560;
  const H = 210;
  const L = 34;
  const R = 16;
  const T = 18;
  const B = 26;
  const vals = scores.map(mrsTotal);
  const max = Math.max(20, Math.ceil((Math.max(...vals) + 4) / 4) * 4);
  const x = (i: number) => (scores.length === 1 ? (L + W - R) / 2 : L + (i / (scores.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(vals.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, max / 2, max].map((v) => Math.round(v));
  const lastI = vals.length - 1;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Symptom scores, last ${scores.length} checks: ${vals.join(", ")} out of ${MRS_MAX}`}>
        <defs>
          <linearGradient id="mrs-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[16, 8].filter((b) => b < max).map((b) => (
          <line key={b} x1={L} x2={W - R} y1={y(b)} y2={y(b)} stroke="var(--line)" strokeDasharray="4 4" />
        ))}
        {ticks.map((t) => (
          <text key={t} x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-soft)">
            {t}
          </text>
        ))}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="var(--line)" />
        {vals.length > 1 && <path d={area} fill="url(#mrs-fill)" />}
        {vals.length > 1 && <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2.2} strokeLinejoin="round" />}
        {vals.map((v, i) => (
          <circle key={scores[i].date} cx={x(i)} cy={y(v)} r={i === lastI ? 5 : 3.5} fill={i === lastI ? "var(--primary)" : "var(--surface)"} stroke="var(--primary)" strokeWidth={2}>
            <title>
              {formatShort(scores[i].date)}: {v} of {MRS_MAX}
            </title>
          </circle>
        ))}
        <text x={x(lastI)} y={y(vals[lastI]) - 10} textAnchor={vals.length > 1 ? "end" : "middle"} fontSize={12} fontWeight={700} fill="var(--ink)">
          {vals[lastI]}
        </text>
        <text x={x(0)} y={H - 6} textAnchor={vals.length > 1 ? "start" : "middle"} fontSize={11} fill="var(--ink-soft)">
          {formatShort(scores[0].date)}
        </text>
        {vals.length > 1 && (
          <text x={x(lastI)} y={H - 6} textAnchor="end" fontSize={11} fill="var(--ink-soft)">
            {formatShort(scores[lastI].date)}
          </text>
        )}
      </svg>
      <figcaption className="mt-1 text-xs text-ink-soft">Lower is better. Dashed lines mark the mild (8) and moderate (16) bands.</figcaption>
    </figure>
  );
}

const TREATMENTS: { title: string; icon: typeof HeartPulse; what: string; ask: string }[] = [
  {
    title: "Hormone therapy (HRT / MHT)",
    icon: HeartPulse,
    what: "Oestrogen, with progestogen if you have a womb, as a patch, gel or tablet. The most effective treatment for hot flushes and night sweats, and it protects bones. For most healthy women under 60, the benefits outweigh the risks.",
    ask: "Is hormone therapy safe for me, and which type would suit me best?",
  },
  {
    title: "Vaginal oestrogen and moisturisers",
    icon: Sun,
    what: "A very low-dose cream, tablet or ring for dryness, pain during sex and bladder symptoms. Little reaches the rest of your body. Moisturisers and lubricants help too.",
    ask: "Could a vaginal treatment help my dryness or bladder symptoms?",
  },
  {
    title: "Non-hormonal medicines",
    icon: Stethoscope,
    what: "If you can't or don't want to take hormones, some medicines can reduce hot flushes. Your doctor will weigh the side effects with you.",
    ask: "What non-hormonal options are there for my hot flushes?",
  },
  {
    title: "Talking therapy (CBT)",
    icon: MessageCircleQuestion,
    what: "Cognitive behavioural therapy is proven to help with low mood, anxiety, sleep and how much flushes bother you.",
    ask: "Can you refer me for CBT, or suggest a good programme?",
  },
  {
    title: "Bone health",
    icon: Bone,
    what: "Calcium, vitamin D, strength exercise and, if your risk is high, a bone density scan and medicines to protect your bones.",
    ask: "Should I have a bone density scan, and do I need calcium or vitamin D tablets?",
  },
  {
    title: "Heart and sugar checks",
    icon: HeartPulse,
    what: "Blood pressure, cholesterol and sugar tests every year or two help catch problems early, when they're easiest to treat.",
    ask: "When should I next check my blood pressure, cholesterol and sugar?",
  },
];

function Treatments() {
  return (
    <section aria-labelledby="treatments">
      <p className="label mb-1">TALK TO YOUR DOCTOR</p>
      <h2 id="treatments" className="mb-4 font-display text-[1.6rem] leading-tight text-ink">
        Treatment options, explained
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {TREATMENTS.map((t) => (
          <article key={t.title} className="card flex flex-col">
            <h3 className="mb-2 flex items-center gap-2 font-display text-[1.25rem] leading-tight text-ink">
              <t.icon size={18} className="shrink-0 text-primary-ink" aria-hidden />
              {t.title}
            </h3>
            <p className="text-[15px] leading-relaxed text-ink-soft">{t.what}</p>
            <p className="mt-auto pt-4 text-[15px] text-ink">
              <span className="font-semibold">Ask your doctor: </span>
              &ldquo;{t.ask}&rdquo;
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">Saheli explains, it doesn&apos;t prescribe. Your doctor will help you choose what&apos;s right for you.</p>
    </section>
  );
}
