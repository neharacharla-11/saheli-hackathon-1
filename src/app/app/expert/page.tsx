import type { Metadata } from "next";
import { ExpertPage } from "@/components/care/Expert";

export const metadata: Metadata = { title: "Talk to an expert" };

export default function Page() {
  return <ExpertPage />;
}
