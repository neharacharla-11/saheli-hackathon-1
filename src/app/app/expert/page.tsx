import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Talk to an expert" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CARE" title="Talk to an expert" lead="Ask Neha for a personal plan." />
      <ComingSoon what="Talk to an expert" />
    </>
  );
}
