import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Intimate health" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CARE" title="Intimate health" lead="Plain answers to private questions." />
      <ComingSoon what="Intimate health" />
    </>
  );
}
