"use client";

import Link from "next/link";
import { ArrowRight, Droplet } from "lucide-react";
import { addDays, formatShort, todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";
import { fromMgdl, isUrgent, sugarBand, sugarStats, UNIT_LABEL, WHEN_LABEL } from "@/lib/sugar";
import { BandPill, UrgentSugar, useSugarReadings, useSugarUnit } from "./SugarLog";

/** "Today's sugar" on Today, only for women who log their sugar. */
export function TodaySugarCard() {
  const readings = useSugarReadings();
  const profile = useProfileStore((s) => s.profile);
  const [unit] = useSugarUnit();
  const today = todayISO();
  const diabetes = profile?.safety?.conditions?.includes("diabetes");
  const recent = readings.some((r) => r.at.slice(0, 10) >= addDays(today, -14));
  if (!profile || (!diabetes && !recent)) return null;

  const todays = readings.filter((r) => r.at.slice(0, 10) === today).sort((a, b) => (a.at < b.at ? -1 : 1));
  const stats = sugarStats(readings, today);
  const last = stats.last;
  const lastBand = last ? sugarBand(last.value, last.when) : null;

  return (
    <section className="space-y-3" aria-labelledby="today-sugar">
      {last && lastBand && isUrgent(lastBand) && last.at.slice(0, 10) === today && <UrgentSugar band={lastBand} country={profile.country} />}
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <h2 id="today-sugar" className="flex items-center gap-2 font-semibold text-ink">
            <Droplet size={18} className="text-primary-ink" aria-hidden="true" /> Today&apos;s sugar
          </h2>
          <Link href="/app/logs" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline">
            {todays.length ? "Add or see all" : "Add a reading"} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {todays.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {todays.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2">
                <span className="font-display text-[1.3rem] leading-none text-ink tabular">{fromMgdl(r.value, unit)}</span>
                <span className="text-xs text-ink-soft">{WHEN_LABEL[r.when]}</span>
                <BandPill band={sugarBand(r.value, r.when)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-soft">
            No reading yet today.
            {last ? ` Last: ${fromMgdl(last.value, unit)} ${UNIT_LABEL[unit]} on ${formatShort(last.at.slice(0, 10))}.` : ""}
          </p>
        )}
        {stats.inTargetPct !== null && (
          <p className="mt-3 text-sm text-ink-soft tabular">
            {stats.inTargetPct}% in target over 14 days
            {stats.fastingAvg !== null ? ` · fasting average ${fromMgdl(stats.fastingAvg, unit)} ${UNIT_LABEL[unit]}` : ""}
          </p>
        )}
      </div>
    </section>
  );
}
