import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Bestie" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="COMPANION" title="Your companion" lead="Talk it through, any time." />
      <ComingSoon what="Bestie" />
    </>
  );
}
