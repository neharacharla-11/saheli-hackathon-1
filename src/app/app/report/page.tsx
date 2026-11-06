import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { DoctorSummary } from "@/components/health/DoctorSummary";

export const metadata: Metadata = { title: "Doctor summary" };

export default function Page() {
  return (
    <>
      <div className="no-print">
        <PageHeader eyebrow="DOCTOR SUMMARY" title="Take it to your doctor" lead="Your cycles, symptoms, patterns and results on one page." />
      </div>
      <DoctorSummary />
    </>
  );
}
