"use client";

import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { healthSuggestions } from "@/lib/healthCheck";
import { tiredOnHeavyDays } from "@/lib/dailyCare";
import { todayISO } from "@/lib/dates";
import { useProfileStore } from "@/lib/store";
import type { ProfileData } from "@/lib/types";

/** "Saheli noticed a pattern": one slim card linking to Health check. */
export function PatternNudge() {
  const profile = useProfileStore((s) => s.profile);
  const dayLogs = useProfileStore((s) => s.dayLogs);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const reports = useProfileStore((s) => (s as ProfileData).reports);
  const pain = useProfileStore((s) => (s as ProfileData & { pain?: { date: string; score: number }[] }).pain);
  const today = todayISO();
  if (!profile || profile.stage === "first-period") return null;

  const heavy = tiredOnHeavyDays(dayLogs, today);
  let title: string;
  let line: string;
  let tests: string[] = [];
  if (heavy) {
    title = heavy.title;
    line = heavy.line;
    tests = heavy.tests;
  } else {
    const s = healthSuggestions({ profile, dayLogs, periodStarts, reports, pain, today })[0];
    if (!s) return null;
    title = s.title;
    line = s.reason;
    tests = s.tests.map((t) => t.label);
  }

  return (
    <Link
      href="/app/health"
      className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2/60 sm:px-5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-primary-ink">
        <Stethoscope size={19} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-accent-ink">Saheli noticed a pattern</span>
        <span className="block font-bold leading-snug text-ink">{title}</span>
        <span className="block text-sm leading-snug text-ink-soft">
          {line}
          {tests.length > 0 && ` Tests to ask about: ${tests.slice(0, 3).join(", ")}.`}
        </span>
      </span>
      <ArrowRight size={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
    </Link>
  );
}
