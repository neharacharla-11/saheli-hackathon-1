"use client";

import Link from "next/link";
import { ArrowRight, CalendarHeart } from "lucide-react";
import { CycleRing, WeatherBars } from "@/components/CycleRing";
import { bodyWeather } from "@/lib/bodyWeather";
import { cycleDay, learnedCycleLength, nextPeriod, phaseForDay, PHASE_LABEL, PHASE_VAR } from "@/lib/cycle";
import { formatShort, todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";

/** The big cycle card on Today: ring on the left, Body Weather on the right. */
export function CycleCard({ previewDay }: { previewDay?: number | null }) {
  const profile = useProfileStore((s) => s.profile);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const dayLogs = useProfileStore((s) => s.dayLogs);
  const today = todayISO();
  if (!profile) return null;

  if (profile.stage === "postpartum" || profile.stage === "menopause") return <StageCard stage={profile.stage} />;
  if (profile.stage === "pregnancy") return null; // the pregnancy card shows instead

  const L = learnedCycleLength(periodStarts, profile.cycleLength);
  const P = profile.periodLength;
  const last = [...periodStarts].sort().filter((s) => s <= today).pop();

  if (!last) {
    return (
      <section className="rounded-[32px] border border-line bg-surface p-6 sm:p-8">
        <p className="label">Body weather</p>
        <h2 className="font-display mt-1 text-[1.6rem] leading-snug text-ink">Log your period to see your cycle</h2>
        <p className="mt-2 max-w-xl text-ink-soft">
          {profile.stage === "first-period"
            ? "When your period comes, tap the day it started. Saheli will help you know what to expect."
            : "Tap the day your last period started and Saheli will show your phase, your Body Weather and when to expect your next period."}
        </p>
        <Link href="/app/cycle" className="btn btn-primary mt-5">
          <CalendarHeart size={18} /> Open Cycle
        </Link>
      </section>
    );
  }

  const realDay = cycleDay(periodStarts, today, L) ?? 1;
  const day = previewDay ? Math.min(previewDay, L) : realDay;
  const phase = phaseForDay(day, L, P);
  const weather = bodyWeather(phase, dayLogs, periodStarts, L, P);
  const next = nextPeriod(periodStarts, today, L);
  const cycles = Math.min(6, Math.max(0, periodStarts.length - 1));

  return (
    <section
      className="grid items-center gap-6 rounded-[32px] border border-line bg-surface p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-10"
      aria-label={`Cycle day ${day}, ${PHASE_LABEL[phase]}`}
    >
      <div className="flex justify-center">
        <CycleRing day={day} cycleLength={L} periodLength={P} size={220} />
      </div>
      <div className="min-w-0">
        <p className="label">Body weather</p>
        <p className="font-display mt-1 text-[1.6rem] leading-snug text-ink">{weather.forecast}</p>
        <div className="mt-4">
          <WeatherBars color={PHASE_VAR[phase]} rows={weather.bars.map((b) => ({ label: b.label, level: b.level, word: b.word }))} />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          {weather.learnedFrom > 0
            ? `Personalised from your last ${cycles || weather.learnedFrom} cycle${(cycles || weather.learnedFrom) === 1 ? "" : "s"}.`
            : "Typical for this phase. Saheli learns from your check-ins."}
          {next && ` Next period expected around ${formatShort(next)}.`}
        </p>
      </div>
    </section>
  );
}

const STAGE_CARDS = {
  postpartum: {
    label: "After baby",
    sentence: "Your body did something huge. Rest, food and help are part of recovery.",
    tips: [
      "Eat to your hunger and keep water where you feed",
      "Sleep when the baby sleeps, even 20 minutes counts",
      "Gentle walks first, no heavy lifting until your check-up",
      "Low days are common. Tell someone if they last over 2 weeks",
      "Ask for help with meals and chores, it's not a favour",
    ],
    link: { href: "/app/stage", label: "Open your postpartum guide" },
  },
  menopause: {
    label: "After menopause",
    sentence: "A new chapter. Strong bones, a steady heart and good sleep matter most now.",
    tips: [
      "Calcium and vitamin D foods every day: curd, ragi, sesame",
      "Strength training 2 to 3 times a week for your bones",
      "A cool bedroom and less evening caffeine for night sweats",
      "Keep up your screenings: BP, sugar, cholesterol and mammogram",
    ],
    link: { href: "/app/stage", label: "Open your menopause guide" },
  },
} as const;

function StageCard({ stage }: { stage: "postpartum" | "menopause" }) {
  const c = STAGE_CARDS[stage];
  return (
    <section className="rounded-[32px] border border-line bg-surface p-6 sm:p-8">
      <p className="label">{c.label}</p>
      <p className="font-display mt-1 max-w-2xl text-[1.6rem] leading-snug text-ink">{c.sentence}</p>
      <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {c.tips.map((t) => (
          <li key={t} className="flex gap-2.5 text-[15px] text-ink">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
      <Link href={c.link.href} className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary-ink hover:underline">
        {c.link.label} <ArrowRight size={16} />
      </Link>
    </section>
  );
}
