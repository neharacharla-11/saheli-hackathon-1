"use client";

import { PageHeader } from "@/components/PageHeader";
import { CoachPlanCard } from "@/components/coach/CoachPlanCard";
import { PlanRequestCard } from "@/components/coach/PlanRequestCard";
import { FromReports } from "@/components/nourish/FromReports";
import { useMyDay } from "@/lib/myDay";
import { StepsCard } from "./StepsCard";
import { WorkoutCard } from "./WorkoutCard";

export function MovePage() {
  const { profile } = useMyDay();
  const young = profile?.stage === "first-period";
  return (
    <>
      <PageHeader
        eyebrow="MOVE"
        title="Move with your body"
        lead={young ? "Fun, gentle ways to move that can ease cramps and lift your mood." : "Workouts that change with your energy through the month, at home or at the gym."}
      />
      <div className="flex flex-col gap-5">
        {!young && <FromReports kind="move" />}
        {!young && <StepsCard />}
        <WorkoutCard />
        {!young && <CoachPlanCard kind="workout" />}
        {!young && <PlanRequestCard kind="workout" />}
      </div>
    </>
  );
}
