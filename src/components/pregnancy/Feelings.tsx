"use client";

import Link from "next/link";
import { useState } from "react";
import { Baby, Flower2, HeartHandshake, MessageCircleHeart, Phone, TriangleAlert } from "lucide-react";
import { formatShort, todayISO } from "@/lib/dates";
import { COUNTRIES, helpFor, OTHER_COUNTRY, telLink } from "@/lib/helplines";
import { PERINATAL_LINES } from "@/lib/pregnancyContent";
import type { PregnancyMoodCheck } from "@/lib/pregnancyTypes";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import { setStage, updateData, updatePregnancy } from "./data";
import { AlertBox, CardHead, DISCLAIMER, Field } from "./ui";

/* ---------------- Helplines ---------------- */

export function Helplines({ title = "Talk to someone" }: { title?: string }) {
  const home = useProfileStore((s) => s.profile?.country);
  const [country, setCountry] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const code = country ?? home ?? "OTHER";
  const help = helpFor(code);
  const lines = [help.emergency, ...help.others, ...(PERINATAL_LINES[code] ?? [])].filter(
    (l, i, all) => all.findIndex((x) => x.number === l.number) === i,
  );
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-ink">
          {title} · {help.name}
        </p>
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
    </div>
  );
}

/* ---------------- How are you, really? ---------------- */

const FREQ = ["Not at all", "Some days", "More than half the days", "Nearly every day"];
const QUESTIONS: { id: "down" | "interest" | "anxious"; text: string }[] = [
  { id: "down", text: "Feeling down, low or hopeless" },
  { id: "interest", text: "Little interest or joy in doing things" },
  { id: "anxious", text: "Feeling anxious, worried or on edge" },
];

