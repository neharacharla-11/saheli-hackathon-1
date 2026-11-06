import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "My stage" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="MY STAGE" title="Saheli grows with you" lead="Care that changes with every stage of your life." />
      <ComingSoon what="My stage" />
    </>
  );
}
