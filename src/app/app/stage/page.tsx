import type { Metadata } from "next";
import { PregnancyStageGate } from "@/components/pregnancy/StageGate";
import { StagePage } from "@/components/stage/StagePage";

export const metadata: Metadata = { title: "My stage" };

export default function Page() {
  return (
    <PregnancyStageGate>
      <StagePage />
    </PregnancyStageGate>
  );
}
