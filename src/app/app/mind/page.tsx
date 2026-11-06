import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Mind" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="MIND" title="How are you, really?" lead="Check in, breathe, write it down and see your patterns." />
      <ComingSoon what="Mind" />
    </>
  );
}
