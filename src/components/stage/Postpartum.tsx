"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, CloudSun, HeartHandshake, MessageCircleHeart, Phone, Salad, Sparkles, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Helplines } from "@/components/pregnancy/Feelings";
import { setStage } from "@/components/pregnancy/data";
import { formatShort, todayISO } from "@/lib/dates";
import { helpFor, telLink } from "@/lib/helplines";
import { postpartumScreen, sinceBirthTitle, weeksSince } from "@/lib/stageCare";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import type { PostpartumCheck } from "@/lib/stageTypes";
import { BabyCareTracker } from "./BabyCare";
import { DIAGNOSE, StagePicker, TipCards, TrackCard, WarningSigns } from "./shared";

interface Period {
  id: string;
  label: string;
  from: number; // weeks
  to: number;
  tips: string[];
}

const YEAR: Period[] = [
  {
    id: "0-2",
    label: "Weeks 0-2",
    from: 0,
    to: 2,
    tips: [
      "Rest whenever baby sleeps. Let others cook, clean and hold the baby.",
      "Bleeding (lochia) is heavy at first and slowly turns pink, then brown.",
      "Feeds are often every 2-3 hours, day and night. Cluster feeding in the evening is normal.",
      "Baby blues on days 3-10 are very common and usually pass on their own.",
    ],
  },
  {
    id: "2-6",
    label: "Weeks 2-6",
    from: 2,
    to: 6,
    tips: [
      "Short, gentle walks help your body heal and lift your mood.",
      "Keep a water bottle where you feed and eat small meals often.",
      "Your 6-week check is for you too: talk about your bleeding, stitches, mood and contraception.",
      "Start gentle pelvic floor squeezes if they feel comfortable.",
    ],
  },
  {
    id: "6-12",
    label: "Weeks 6-12",
    from: 6,
    to: 12,
    tips: [
      "Once your doctor says yes, build up movement slowly: walks first, then gentle strength.",
      "Baby's first vaccines are due around 6, 10 and 14 weeks. Keep the card handy.",
      "Your period may come back, even while breastfeeding. You can get pregnant before it does.",
      "Sleep is still broken. Ask for one longer stretch of sleep a night if someone can give a bottle.",
    ],
  },
  {
    id: "3-6m",
    label: "Months 3-6",
    from: 12,
    to: 26,
    tips: [
      "Hair fall around 3-4 months is common and grows back.",
      "Many babies begin to sleep in longer stretches. Some don't yet, and that's normal too.",
      "If you're going back to work, plan feeding and expressing a few weeks ahead.",
    ],
  },
  {
    id: "6-12m",
    label: "Months 6-12",
    from: 26,
    to: 53,
    tips: [
      "Baby starts solid food around 6 months, alongside milk.",
      "Your body keeps changing for a full year. Be patient with yourself.",
      "Check your iron and vitamin D if you feel very tired.",
    ],
  },
];

