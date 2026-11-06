import type { Metadata } from "next";
import { TodayHeader } from "@/components/today/TodayHeader";
import { TodayView } from "@/components/today/TodayView";
import { PregnancyTodayCard } from "@/components/today/PregnancyTodayCard";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <>
      <TodayHeader />
      {/* Cards from other phases go in as stageCard (pregnancy) and extra (e.g. sugar). */}
      <TodayView stageCard={<PregnancyTodayCard />} />
    </>
  );
}
