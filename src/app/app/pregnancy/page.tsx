import type { Metadata } from "next";
import { PregnancyView } from "@/components/pregnancy/PregnancyView";

export const metadata: Metadata = { title: "Pregnancy" };

export default function Page() {
  return <PregnancyView />;
}
