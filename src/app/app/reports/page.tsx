import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ReportsClient } from "@/components/health/ReportsClient";

export const metadata: Metadata = { title: "My reports" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="MY REPORTS"
        title="Your reports, explained"
        lead="Upload a blood report and Saheli explains every number in plain words, with what to eat and how to move."
      />
      <ReportsClient />
    </>
  );
}
