import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MindBottom, MindTop } from "@/components/mind/MindView";
import { JournalCard } from "@/components/mind/JournalCard";
import { SleepCard } from "@/components/sync/SleepCard";

export const metadata: Metadata = { title: "Mind" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="MIND" title="How are you, really?" lead="Check in, breathe, listen to something calm, and see your patterns." />
      <MindTop sleep={<SleepCard />} />
      <div className="mt-5">
        <JournalCard />
      </div>
      <div className="mt-5">
        <MindBottom />
      </div>
    </>
  );
}
