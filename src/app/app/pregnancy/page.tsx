import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Pregnancy" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="PREGNANCY" title="Your pregnancy" lead="Week by week, with you." />
      <ComingSoon what="Pregnancy" />
    </>
  );
}
