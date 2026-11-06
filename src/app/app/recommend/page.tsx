import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RecommendView } from "@/components/settings/RecommendView";

export const metadata: Metadata = { title: "Recommend" };

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="RECOMMEND"
        title="Tell us what you'd love in Saheli"
        lead="A song or chant, a recipe, a workout, a feature, anything. Your ideas shape what we build next."
      />
      <RecommendView />
    </>
  );
}
