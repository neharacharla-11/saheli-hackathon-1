import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Sugar and body" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="HEALTH" title="Track what your doctor asks about" lead="Blood sugar and body measurements in one place." />
      <ComingSoon what="Sugar and body" />
    </>
  );
}
