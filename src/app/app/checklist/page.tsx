import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ChecklistView } from "@/components/checklist/ChecklistView";
import { Reminders } from "@/components/reminders/Reminders";

export const metadata: Metadata = { title: "Checklist" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="TODAY" title="Your daily care" lead="Supplements, medicines and water, ticked off in a tap." />
      <ChecklistView />
      <div className="mt-10">
        <Reminders />
      </div>
    </>
  );
}
