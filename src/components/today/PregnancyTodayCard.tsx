"use client";

import Link from "next/link";
import { ArrowRight, CalendarHeart, Footprints, HeartPulse } from "lucide-react";
import type { ReactNode } from "react";
import { daysBetween, formatShort, parseISODate, toISODate, todayISO } from "@/lib/dates";
import { bpLevel, pregnancyWeek, TRIMESTER_LABEL } from "@/lib/pregnancy";
import { weekInfo } from "@/lib/pregnancyContent";
import { useProfileStore } from "@/lib/store";

const BP_WORD = { normal: "Healthy", low: "Low", raised: "A little high", high: "High, call your doctor", severe: "Very high, go now" } as const;

/** Today's hero card when she's pregnant: replaces the cycle card. */
export function PregnancyTodayCard() {
  const profile = useProfileStore((s) => s.profile);
  const appts = useProfileStore((s) => s.appointments);
  const bp = useProfileStore((s) => s.bp);
  const kicks = useProfileStore((s) => s.kicks);
  if (!profile || profile.stage !== "pregnancy" || !profile.dueDate) return null;

  const today = todayISO();
  const now = pregnancyWeek(profile.dueDate, today);
  const info = weekInfo(now.week);
  const due = parseISODate(profile.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const toGo =
    now.daysToGo > 1 ? `${now.daysToGo} days to go` : now.daysToGo === 1 ? "1 day to go" : now.daysToGo === 0 ? "Due today" : "Past your due date";

  const next = (appts ?? []).filter((a) => a.kind !== "plan" && a.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const latestBp = [...(bp ?? [])].sort((a, b) => b.at.localeCompare(a.at))[0];
  const latestKick = [...(kicks ?? [])].sort((a, b) => b.start.localeCompare(a.start))[0];
  const level = latestBp ? bpLevel(latestBp.sys, latestBp.dia) : null;
  const kickMins = latestKick
    ? Math.max(1, Math.round((new Date(latestKick.end).getTime() - new Date(latestKick.start).getTime()) / 60_000))
    : 0;

  return (
    <section className="mb-5 rounded-[32px] border border-line bg-surface p-5 sm:p-8" aria-label="Your pregnancy this week">
      <div className="grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="mx-auto grid h-[160px] w-[160px] place-items-center rounded-full bg-surface-2 sm:h-[180px] sm:w-[180px]">
          <div className="text-center">
            <p className="label">Week</p>
            <p className="font-display text-[3.5rem] leading-none text-primary-ink tabular">{now.week}</p>
            <p className="mt-1 text-xs text-ink-soft tabular">day {now.day}</p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="label">{TRIMESTER_LABEL[now.trimester]}</p>
          <p className="mt-1 font-display text-[1.6rem] leading-snug text-ink sm:text-[1.9rem]">Baby is about the size of {info.size}</p>
          <p className="mt-1.5 text-[15px] text-ink-soft tabular">
            {toGo} · due {due}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile icon={CalendarHeart} label="Next scan">
          {next ? (
            <>
              <span className="block font-semibold text-ink">{next.title}</span>
              <span className="block text-sm text-ink-soft tabular">
                {formatShort(next.date)} · {daysBetween(today, next.date) === 0 ? "today" : `in ${daysBetween(today, next.date)} days`}
              </span>
            </>
          ) : (
            <span className="text-sm text-ink-soft">Add your scans</span>
          )}
        </Tile>
        <Tile icon={HeartPulse} label="Blood pressure">
          {latestBp && level ? (
            <>
              <span className="block font-display text-[1.5rem] leading-none text-ink tabular">
                {latestBp.sys}/{latestBp.dia}
              </span>
              <span className={`mt-1 block text-sm ${level === "high" || level === "severe" ? "font-semibold text-[#9B1B30]" : "text-ink-soft"}`}>
                {BP_WORD[level]}
              </span>
            </>
          ) : (
            <span className="text-sm text-ink-soft">No readings yet</span>
          )}
        </Tile>
        <Tile icon={Footprints} label="Kick count">
          {latestKick ? (
            <>
              <span className="block font-display text-[1.5rem] leading-none text-ink tabular">
                {latestKick.count} in {kickMins} min
              </span>
              <span className="mt-1 block text-sm text-ink-soft tabular">{formatShort(toISODate(new Date(latestKick.start)))}</span>
            </>
          ) : (
            <span className="text-sm text-ink-soft">{now.week >= 28 ? "Count today" : "From week 28"}</span>
          )}
        </Tile>
      </div>

      <Link href="/app/stage" className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary-ink hover:underline">
        Open your pregnancy week by week <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}

function Tile({ icon: Icon, label, children }: { icon: typeof CalendarHeart; label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
        <Icon size={14} className="text-primary-ink" aria-hidden /> {label}
      </p>
      {children}
    </div>
  );
}
