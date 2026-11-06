"use client";

import Link from "next/link";
import { FileHeart } from "lucide-react";
import { adviceFor, formatValue, LAB_BY_KEY, latestResults, STATUS_LABEL } from "@/lib/labTests";
import { useProfileStore } from "@/lib/store";

/** One line of food (or movement) advice per result outside the usual range. */
export function FromReports({ kind }: { kind: "food" | "move" }) {
  const reports = useProfileStore((s) => s.reports);
  if (!reports?.length) return null;
  const out = latestResults(reports).filter((r) => r.status !== "normal");
  const rows = out
    .map((r) => ({ r, advice: adviceFor(r.key, r.value) }))
    .filter((x) => x.advice && (kind === "food" ? x.advice.food : x.advice.move))
    .slice(0, 5);
  if (!rows.length) return null;

  return (
    <section className="card border-[color-mix(in_srgb,var(--primary)_60%,transparent)]" aria-labelledby={`from-reports-${kind}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={`from-reports-${kind}`} className="flex items-center gap-2 font-semibold text-ink">
          <FileHeart size={18} className="text-primary-ink" aria-hidden="true" />
          From your reports
        </h2>
        <Link href="/app/reports" className="text-sm font-semibold text-primary-ink underline-offset-4 hover:underline">
          My reports
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map(({ r, advice }) => {
          const t = LAB_BY_KEY[r.key];
          return (
            <li key={r.key} className="text-[15px] leading-relaxed">
              <span className="font-semibold text-ink">
                {t.name} {STATUS_LABEL[r.status].toLowerCase()} ({formatValue(r.key, r.value)} {t.unit}).
              </span>{" "}
              <span className="text-ink-soft">{kind === "food" ? advice!.food : advice!.move}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
