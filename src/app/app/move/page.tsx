import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Move" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="MOVE" title="Move with your body" lead="Workouts that change with your energy through the month." />
      <ComingSoon what="Move" />
    </>
  );
}
