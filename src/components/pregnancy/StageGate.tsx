"use client";

import type { ReactNode } from "react";
import { PregnancyView, useShowsPregnancy } from "./PregnancyView";

/** On My stage: when she's pregnant (or just lost a pregnancy) show the pregnancy page, otherwise the other stages. */
export function PregnancyStageGate({ children }: { children: ReactNode }) {
  return useShowsPregnancy() ? <PregnancyView /> : <>{children}</>;
}
