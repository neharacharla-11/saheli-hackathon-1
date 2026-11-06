"use client";

import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FileText, FlaskConical, Info, PhoneCall } from "lucide-react";
import { chipHasResults, countSymptoms, everydayCheckups, type Suggestion } from "@/lib/healthCheck";
import type { LabKey } from "@/lib/labTests";
import { useHealthData } from "./useHealthData";

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2 className="font-display text-[1.6rem] leading-tight text-ink">{children}</h2>
      {aside}
    </div>
  );
}

export function ResultsInPill() {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] px-2.5 text-xs font-semibold text-accent-ink">
      <Check size={12} strokeWidth={3} aria-hidden="true" /> Results in
    </span>
  );
}

function SuggestionCard({ s, have }: { s: Suggestion; have: Set<LabKey> }) {
  const anyIn = s.tests.some((t) => chipHasResults(t, have));
  return (
    <article className="card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[1.35rem] leading-tight text-ink">{s.title}</h3>
        {anyIn && <ResultsInPill />}
      </div>
      <p className="mt-2 text-ink">{s.reason}</p>
      {s.extra && <p className="mt-2 text-ink-soft">{s.extra}</p>}
      <p className="label mt-4 mb-2">Ask your doctor about</p>
      <ul className="flex flex-wrap gap-2">
        {s.tests.map((t) => {
          const done = chipHasResults(t, have);
          return (
            <li
              key={t.label}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                done ? "border-transparent bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] text-accent-ink" : "border-line bg-surface text-ink"
              }`}
            >
              {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <FlaskConical size={14} className="text-ink-soft" aria-hidden="true" />}
              {t.label}
              {done && <span className="sr-only">(you have results)</span>}
            </li>
          );
        })}
      </ul>
      {s.link && (
        <Link href={s.link.href} className="btn btn-secondary btn-sm mt-5 self-start">
          {s.link.label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

export function HealthCheckClient() {
  const { profile, dayLogs, today, suggestions, have } = useHealthData();
  if (!profile) return null;
  const counts = countSymptoms(dayLogs, today);
  const checkups = everydayCheckups(profile);
  const young = profile.stage === "first-period";

  return (
    <div className="space-y-10">
      {profile.stage === "pregnancy" && (
        <div className="panel flex items-start gap-3">
          <Info size={18} className="mt-[3px] shrink-0 text-primary-ink" aria-hidden="true" />
          <p className="text-ink">
            In pregnancy your care team plans your tests. Your scans and check-ups are on the{" "}
            <Link href="/app/pregnancy" className="font-semibold text-primary-ink underline underline-offset-2">
              Pregnancy page
            </Link>
            .
          </p>
        </div>
      )}

      <section aria-labelledby="suggested">
        <SectionTitle aside={<p className="text-sm text-ink-soft tabular">From {counts.daysLogged} days you logged in the last 3 months</p>}>
          <span id="suggested">Suggested for you</span>
        </SectionTitle>

        {counts.daysLogged === 0 ? (
          <div className="card flex flex-col items-start gap-3">
            <p className="text-ink">Log how you feel for a few days and Saheli will look for patterns worth asking your doctor about.</p>
            <Link href="/app" className="btn btn-primary">
              Check in on Today
            </Link>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="card flex flex-col items-start gap-3">
            <p className="text-ink">Nothing in your logs needs a test right now. Keep logging and Saheli will tell you if a pattern shows up.</p>
            <p className="text-sm text-ink-soft">Your everyday check-ups below are still worth keeping up with.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} s={s} have={have} />
            ))}
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
          <Info size={16} className="mt-[3px] shrink-0" aria-hidden="true" />
          Suggestions to discuss with your doctor, never a diagnosis.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] border-2 border-primary bg-surface p-5 sm:p-6" aria-labelledby="call-now">
        <h2 id="call-now" className="flex items-center gap-2 font-semibold text-ink">
          <PhoneCall size={18} className="shrink-0 text-primary-ink" aria-hidden="true" /> Call your doctor today if you have
        </h2>
        <ul className="mt-2 grid gap-x-6 gap-y-1 text-ink sm:grid-cols-2">
          <li>Bleeding that soaks a pad or tampon every hour</li>
          <li>Sudden, severe pain in your belly or pelvis</li>
          <li>Fainting, or feeling dizzy and very weak</li>
          <li>A headache with blurred vision or a stiff neck</li>
        </ul>
      </section>

      <section aria-labelledby="everyday">
        <SectionTitle>
          <span id="everyday">Everyday check-ups</span>
        </SectionTitle>
        <div className="card !py-2">
          <ul className="divide-y divide-line">
            {checkups.map((c) => {
              const done = c.keys.some((k) => have.has(k));
              const body = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{c.name}</span>
                    <span className="block text-sm text-ink-soft">{c.often}</span>
                  </span>
                  {done ? <ResultsInPill /> : c.href ? <ArrowRight size={16} className="shrink-0 text-ink-soft" aria-hidden="true" /> : null}
                </>
              );
              return (
                <li key={c.id}>
                  {c.href && !done ? (
                    <Link href={c.href} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-surface-2">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link href="/app/reports" className="card group flex items-center gap-4 hover:bg-surface-2">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink group-hover:bg-surface">
            <FileText size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Got your results?</span>
            <span className="block text-sm text-ink-soft">Upload a report and Saheli explains every number.</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
        </Link>
        <Link href="/app/report" className="card group flex items-center gap-4 hover:bg-surface-2">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink group-hover:bg-surface">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Take it to your doctor</span>
            <span className="block text-sm text-ink-soft">One printable page with your cycles, symptoms and results.</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
        </Link>
      </div>

      <p className="text-center text-sm text-ink-soft">
        {young ? "Saheli explains, it doesn't diagnose. Talk to a trusted adult and your doctor." : "Saheli explains, it doesn't diagnose. Talk to your doctor."}
      </p>
    </div>
  );
}
