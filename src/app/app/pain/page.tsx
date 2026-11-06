import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Pain diary" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CARE" title="Your pain diary" lead="Log period pain so your doctor sees the full picture." />
      <ComingSoon what="Pain diary" />
    </>
  );
}
