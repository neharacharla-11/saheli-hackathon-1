"use client";

import { useProfileStore } from "@/lib/store";
import { ConceivePage } from "./Conceive";
import { MenopausePage } from "./Menopause";
import { CyclePage, FirstPeriodsPage, PcosPage } from "./OtherStages";
import { PostpartumPage } from "./Postpartum";

/** My stage for every stage except pregnancy (the pregnancy page is shown by PregnancyStageGate). */
export function StagePage() {
  const stage = useProfileStore((s) => s.profile?.stage);
  switch (stage) {
    case "ttc":
      return <ConceivePage />;
    case "postpartum":
      return <PostpartumPage />;
    case "menopause":
      return <MenopausePage />;
    case "pcos":
      return <PcosPage />;
    case "first-period":
      return <FirstPeriodsPage />;
    default:
      return <CyclePage />;
  }
}
