import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="SETTINGS" title="Settings" lead="Language, themes, family profiles and sample data." />
      <ComingSoon what="Settings" />
    </>
  );
}
