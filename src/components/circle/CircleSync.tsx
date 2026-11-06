"use client";

import { useEffect } from "react";
import { useActiveId, useAppStore } from "@/lib/store";
import { syncAllOnOpen } from "./sync";

/** Mounted in the app shell: refreshes her Circle links when she opens Saheli. */
export function CircleSync() {
  const id = useActiveId();
  const sample = useAppStore((s) => s.sample);
  useEffect(() => {
    if (id && !sample) syncAllOnOpen(id);
  }, [id, sample]);
  return null;
}
