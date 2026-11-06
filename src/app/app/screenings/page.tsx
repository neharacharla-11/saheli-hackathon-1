import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Screenings" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CARE" title="Checks for your age" lead="The screenings that matter for you, and when they're due." />
      <ComingSoon what="Screenings" />
    </>
  );
}
