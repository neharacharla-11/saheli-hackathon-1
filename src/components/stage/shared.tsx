"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ClipboardList, Phone, TriangleAlert, type LucideIcon } from "lucide-react";
import { setStage } from "@/components/pregnancy/data";
import { todayISO } from "@/lib/dates";
import { helpFor, telLink } from "@/lib/helplines";
import { activeProfileStore, STAGE_LABEL, useProfileStore } from "@/lib/store";
import type { LifeStage } from "@/lib/types";

export const DIAGNOSE = "Saheli explains, it doesn't diagnose. Talk to your doctor.";

export interface Tip {
  title: string;
  icon?: LucideIcon;
  points: string[];
}

/** Tip cards in a grid; an odd last card spans the row so nothing is left alone. */
export function TipCards({ tips, cols = 3 }: { tips: Tip[]; cols?: 2 | 3 }) {
  const grid = cols === 3 ? "md:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid gap-5 ${grid}`}>
      {tips.map((t, i) => {
        const Icon = t.icon;
        const lone = cols === 2 && i === tips.length - 1 && tips.length % 2 === 1;
        return (
          <section key={t.title} className={`card ${lone ? "sm:col-span-2" : ""}`}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-[1.3rem] leading-tight text-ink">
              {Icon && <Icon size={19} className="shrink-0 text-primary-ink" aria-hidden />}
              {t.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {t.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** "What to track" with links into Saheli. */
export function TrackCard({ items }: { items: { label: string; why: string; href?: string }[] }) {
  return (
    <section className="panel">
      <h2 className="mb-3 flex items-center gap-2 font-display text-[1.3rem] text-ink">
        <ClipboardList size={19} className="text-primary-ink" aria-hidden />
        What to track
      </h2>
      <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.label} className="text-[15px]">
            {it.href ? (
              <Link href={it.href} className="inline-flex items-center gap-1 font-semibold text-primary-ink underline-offset-4 hover:underline">
                {it.label} <ArrowRight size={14} aria-hidden />
              </Link>
            ) : (
              <span className="font-semibold text-ink">{it.label}</span>
            )}
            <span className="block text-ink-soft">{it.why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The red "Call your doctor" box. */
export function WarningSigns({ title = "Call your doctor or get urgent care if you have", signs, footer }: { title?: string; signs: string[]; footer?: string }) {
  const country = useProfileStore((s) => s.profile?.country);
  const help = helpFor(country);
  return (
    <section className="rounded-[20px] border-2 border-[#9B1B30]/50 bg-[#FDE2E2] p-5 text-[#5c1020] sm:p-6" aria-labelledby="warning-title">
      <h2 id="warning-title" className="flex items-start gap-2 text-[17px] font-semibold leading-snug">
        <TriangleAlert size={19} className="mt-[3px] shrink-0" aria-hidden />
        {title}
      </h2>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {signs.map((s) => (
          <li key={s} className="flex gap-2 text-[15px] leading-relaxed">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#9B1B30]" aria-hidden />
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={telLink(help.emergency.number)} className="btn bg-danger text-white hover:brightness-105">
          <Phone size={16} aria-hidden /> Call {help.emergency.number}
        </a>
        <p className="text-sm">{footer ?? "In an emergency, call now. Otherwise call your doctor today."}</p>
      </div>
    </section>
  );
}

/** Today's symptoms as chips, saved to her day log. */
export function SymptomChips({ title, options }: { title: string; options: string[] }) {
  const today = todayISO();
  const picked = useProfileStore((s) => s.dayLogs[today]?.symptoms) ?? [];
  const toggle = (o: string) => {
    const next = picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o];
    activeProfileStore().getState().logDay(today, { symptoms: next });
  };
  const mine = picked.filter((p) => options.includes(p)).length;
  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[1.3rem] text-ink">{title}</h2>
        <span className="text-sm text-ink-soft" aria-live="polite">
          {mine ? `${mine} saved for today` : "Tap what you feel. It saves by itself."}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" className="chip" aria-pressed={picked.includes(o)} onClick={() => toggle(o)}>
            {picked.includes(o) && <Check size={14} aria-hidden />}
            {o}
          </button>
        ))}
      </div>
    </section>
  );
}

const STAGES: { id: LifeStage; label: string }[] = [
  { id: "cycle", label: "Regular cycle" },
  { id: "pcos", label: "PCOS / PCOD" },
  { id: "ttc", label: "Trying to conceive" },
  { id: "pregnancy", label: "Pregnant" },
  { id: "postpartum", label: "New mother" },
  { id: "menopause", label: "Perimenopause or menopause" },
  { id: "first-period", label: "New to periods" },
];

/** Change life stage, asking for the one date a stage needs. */
export function StagePicker({ compact = false }: { compact?: boolean }) {
  const profile = useProfileStore((s) => s.profile);
  const [pick, setPick] = useState<LifeStage | null>(null);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  if (!profile) return null;

  function confirm(id: LifeStage) {
    setError("");
    if (id === "pregnancy" || id === "postpartum") {
      if (!date) return setError(id === "pregnancy" ? "Please add your due date." : "Please add baby's birth date.");
      const today = todayISO();
      if (id === "postpartum" && date > today) return setError("Baby's birth date can't be in the future.");
      if (id === "pregnancy" && date < today) return setError("Your due date should be today or later.");
    }
    setStage({
      stage: id,
      ...(id === "pregnancy" ? { dueDate: date } : {}),
      ...(id === "postpartum" ? { babyBirthDate: date } : {}),
      safety: { ...profile!.safety, pregnant: id === "pregnancy" },
    });
    setPick(null);
    setDate("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className={compact ? "" : "card"} aria-labelledby="stage-picker">
      <h2 id="stage-picker" className="font-display text-[1.3rem] text-ink">
        Your life stage
      </h2>
      <p className="mb-3 text-sm text-ink-soft">Now: {STAGE_LABEL[profile.stage]}. Change it any time and Saheli changes with you.</p>
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="chip"
            aria-pressed={pick ? pick === s.id : profile.stage === s.id}
            onClick={() => {
              setError("");
              if (s.id === profile.stage) return setPick(null);
              if (s.id === "pregnancy" || s.id === "postpartum") {
                setDate(s.id === "pregnancy" ? (profile.dueDate ?? "") : (profile.babyBirthDate ?? ""));
                setPick(s.id);
              } else confirm(s.id);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {pick && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-surface-2 p-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
            {pick === "pregnancy" ? "Your due date" : "Baby's birth date"}
            <input type="date" className="input h-11" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button type="button" className="btn btn-primary" onClick={() => confirm(pick)}>
            Change to {STAGES.find((s) => s.id === pick)!.label.toLowerCase()}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPick(null)}>
            Cancel
          </button>
          {error && <p className="w-full text-sm font-semibold text-[#9B1B30]">{error}</p>}
        </div>
      )}
    </section>
  );
}
