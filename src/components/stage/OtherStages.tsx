"use client";

import Link from "next/link";
import { useState } from "react";
import { Baby, BookHeart, Brain, CalendarHeart, Dumbbell, Flower2, Heart, Leaf, Moon, Salad, ShoppingBag, Sprout, Stethoscope, Sun, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { setStage } from "@/components/pregnancy/data";
import { todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";
import type { LifeStage } from "@/lib/types";
import { DIAGNOSE, StagePicker, SymptomChips, TipCards, TrackCard, WarningSigns } from "./shared";

/* ---------------- PCOS ---------------- */

export function PcosPage() {
  return (
    <>
      <PageHeader eyebrow="PCOS CARE" title="Gentle, steady, in balance" lead="PCOS is common and manageable. Small, steady habits help your hormones, cycle, skin and energy." />
      <div className="flex flex-col gap-5">
        <TipCards
          tips={[
            {
              title: "Food",
              icon: Salad,
              points: [
                "Pair carbs with protein and fibre: roti with dal and sabzi, not roti alone.",
                "Choose millets, oats and brown rice some days, and keep rice to one katori.",
                "Have fewer sugary drinks, sweets and maida snacks. A little is fine.",
                "Eat at regular times. Skipping meals makes cravings stronger.",
              ],
            },
            {
              title: "Movement",
              icon: Dumbbell,
              points: [
                "Strength training 2-3 times a week helps your body use insulin better.",
                "A 10-15 minute walk after meals steadies your sugar.",
                "Any movement you enjoy counts. Consistency beats intensity.",
              ],
            },
            {
              title: "Rest and stress",
              icon: Moon,
              points: [
                "Aim for 7-8 hours of sleep. Poor sleep makes insulin resistance worse.",
                "Stress raises cortisol, which can worsen symptoms. Try 5 minutes of slow breathing on Mind.",
                "Be kind to yourself about your skin, hair and weight. They are symptoms, not failures.",
              ],
            },
          ]}
        />
        <SymptomChips
          title="Track what PCOS feels like today"
          options={["Acne", "Hair fall", "Extra hair growth", "Bloating", "Cravings", "Tired", "Low mood", "Anxious", "Pelvic pain", "Spotting"]}
        />
        <TrackCard
          items={[
            { label: "Your periods", why: "How long between them. Over 35 days is worth noting.", href: "/app/cycle" },
            { label: "Your reports", why: "LH, FSH, testosterone, insulin and sugar.", href: "/app/reports" },
            { label: "Food and movement", why: "Insulin-friendly meals and after-meal walks.", href: "/app/nourish" },
            { label: "Skin, hair and mood", why: "Using the chips above, so you can see patterns." },
          ]}
        />
        <WarningSigns
          title="See your doctor soon if you have"
          signs={[
            "No period for 3 months or more",
            "Very heavy bleeding, soaking a pad every hour",
            "Very thirsty, passing urine a lot, or losing weight without trying",
            "Sudden fast hair growth or a deepening voice",
            "Feeling hopeless most days",
          ]}
          footer="Call your doctor this week. In an emergency, call now."
        />
        <p className="text-sm text-ink-soft">{DIAGNOSE}</p>
        <StagePicker />
      </div>
    </>
  );
}

/* ---------------- First periods ---------------- */

export function FirstPeriodsPage() {
  return (
    <>
      <PageHeader eyebrow="FIRST PERIODS" title="Your period, explained kindly" lead="A period is a normal, healthy sign that your body is growing up. Here's what to expect and what to keep ready." />
      <div className="flex flex-col gap-5">
        <section className="panel">
          <h2 className="mb-2 flex items-center gap-2 font-display text-[1.35rem] text-ink">
            <Flower2 size={19} className="text-primary-ink" aria-hidden />
            What is a period?
          </h2>
          <p className="max-w-[720px] text-[15px] leading-relaxed text-ink">
            Every month, the inside of your womb (uterus) builds a soft lining. If it isn&apos;t needed, your body lets it go as blood through your vagina. That&apos;s your period. It usually lasts 3 to 7 days and comes back about once a month. In the first year or two it can be irregular, and that&apos;s okay.
          </p>
        </section>
        <TipCards
          tips={[
            {
              title: "What's normal",
              icon: Heart,
              points: [
                "Bleeding for 3 to 7 days.",
                "Periods 3 to 6 weeks apart. Irregular at first is common.",
                "Mild cramps, a sore back, feeling tired or moody before or during.",
                "Blood that's red, brown or dark. Small clots are okay.",
              ],
            },
            {
              title: "Your period kit",
              icon: ShoppingBag,
              points: [
                "2 or 3 pads in a small pouch in your school bag.",
                "A spare pair of underwear and a few wipes.",
                "A small paper bag to wrap a used pad.",
                "A jacket or sweater to tie around your waist, just in case.",
              ],
            },
            {
              title: "Talk to a parent, school nurse or doctor if",
              icon: Users,
              points: [
                "You bleed for more than 7 days, or soak a pad every 1 to 2 hours.",
                "Cramps are so bad you can't go to school, even with a hot water bag.",
                "You feel dizzy or faint, or very tired all the time.",
                "You're 15 and haven't had a period yet, or they stop for 3 months after the first year.",
              ],
            },
          ]}
        />
        <TrackCard
          items={[
            { label: "When your period starts", why: "Tap it on Cycle. Saheli will guess when the next one comes.", href: "/app/cycle" },
            { label: "How you feel", why: "Cramps, tiredness or mood, so you can see a pattern." },
          ]}
        />
        <section className="card">
          <h2 className="mb-2 flex items-center gap-2 font-display text-[1.3rem] text-ink">
            <Sun size={19} className="text-primary-ink" aria-hidden />
            Feeling better on period days
          </h2>
          <ul className="grid gap-x-8 gap-y-2 text-[15px] text-ink sm:grid-cols-2">
            <li>A hot water bag on your tummy or back.</li>
            <li>Gentle stretches or a walk. Moving helps cramps.</li>
            <li>Warm food and plenty of water.</li>
            <li>Rest when you need to. It&apos;s okay to take it easy.</li>
          </ul>
        </section>
        <WarningSigns
          title="Tell an adult straight away and get help if you"
          signs={["Feel faint or dizzy, or look very pale", "Have very bad pain in your tummy", "Are bleeding so much it soaks through a pad in an hour", "Have a fever with a tampon in"]}
          footer="A parent, teacher or school nurse can help you call a doctor."
        />
        <p className="text-sm text-ink-soft">{DIAGNOSE}</p>
        <StagePicker />
      </div>
    </>
  );
}

/* ---------------- Regular cycle: choose a stage ---------------- */

const CHOICES: { id: LifeStage; title: string; line: string; icon: typeof Sprout }[] = [
  { id: "pcos", title: "PCOS / PCOD", line: "Food, movement and tracking for steadier hormones.", icon: Leaf },
  { id: "ttc", title: "Trying to conceive", line: "Your fertile window, temperature and ovulation tests.", icon: CalendarHeart },
  { id: "pregnancy", title: "Pregnant", line: "Week by week, scans, kicks and your birth plan.", icon: Baby },
  { id: "postpartum", title: "New mother", line: "Recovery, feeding, a baby tracker and your feelings.", icon: Heart },
  { id: "menopause", title: "Perimenopause or menopause", line: "Symptom scores, treatments explained, bones and heart.", icon: Sun },
  { id: "first-period", title: "New to periods", line: "A gentle guide for girls and their parents.", icon: Flower2 },
];

export function CyclePage() {
  const profile = useProfileStore((s) => s.profile);
  const [pick, setPick] = useState<LifeStage | null>(null);
  const [date, setDate] = useState("");
  const [err, setErr] = useState("");
  const conditions = profile?.safety?.conditions ?? [];

  function choose(id: LifeStage) {
    if (id === "pregnancy" || id === "postpartum") {
      setPick(id);
      setDate("");
      setErr("");
      return;
    }
    setStage({ stage: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <PageHeader eyebrow="MY STAGE" title="Saheli grows with you" lead="You're on a regular cycle now. When life changes, pick your new stage and Saheli changes its food, movement and care with you." />
      <div className="flex flex-col gap-5">
        {conditions.includes("thyroid") && <ConditionCard kind="thyroid" />}
        {conditions.includes("diabetes") && <ConditionCard kind="diabetes" />}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              aria-pressed={pick === c.id}
              className="card flex flex-col items-start gap-2 text-left transition-colors hover:border-primary aria-pressed:border-2 aria-pressed:border-primary"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-primary-ink" aria-hidden>
                <c.icon size={20} />
              </span>
              <span className="font-display text-[1.3rem] leading-tight text-ink">{c.title}</span>
              <span className="text-[15px] text-ink-soft">{c.line}</span>
            </button>
          ))}
        </div>
        {pick && (
          <form
            className="card flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const today = todayISO();
              if (!date) return setErr(pick === "pregnancy" ? "Please add your due date." : "Please add baby's birth date.");
              if (pick === "postpartum" && date > today) return setErr("Baby's birth date can't be in the future.");
              if (pick === "pregnancy" && date < today) return setErr("Your due date should be today or later.");
              setStage({ stage: pick, ...(pick === "pregnancy" ? { dueDate: date, safety: { ...profile!.safety, pregnant: true } } : { babyBirthDate: date }) });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
              {pick === "pregnancy" ? "Your due date" : "Baby's birth date"}
              <input type="date" className="input h-11" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">
              Continue
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setPick(null)}>
              Cancel
            </button>
            {err && <p className="w-full text-sm font-semibold text-[#9B1B30]">{err}</p>}
          </form>
        )}

        <TipCards
          tips={[
            { title: "Know your cycle", icon: CalendarHeart, points: ["A cycle of 21 to 35 days is normal.", "Bleeding for 2 to 7 days is normal.", "Your energy and mood change with your phase. Saheli adapts with you."] },
            { title: "Every day", icon: Brain, points: ["The 10-second check-in on Today teaches Saheli how you feel.", "Iron-rich food on period days, more protein before your period.", "Move more in your follicular phase, gentler before your period."] },
            { title: "Look after your future self", icon: Stethoscope, points: ["Pap test every 3 years from 25 (or as your doctor advises).", "A monthly breast self-check.", "Iron, vitamin D and thyroid checks if you're often tired."] },
          ]}
        />
        <TrackCard
          items={[
            { label: "Your period", why: "So Saheli can predict the next one and your phases.", href: "/app/cycle" },
            { label: "Pain on period days", why: "Pain that stops your day is worth a check.", href: "/app/pain" },
            { label: "Mood and energy", why: "The 10-second check-in on Today.", href: "/app" },
            { label: "Screenings", why: "What's due for your age.", href: "/app/screenings" },
          ]}
        />
        <WarningSigns
          title="See your doctor if you have"
          signs={[
            "Bleeding that soaks a pad every hour, or lasts more than 7 days",
            "Pain that stops you from going about your day",
            "Bleeding between periods or after sex",
            "No period for 3 months (and you're not pregnant)",
          ]}
          footer="Call your doctor this week. In an emergency, call now."
        />
        <p className="text-sm text-ink-soft">{DIAGNOSE}</p>
      </div>
    </>
  );
}

