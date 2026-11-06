"use client";

import { useEffect } from "react";
import { ClipboardCheck } from "lucide-react";
import { formatShort } from "@/lib/dates";
import { setPlanRequest } from "@/lib/myDay";
import { activeProfileStore, useProfileStore } from "@/lib/store";
import { Pill } from "@/components/nourish/bits";

/** Her plan from Neha: meal by meal (diet) or day by day (workout). */
export function CoachPlanCard({ kind }: { kind: "diet" | "workout" }) {
  const req = useProfileStore((s) => (kind === "diet" ? s.dietRequest : s.workoutRequest) ?? null);
  const plan = req?.plan;

  // Keep "New" while she's on the page; mark it seen when she leaves.
  const hasPlan = !!plan;
  useEffect(() => {
    if (!hasPlan) return;
    return () => {
      const s = activeProfileStore().getState();
      const cur = kind === "diet" ? s.dietRequest : s.workoutRequest;
      if (cur?.plan && cur.seen === false) setPlanRequest(kind, { ...cur, seen: true });
    };
  }, [hasPlan, kind]);

  if (!plan) return null;
  const isNew = req?.seen === false;
  const updating = req?.status === "waiting" || req?.status === "changes";

  return (
    <section className="card" aria-labelledby={`coach-plan-${kind}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label mb-1">FROM NEHA · {formatShort(plan.writtenAt.slice(0, 10)).toUpperCase()}</p>
          <h2 id={`coach-plan-${kind}`} className="flex items-center gap-2 font-display text-[1.6rem] leading-tight text-ink">
            <ClipboardCheck size={22} className="shrink-0 text-primary-ink" aria-hidden="true" />
            {kind === "diet" ? "Your diet plan from your coach" : "Your workout plan from your coach"}
          </h2>
        </div>
        {isNew && !updating && <Pill tone="primary">New</Pill>}
        {updating && <Pill tone="amber">Update requested</Pill>}
      </div>
      {plan.intro && <p className="max-w-[720px] text-[15px] leading-relaxed text-ink">{plan.intro}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {plan.meals.map((m, i) => (
          <div
            key={`${m.slot}-${i}`}
            className={`rounded-2xl bg-surface-2 p-4 ${i === plan.meals.length - 1 && plan.meals.length % 2 === 1 ? "sm:col-span-2" : ""}`}
          >
            <p className="label mb-1">{m.slot}</p>
            {m.title && <p className="mb-1 font-semibold text-ink">{m.title}</p>}
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{m.items}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        Written for you personally. If anything doesn&apos;t suit your body or your doctor&apos;s advice, tell Neha and she&apos;ll change it.
      </p>
    </section>
  );
}
