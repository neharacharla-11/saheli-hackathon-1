import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Health check" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="HEALTH" title="What your body keeps telling you" lead="Patterns from your logs, and the tests worth asking your doctor about." />
      <ComingSoon what="Health check" />
    </>
  );
}