function ConditionCard({ kind }: { kind: "thyroid" | "diabetes" }) {
  const t =
    kind === "thyroid"
      ? {
          title: "Living well with your thyroid",
          points: [
            "Take your tablet on an empty stomach with water, 30-60 minutes before tea or breakfast.",
            "Keep iron and calcium tablets 4 hours away from it.",
            "Check TSH as your doctor advises, usually every 6-12 months once stable.",
            "Tiredness, hair fall and heavy periods can mean your dose needs a review.",
          ],
          link: { href: "/app/checklist", label: "Medicine reminder" },
        }
      : {
          title: "Living well with diabetes",
          points: [
            "A 10-15 minute walk after meals helps your sugar more than one long walk.",
            "Fill half your plate with sabzi and salad, a quarter with protein, a quarter with roti or rice.",
            "Check your sugar as your doctor advises and keep the log for your visits.",
            "Very low (under 70) or very high (over 300) sugar: follow your plan and call your doctor.",
          ],
          link: { href: "/app/logs", label: "Sugar log" },
        };
  return (
    <section className="card border-2 border-[color-mix(in_srgb,var(--primary)_40%,transparent)]">
      <p className="label mb-1">{kind === "thyroid" ? "THYROID" : "DIABETES"}</p>
      <h2 className="mb-3 flex items-center gap-2 font-display text-[1.45rem] text-ink">
        <BookHeart size={20} className="text-primary-ink" aria-hidden />
        {t.title}
      </h2>
      <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {t.points.map((p) => (
          <li key={p} className="flex gap-2.5 text-[15px] text-ink">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <Link href={t.link.href} className="btn btn-secondary btn-sm mt-4">
        {t.link.label}
      </Link>
    </section>
  );
}
