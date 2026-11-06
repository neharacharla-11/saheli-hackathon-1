import type { Metadata } from "next";
import { TodayHeader } from "@/components/today/TodayHeader";
import { TodayView } from "@/components/today/TodayView";
import { PregnancyTodayCard } from "@/components/today/PregnancyTodayCard";
import { TodaySugarCard } from "@/components/sugar/TodaySugarCard";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <>
      <TodayHeader />
      {/* Cards from other phases go in as stageCard (pregnancy) and extra (sugar). */}
      <TodayView stageCard={<PregnancyTodayCard />} extra={<TodaySugarCard />} />
    </>
  );
}
