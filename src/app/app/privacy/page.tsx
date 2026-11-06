import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { DeleteEverything, DiscreetMode, OurPromise, PinLock } from "@/components/settings/PrivacySections";
import { CloudBackup } from "@/components/backup/CloudBackup";
import { TrustSection } from "@/components/backup/TrustSection";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="PRIVACY" title="Your data, your rules" lead="Everything stays on this device unless you choose otherwise." />
      <div className="space-y-5">
        <OurPromise />
        <div className="grid items-start gap-5 md:grid-cols-2">
          <PinLock />
          <DiscreetMode />
        </div>
        <TrustSection />
        <CloudBackup />
        {/* "Back up to a file" goes here. */}
        <DeleteEverything />
      </div>
    </>
  );
}
