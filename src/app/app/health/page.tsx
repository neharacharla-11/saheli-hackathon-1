import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { HealthCheckClient } from "@/components/health/HealthCheckClient";

export const metadata: Metadata = { title: "Health check" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="HEALTH CHECK"
        title="What your body keeps telling you"
        lead="Saheli reads your last 3 months of logs and suggests tests worth asking your doctor about, with the reason in plain words."
      />
      <HealthCheckClient />
    </>
  );
}
