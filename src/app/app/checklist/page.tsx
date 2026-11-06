import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Checklist" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="TODAY" title="Your daily care" lead="Supplements, medicines and water, ticked off in a tap." />
      <ComingSoon what="Checklist" />
    </>
  );
}