export function PostpartumPage() {
  const profile = useProfileStore((s) => s.profile);
  const today = todayISO();
  const birth = profile?.babyBirthDate;
  if (!profile) return null;
  const weeks = birth ? weeksSince(birth, today).weeks : 0;
  const now = YEAR.find((p) => weeks >= p.from && weeks < p.to) ?? YEAR[YEAR.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="POSTPARTUM"
        title={birth ? sinceBirthTitle(birth, today) : "After your baby"}
        lead="Care for you and your baby: your recovery, feeding, sleep and feelings."
      />
      <div className="flex flex-col gap-5">
        <BirthDateCard />

        <section className="rounded-[32px] bg-surface-2 p-6 sm:p-8" aria-labelledby="right-now">
          <p className="label mb-1 flex items-center gap-1.5">
            <CloudSun size={14} aria-hidden /> RIGHT NOW · {now.label.toUpperCase()}
          </p>
          <h2 id="right-now" className="font-display text-[1.6rem] leading-tight text-ink">
            What helps in {now.label.toLowerCase()}
          </h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {now.tips.map((t) => (
              <li key={t} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <BabyCareTracker />

        <TipCards
          cols={2}
          tips={[
            {
              title: "Feeding and food",
              icon: Salad,
              points: [
                "Your coach will set your plan personally, because feeding your baby changes what you need.",
                "Eat when you're hungry, never skip meals, and drink a glass of water at every feed.",
                "Iron, calcium and protein help you recover: dal, ragi, curd, paneer, eggs, greens, til and dates.",
                "Breast or bottle, a fed baby and a cared-for mother is what matters.",
              ],
            },
            {
              title: "Your feelings matter too",
              icon: HeartHandshake,
              points: [
                "Baby blues: tearful, up and down, in the first 2 weeks. Very common, and it passes.",
                "Postnatal depression: low, hopeless or numb most days for more than 2 weeks, or it gets worse. It's common, not your fault, and very treatable.",
                "Anxiety, racing thoughts or scary pictures in your head can be part of it too.",
                "Tell your partner, family or doctor how you really feel. You don't have to manage alone.",
              ],
            },
          ]}
        />
        <div className="-mt-2 flex flex-wrap gap-2">
          <Link href="/app/nourish" className="btn btn-secondary btn-sm">
            <Salad size={16} aria-hidden /> Food on Nourish
          </Link>
          <Link href="/app/companion" className="btn btn-secondary btn-sm">
            <MessageCircleHeart size={16} aria-hidden /> Talk it through
          </Link>
        </div>

        <MoodScreen />

        <WarningSigns
          signs={[
            "Heavy bleeding: soaking a pad in an hour, or big clots",
            "A severe headache, blurred vision or fits",
            "One leg swollen, red or painful",
            "Fever or chills",
            "Chest pain or trouble breathing",
            "A wound or stitches that are red, hot or leaking",
            "Feeling hopeless most days",
            "Thoughts of harming yourself or your baby",
          ]}
        />

        <TrackCard
          items={[
            { label: "Feeds, nappies and sleep", why: "In Baby care above. Handy for check-ups." },
            { label: "Your mood", why: "A quick check-in every day on Today.", href: "/app" },
            { label: "Your bleeding", why: "It should get lighter week by week." },
            { label: "Your 6-week check", why: "Add it to your calendar with your questions." },
          ]}
        />

        <YearTimeline weeks={weeks} />
        <p className="text-sm text-ink-soft">{DIAGNOSE}</p>
        <StagePicker />
      </div>
    </>
  );
}

function BirthDateCard() {
  const birth = useProfileStore((s) => s.profile?.babyBirthDate);
  const [open, setOpen] = useState(!birth);
  const [date, setDate] = useState(birth ?? "");
  const [err, setErr] = useState("");
  return (
    <section className="card flex flex-wrap items-center justify-between gap-3 py-4 sm:py-4">
      <p className="text-[15px] text-ink">
        {birth ? (
          <>
            Baby was born on <span className="font-semibold">{formatShort(birth)}</span>
          </>
        ) : (
          "Add baby's birth date so Saheli can match tips to your weeks."
        )}
      </p>
      {open ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!date) return setErr("Please pick a date.");
            if (date > todayISO()) return setErr("That's in the future.");
            setStage({ babyBirthDate: date });
            setErr("");
            setOpen(false);
          }}
        >
          <input type="date" className="input h-10" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} aria-label="Baby's birth date" />
          <button className="btn btn-primary btn-sm" type="submit">
            Save
          </button>
          {err && <span className="text-sm font-semibold text-[#9B1B30]">{err}</span>}
        </form>
      ) : (
        <button className="btn btn-ghost btn-sm text-primary-ink" onClick={() => setOpen(true)}>
          Change baby&apos;s birth date
        </button>
      )}
    </section>
  );
}

const FREQ = ["Not at all", "Some days", "Most days", "Nearly every day"];
const QUESTIONS = [
  "Feeling low, sad or hopeless",
  "Little joy or interest in things you usually like",
  "Feeling anxious, panicky or worried for no clear reason",
  "Feeling you can't cope, or blaming yourself when things go wrong",
  "Thoughts of harming yourself or your baby",
];
const NO_CHECKS: PostpartumCheck[] = [];

