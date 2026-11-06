import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MindBottom, MindTop } from "@/components/mind/MindView";

export const metadata: Metadata = { title: "Mind" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="MIND" title="How are you, really?" lead="Check in, breathe, listen to something calm, and see your patterns." />
      <MindTop />
      <div className="mt-5">
        <MindBottom />
      </div>
    </>
  );
}
