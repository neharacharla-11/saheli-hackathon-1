import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SugarLog } from "@/components/sugar/SugarLog";
import { BodyMeasures } from "@/components/sugar/BodyMeasures";

export const metadata: Metadata = { title: "Sugar and body" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="SUGAR AND BODY"
        title="Track what your doctor asks about"
        lead="Your blood sugar and body measurements in one place, kept on this phone and added to your doctor summary."
      />
      <div className="space-y-12">
        <SugarLog />
        <BodyMeasures />
        <p className="text-center text-sm text-ink-soft">Saheli explains, it doesn&apos;t diagnose. Talk to your doctor.</p>
      </div>
    </>
  );
}
