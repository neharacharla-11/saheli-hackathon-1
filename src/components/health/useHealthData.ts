"use client";

import { useMemo } from "react";
import { todayISO } from "@/lib/dates";
import { latestResults, type ReportLike } from "@/lib/labTests";
import { healthSuggestions, keysWithResults, type PainEntry } from "@/lib/healthCheck";
import { useProfileStore } from "@/lib/store";
import type { LabReport } from "@/lib/types";

const NO_REPORTS: LabReport[] = [];

/** Fields other pages own, read loosely so Health works whether or not they exist yet. */
export function loose<T>(state: unknown, key: string): T | undefined {
  return (state as Record<string, unknown> | null)?.[key] as T | undefined;
}

export function useReports(): LabReport[] {
  return useProfileStore((s) => s.reports ?? NO_REPORTS);
}

export function useHealthData() {
  const profile = useProfileStore((s) => s.profile);
  const dayLogs = useProfileStore((s) => s.dayLogs);
  const periodStarts = useProfileStore((s) => s.periodStarts);
  const reports = useReports();
  const painRaw = useProfileStore((s) => loose<unknown>(s, "pain"));
  const today = todayISO();

  return useMemo(() => {
    const pain: PainEntry[] = Array.isArray(painRaw)
      ? painRaw.filter((p): p is PainEntry => !!p && typeof p.date === "string" && typeof p.score === "number")
      : [];
    const reportLike = reports as ReportLike[];
    const suggestions = healthSuggestions({ profile, dayLogs, periodStarts, reports: reportLike, pain, today });
    return {
      profile,
      dayLogs,
      periodStarts,
      reports,
      pain,
      today,
      suggestions,
      latest: latestResults(reportLike),
      have: keysWithResults(reportLike, today),
    };
  }, [profile, dayLogs, periodStarts, reports, painRaw, today]);
}
