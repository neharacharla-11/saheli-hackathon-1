import type { Metadata } from "next";
import { BirthPlanPage } from "@/components/pregnancy/BirthPlan";

export const metadata: Metadata = { title: "Birth plan" };

export default function Page() {
  return <BirthPlanPage />;
}