export function MoodCheck() {
  const checks = useProfileStore((s) => s.pregnancy?.moodChecks) ?? [];
  const today = todayISO();
  const last = [...checks].sort((a, b) => b.date.localeCompare(a.date))[0];
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [harm, setHarm] = useState<boolean | null>(null);
  const [result, setResult] = useState<PregnancyMoodCheck | null>(null);
  const complete = QUESTIONS.every((q) => answers[q.id] !== undefined) && harm !== null;

  function save() {
    if (!complete) return;
    const check: PregnancyMoodCheck = {
      date: today,
      down: answers.down,
      interest: answers.interest,
      anxious: answers.anxious,
      harm: !!harm,
    };
    updatePregnancy({ moodChecks: [...checks.filter((c) => c.date !== today), check] });
    setResult(check);
  }

  const shown = result;
  const low = shown ? shown.down + shown.interest >= 3 : false;
  const worried = shown ? shown.anxious >= 2 : false;

  return (
    <section className="card">
      <CardHead
        icon={HeartHandshake}
        title="How are you, really?"
        right={last && !result ? `Last check: ${formatShort(last.date)}` : undefined}
      />
      <p className="text-[15px] text-ink-soft">
        1 in 5 women feel low or anxious in pregnancy. It&apos;s common, it&apos;s not your fault, and it gets better with help. Over the last 2 weeks, how often have you had:
      </p>

      {!result ? (
        <div className="mt-4 space-y-4">
          {QUESTIONS.map((q) => (
            <fieldset key={q.id}>
              <legend className="mb-2 text-[15px] font-semibold text-ink">{q.text}</legend>
              <div className="flex flex-wrap gap-2">
                {FREQ.map((f, i) => (
                  <button key={f} type="button" className="chip chip-sm" aria-pressed={answers[q.id] === i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}>
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend className="mb-2 text-[15px] font-semibold text-ink">Thoughts of harming yourself or your baby</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="chip chip-sm" aria-pressed={harm === false} onClick={() => setHarm(false)}>
                No
              </button>
              <button type="button" className="chip chip-sm" aria-pressed={harm === true} onClick={() => setHarm(true)}>
                Yes, sometimes
              </button>
            </div>
          </fieldset>
          {harm === true && <HarmNow />}
          <button type="button" className="btn btn-primary" onClick={save} disabled={!complete}>
            See what helps
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {result.harm && <HarmNow />}
          {low || worried ? (
            <AlertBox tone="warn" title="Please tell your doctor or midwife how you've been feeling">
              {low ? "Feeling low most days for 2 weeks or more " : "Feeling anxious most days "}
              can be a sign of depression or anxiety in pregnancy. It&apos;s very treatable, including with talking therapy that is safe for baby.
            </AlertBox>
          ) : (
            <AlertBox tone="calm" title="Thank you for checking in with yourself">
              It sounds like you&apos;re coping. Keep resting, moving gently and talking to people you trust. Check in again in a couple of weeks.
            </AlertBox>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href="/app/companion" className="btn btn-secondary btn-sm">
              <MessageCircleHeart size={16} aria-hidden /> Talk it through
            </Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setAnswers({}); setHarm(null); }}>
              Check again
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <Helplines />
      </div>
      <p className="mt-4 text-sm text-ink-soft">{DISCLAIMER}</p>
    </section>
  );
}

function HarmNow() {
  const country = useProfileStore((s) => s.profile?.country);
  const help = helpFor(country);
  return (
    <AlertBox tone="danger" icon={TriangleAlert} title="Please talk to someone right now">
      You don&apos;t have to carry this alone. Call {help.emergency.number} if you might act on these thoughts, or call one of the helplines below. Tell your partner, a family member or your doctor today.
      <a href={telLink(help.emergency.number)} className="btn mt-3 flex w-full bg-danger text-white hover:brightness-105 sm:w-auto sm:inline-flex">
        <Phone size={16} aria-hidden /> Call {help.emergency.number}
      </a>
    </AlertBox>
  );
}

/* ---------------- My pregnancy has ended ---------------- */

export function PregnancyEndedOption({ dueDate }: { dueDate: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"birth" | "loss" | null>(null);
  const [date, setDate] = useState(todayISO());

  function confirm() {
    const profile = activeProfileStore().getState().profile;
    if (!kind || !profile) return;
    updateData((s) => ({ contractions: [], pregnancy: { ...s.pregnancy, ended: { date, kind, dueDate } } }));
    const safety = { ...profile.safety, pregnant: false };
    if (kind === "birth") setStage({ stage: "postpartum", babyBirthDate: date, safety });
    else setStage({ stage: "cycle", dueDate: undefined, safety });
  }

  return (
    <section className="rounded-[20px] border border-dashed border-line p-5 sm:p-6">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-ink-soft">If your pregnancy has ended, for any reason, Saheli will gently change with you.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
            My pregnancy has ended
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-display text-[1.45rem] leading-tight text-ink">My pregnancy has ended</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setKind("birth")}
              aria-pressed={kind === "birth"}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left ${kind === "birth" ? "border-2 border-primary bg-surface-2" : "border-line bg-surface hover:bg-surface-2"}`}
            >
              <Baby size={20} className="mt-0.5 shrink-0 text-primary-ink" aria-hidden />
              <span>
                <span className="block font-semibold text-ink">My baby has arrived</span>
                <span className="block text-sm text-ink-soft">Saheli moves to care after birth, for you and baby.</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setKind("loss")}
              aria-pressed={kind === "loss"}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left ${kind === "loss" ? "border-2 border-primary bg-surface-2" : "border-line bg-surface hover:bg-surface-2"}`}
            >
              <Flower2 size={20} className="mt-0.5 shrink-0 text-primary-ink" aria-hidden />
              <span>
                <span className="block font-semibold text-ink">My pregnancy ended without a baby</span>
                <span className="block text-sm text-ink-soft">A miscarriage, stillbirth or ending a pregnancy. Saheli stops all baby content.</span>
              </span>
            </button>
          </div>
          {kind && (
            <Field label={kind === "birth" ? "Baby's birthday" : "When it ended"} className="max-w-xs">
              <input className="input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </Field>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={confirm} disabled={!kind || !date}>
              {kind === "birth" ? "Welcome, little one" : "Continue"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setOpen(false); setKind(null); }}>
              Not now
            </button>
          </div>
          <p className="text-sm text-ink-soft">You can undo this later if you need to.</p>
        </div>
      )}
    </section>
  );
}

/** Undo: she's still pregnant. */
export function undoEnded() {
  const s = activeProfileStore().getState();
  const ended = s.pregnancy?.ended;
  const safety = s.profile?.safety;
  if (!ended || !safety) return;
  setStage({
    stage: "pregnancy",
    dueDate: ended.dueDate ?? s.profile?.dueDate,
    babyBirthDate: ended.kind === "birth" ? undefined : s.profile?.babyBirthDate,
    safety: { ...safety, pregnant: true },
  });
  updatePregnancy({ ended: null });
}

/* ---------------- Support after a loss ---------------- */

export function LossSupport() {
  const ended = useProfileStore((s) => s.pregnancy?.ended);
  const name = useProfileStore((s) => s.profile?.name);
  return (
    <>
      <header className="mb-8">
        <p className="label mb-1.5">You&apos;re not alone</p>
        <h1 className="font-display text-[2.1rem] leading-[1.1] text-ink sm:text-[2.6rem]">We&apos;re so sorry{name ? `, ${name}` : ""}</h1>
        <p className="mt-2.5 max-w-[672px] text-ink-soft">
          Losing a pregnancy, at any stage and for any reason, can be a real grief. There is no right way to feel. Saheli has stopped all baby content and is here for you.
        </p>
      </header>
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <section className="card">
            <CardHead icon={Flower2} title="Your body" />
            <ul className="space-y-2 text-[15px] text-ink">
              <li>Bleeding and cramps can last up to 2 weeks and slowly ease.</li>
              <li>Your period usually comes back in 4 to 8 weeks.</li>
              <li>Rest, eat iron-rich food, and let people help.</li>
              <li>Pregnancy tests can stay positive for a few weeks.</li>
            </ul>
          </section>
          <section className="card">
            <CardHead icon={HeartHandshake} title="Your feelings" />
            <ul className="space-y-2 text-[15px] text-ink">
              <li>Sadness, numbness, anger or guilt are all normal. It was not your fault.</li>
              <li>Partners grieve too, sometimes differently.</li>
              <li>Some days will be harder, like your due date.</li>
              <li>If you feel low most days after a few weeks, tell your doctor.</li>
            </ul>
          </section>
        </div>
        <section className="rounded-[20px] border-2 border-primary bg-surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-[1.45rem] leading-tight text-ink">
            <TriangleAlert size={20} className="text-primary-ink" aria-hidden /> Call your doctor straight away if you have
          </h2>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-[15px] text-ink sm:grid-cols-2">
            {[
              "Bleeding that soaks a pad in an hour",
              "Fever, chills or smelly discharge",
              "Severe tummy pain",
              "Feeling faint or dizzy",
              "Thoughts of harming yourself",
            ].map((w) => (
              <li key={w} className="flex gap-2.5">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <Helplines />
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/companion" className="btn btn-secondary">
              <MessageCircleHeart size={16} aria-hidden /> Talk it through
            </Link>
          </div>
        </section>
        <section className="panel">
          <h2 className="font-display text-[1.45rem] leading-tight text-ink">When you&apos;re ready</h2>
          <p className="mt-1 text-[15px] text-ink">
            There&apos;s no rush. When you want to, Saheli can go back to following your cycle. Your baby book and letters stay safe on this device.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => ended && updatePregnancy({ ended: { ...ended, dismissed: true } })}
            >
              Follow my cycle again
            </button>
            <button type="button" className="btn btn-ghost" onClick={undoEnded}>
              This was a mistake, I&apos;m still pregnant
            </button>
          </div>
        </section>
        <p className="text-sm text-ink-soft">{DISCLAIMER}</p>
      </div>
    </>
  );
}

/** After she marks the birth. */
export function BirthDone() {
  const ended = useProfileStore((s) => s.pregnancy?.ended);
  return (
    <section className="card">
      <p className="label">Welcome, little one</p>
      <h1 className="mt-1 font-display text-[2.1rem] leading-[1.1] text-ink">Congratulations</h1>
      <p className="mt-2 text-ink-soft">
        {ended ? `Baby arrived on ${formatShort(ended.date)}. ` : ""}Saheli now cares for you after birth: your recovery, feeding, sleep and feelings, and a baby tracker.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/app/stage" className="btn btn-primary">
          Open Postpartum
        </Link>
        <button type="button" className="btn btn-ghost" onClick={undoEnded}>
          Undo
        </button>
      </div>
    </section>
  );
}
