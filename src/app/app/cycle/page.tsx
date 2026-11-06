import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { CycleView } from "@/components/cycle/CycleView";

export const metadata: Metadata = { title: "Cycle" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CYCLE" title="Your cycle" lead="Where you are today, what's coming next and what your body is telling you." />
      <CycleView />
    </>
  );
}
