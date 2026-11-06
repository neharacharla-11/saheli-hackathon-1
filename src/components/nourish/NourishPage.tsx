"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CoachPlanCard } from "@/components/coach/CoachPlanCard";
import { PlanRequestCard } from "@/components/coach/PlanRequestCard";
import { useMyDay } from "@/lib/myDay";
import { EatenToday } from "./EatenToday";
import { FromReports } from "./FromReports";
import { Grocery } from "./Grocery";
import { MyNumbers } from "./MyNumbers";
import { PhaseMeals } from "./PhaseMeals";
import { Thali } from "./Thali";
import { TodaysMeals } from "./TodaysMeals";

export function NourishPage() {
  const { profile } = useMyDay();
  if (profile?.stage === "first-period") return <GrowingUpFood />;

  return (
    <>
      <PageHeader
        eyebrow="NOURISH"
        title="Food that fits your phase"
        lead="Meals that match how your body feels today, with Indian food first. Log what you eat, snap your plate, and get a plan from your coach."
      />
      <div className="flex flex-col gap-5">
        <FromReports kind="food" />
        <EatenToday />
        <Thali />
        <TodaysMeals />
        <CoachPlanCard kind="diet" />
        <PhaseMeals />
        <Grocery />
        <MyNumbers />
        <PlanRequestCard kind="diet" />
      </div>
    </>
  );
}

/** For girls with their first periods: food explained kindly, no numbers, no diets. */
function GrowingUpFood() {
  const cards = [
    {
      title: "Eat regular meals",
      body: "Your body is growing fast. Breakfast, lunch, a snack and dinner give you energy for school, play and your period. Skipping meals can make cramps and tiredness worse.",
    },
    {
      title: "Foods that help on period days",
      body: "Warm dal and rice, ragi, leafy greens like palak, dates and a little jaggery, eggs if you eat them. A squeeze of lemon helps your body use the iron in your food.",
    },
    {
      title: "Drink water",
      body: "Keep a water bottle with you. Warm water or ginger tea can soothe cramps.",
    },
    {
      title: "All foods can fit",
      body: "There are no good or bad foods. A sweet treat now and then is okay. Listen to your tummy: eat when you're hungry and stop when you're full.",
    },
  ];
  return (
    <>
      <PageHeader eyebrow="NOURISH" title="Food that helps you grow" lead="Simple ideas to feel strong and comfortable, including on your period days." />
      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((c) => (
          <section key={c.title} className="card">
            <h2 className="mb-2 flex items-center gap-2 font-display text-[1.35rem] text-ink">
              <Heart size={18} className="text-primary-ink" aria-hidden="true" />
              {c.title}
            </h2>
            <p className="text-[15px] text-ink-soft">{c.body}</p>
          </section>
        ))}
        <section className="panel sm:col-span-2">
          <p className="text-[15px] text-ink">
            If you feel very tired, dizzy or your periods are very heavy, tell a parent, your school nurse or a doctor. They can help.
          </p>
        </section>
      </div>
    </>
  );
}
