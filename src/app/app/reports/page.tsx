import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "My reports" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="HEALTH" title="Your reports, explained" lead="Upload a blood report and see what each value means for you." />
      <ComingSoon what="My reports" />
    </>
  );
}
