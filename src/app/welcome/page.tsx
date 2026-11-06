import type { Metadata } from "next";
import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Onboarding />
    </Suspense>
  );
}
