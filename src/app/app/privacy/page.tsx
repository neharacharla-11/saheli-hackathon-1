import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { DeleteEverything, DiscreetMode, OurPromise, PinLock, TrustSection } from "@/components/settings/PrivacySections";

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
        {/* "Your Saheli account: encrypted cloud backup" and "Back up to a file" go here. */}
        <DeleteEverything />
      </div>
    </>
  );
}
