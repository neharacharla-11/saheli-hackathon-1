import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Contraception" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CARE" title="Your contraception" lead="Saheli explains, it doesn't prescribe." />
      <ComingSoon what="Contraception" />
    </>
  );
}
