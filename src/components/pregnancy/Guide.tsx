"use client";

import { useState } from "react";
import { BookOpen, Check, Phone, Salad, TriangleAlert, X } from "lucide-react";
import { EATING_WELL, GUIDE_TOPICS, TRIMESTER_GUIDE, WARNING_SIGNS, type GuideTopic } from "@/lib/pregnancyContent";
import { helpFor, telLink } from "@/lib/helplines";
import { useProfileStore } from "@/lib/store";
import { CardHead } from "./ui";

export function TrimesterGuide({ trimester }: { trimester: 1 | 2 | 3 }) {
  const [t, setT] = useState<1 | 2 | 3>(trimester);
  const [topic, setTopic] = useState<GuideTopic>("expect");
  const section = TRIMESTER_GUIDE[t][topic];
  const names = { 1: "1st", 2: "2nd", 3: "3rd" } as const;
  return (
    <section className="card">
      <CardHead icon={BookOpen} title="Your trimester guide" />
      <div className="fade-x -mx-1 flex gap-2 px-1 pb-1" role="tablist" aria-label="Trimester">
        {([1, 2, 3] as const).map((n) => (
          <button key={n} type="button" role="tab" aria-selected={t === n} data-selected={t === n} className="chip shrink-0" onClick={() => setT(n)}>
            {names[n]}
            {n === trimester ? " · now" : ""}
          </button>
        ))}
      </div>
      <div className="fade-x -mx-1 mt-3 flex gap-1 border-b border-line px-1" role="tablist" aria-label="Topic">
        {GUIDE_TOPICS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={topic === g.id}
            onClick={() => setTopic(g.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[15px] font-semibold transition-colors ${
              topic === g.id ? "border-primary text-primary-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        <p className="text-ink">{section.intro}</p>
        <div className={`mt-4 grid gap-5 ${section.avoid ? "sm:grid-cols-2" : ""}`}>
          <div>
            {section.avoid && <p className="label mb-2">Safe and helpful</p>}
            <ul className="space-y-2">
              {section.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[15px] text-ink">
                  <Check size={16} className="mt-[5px] shrink-0 text-accent-ink" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          {section.avoid && (
            <div>
              <p className="label mb-2 !text-[#9B1B30]">Best avoided</p>
              <ul className="space-y-2">
                {section.avoid.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[15px] text-ink">
                    <X size={16} className="mt-[5px] shrink-0 text-[#9B1B30]" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {(topic === "workouts" || topic === "walks") && (
          <p className="mt-4 text-sm text-ink-soft">
            Stop and call your doctor if you have pain, bleeding, dizziness, fluid leaking or contractions while moving.
          </p>
        )}
      </div>
    </section>
  );
}

export function WarningSigns() {
  const country = useProfileStore((s) => s.profile?.country);
  const help = helpFor(country);
  return (
    <section className="rounded-[20px] border-2 border-primary bg-surface p-5 sm:p-6" aria-labelledby="warning-signs">
      <h2 id="warning-signs" className="flex items-center gap-2 font-display text-[1.45rem] leading-tight text-ink">
        <TriangleAlert size={20} className="shrink-0 text-primary-ink" aria-hidden />
        Call your doctor straight away if you have
      </h2>
      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {WARNING_SIGNS.map((w) => (
          <li key={w} className="flex gap-2.5 text-[15px] text-ink">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            {w}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a href={telLink(help.emergency.number)} className="btn bg-danger text-white hover:brightness-105">
          <Phone size={16} aria-hidden /> Call {help.emergency.number}
        </a>
        <p className="text-sm text-ink-soft">Or call your hospital or maternity unit. Don&apos;t wait until your next check-up.</p>
      </div>
    </section>
  );
}

export function EatingWell() {
  return (
    <section className="card">
      <CardHead icon={Salad} title="Eating well for two of you" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="label mb-2">Eat more of</p>
          <ul className="space-y-2">
            {EATING_WELL.eat.map((p) => (
              <li key={p} className="flex gap-2.5 text-[15px] text-ink">
                <Check size={16} className="mt-[5px] shrink-0 text-accent-ink" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label mb-2 !text-[#9B1B30]">Best avoided</p>
          <ul className="space-y-2">
            {EATING_WELL.avoid.map((p) => (
              <li key={p} className="flex gap-2.5 text-[15px] text-ink">
                <X size={16} className="mt-[5px] shrink-0 text-[#9B1B30]" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-[15px] text-ink">{EATING_WELL.extra}</p>
    </section>
  );
}
