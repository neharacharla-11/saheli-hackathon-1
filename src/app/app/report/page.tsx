import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Doctor summary" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="HEALTH" title="Health summary" lead="One page to take to your doctor." />
      <ComingSoon what="Doctor summary" />
    </>
  );
}
