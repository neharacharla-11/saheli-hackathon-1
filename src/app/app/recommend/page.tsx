import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Recommend" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="RECOMMEND" title="Tell us what you'd love in Saheli" lead="Your ideas shape what we build next." />
      <ComingSoon what="Recommend" />
    </>
  );
}