function MoodScreen() {
  const checks = useProfileStore((s) => s.postpartumChecks ?? NO_CHECKS);
  const country = useProfileStore((s) => s.profile?.country);
  const help = helpFor(country);
  const today = todayISO();
  const last = [...checks].sort((a, b) => b.date.localeCompare(a.date))[0];
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [result, setResult] = useState<ReturnType<typeof postpartumScreen> | null>(null);
  const complete = QUESTIONS.every((_, i) => answers[i] !== undefined);

  function save() {
    if (!complete) return;
    const a = answers as number[];
    activeProfileStore().setState((s) => ({ postpartumChecks: [...(s.postpartumChecks ?? []).filter((c) => c.date !== today), { date: today, answers: a }] }) as never);
    setResult(postpartumScreen(a));
  }

  return (
    <section className="card" aria-labelledby="pp-mood">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pp-mood" className="font-display text-[1.45rem] text-ink">
          How are you, really?
        </h2>
        {last && <span className="text-sm text-ink-soft">Last check: {formatShort(last.date)}</span>}
      </div>
      <p className="text-[15px] text-ink-soft">Five private questions about the last 2 weeks. Only you see the answers. This is a screen, not a diagnosis.</p>

      {!result ? (
        <div className="mt-4 flex flex-col gap-4">
          {QUESTIONS.map((q, i) => (
            <fieldset key={q}>
              <legend className="mb-2 text-[15px] font-semibold text-ink">{q}</legend>
              <div className="flex flex-wrap gap-2">
                {FREQ.map((f, v) => (
                  <button
                    key={f}
                    type="button"
                    className="chip chip-sm"
                    aria-pressed={answers[i] === v}
                    onClick={() => setAnswers((cur) => Object.assign([...cur], { [i]: v }))}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          {(answers[4] ?? 0) > 0 && <UrgentBox number={help.emergency.number} />}
          <button type="button" className="btn btn-primary self-start" disabled={!complete} onClick={save}>
            See what helps
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {result === "urgent" && <UrgentBox number={help.emergency.number} />}
          {result === "talk" && (
            <div className="rounded-2xl border border-[#92400E]/30 bg-[#FEF3C7] p-4 text-[#5f2b06]">
              <p className="font-semibold">Please tell your doctor how you&apos;ve been feeling</p>
              <p className="mt-1 text-[15px]">
                Your answers suggest you may be going through more than baby blues. Postnatal depression and anxiety are common and very treatable, with talking therapy and medicines that are safe while breastfeeding.
              </p>
            </div>
          )}
          {result === "ok" && (
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="font-semibold text-ink">Thank you for checking in with yourself</p>
              <p className="mt-1 text-[15px] text-ink-soft">It sounds like you&apos;re coping. Keep resting when you can and leaning on your people. Check again in a couple of weeks.</p>
            </div>
          )}
          <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => { setResult(null); setAnswers([]); }}>
            Check again
          </button>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <Helplines />
      </div>
    </section>
  );
}

function UrgentBox({ number }: { number: string }) {
  return (
    <div className="rounded-2xl border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-4 text-[#5c1020]" role="alert">
      <p className="flex items-start gap-2 font-semibold">
        <TriangleAlert size={18} className="mt-[3px] shrink-0" aria-hidden />
        Please talk to someone right now
      </p>
      <p className="mt-1 text-[15px]">
        You&apos;re not alone, and these thoughts can get better with help. If you might act on them, call {number} now. Otherwise call a helpline below, and tell your partner, family or doctor today. Ask someone to be with you and baby.
      </p>
      <a href={telLink(number)} className="btn mt-3 bg-danger text-white hover:brightness-105">
        <Phone size={16} aria-hidden /> Call {number}
      </a>
    </div>
  );
}

function YearTimeline({ weeks }: { weeks: number }) {
  return (
    <details className="card group">
      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-display text-[1.35rem] text-ink">
          <Sparkles size={18} className="text-primary-ink" aria-hidden />
          The whole first year
        </span>
        <ChevronDown size={20} className="text-ink-soft transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ol className="mt-5 flex flex-col">
        {YEAR.map((p, i) => {
          const now = weeks >= p.from && weeks < p.to;
          return (
            <li key={p.id} className="relative flex gap-4 pb-5 last:pb-0">
              {i < YEAR.length - 1 && <span className="absolute left-[11px] top-7 h-[calc(100%-20px)] w-px bg-line" aria-hidden />}
              <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full ${now ? "bg-primary" : "border-2 border-line bg-surface"}`} aria-hidden>
                {now && <span className="h-2 w-2 rounded-full bg-on-primary" />}
              </span>
              <div>
                <p className="font-semibold text-ink">
                  {p.label}
                  {now && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-primary-ink">You are here</span>}
                </p>
                <ul className="mt-1 list-disc pl-5 text-[15px] text-ink-soft">
                  {p.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
