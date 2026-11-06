import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Nourish" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="NOURISH" title="Food that fits your phase" lead="Meals that match how your body feels today, with Indian food first." />
      <ComingSoon what="Nourish" />
    </>
  );
}
