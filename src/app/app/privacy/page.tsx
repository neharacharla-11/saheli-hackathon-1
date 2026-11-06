import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="PRIVACY" title="Your data, your rules" lead="Everything stays on this device unless you choose otherwise." />
      <ComingSoon what="Privacy" />
    </>
  );
}
