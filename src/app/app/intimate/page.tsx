import type { Metadata } from "next";
import { IntimatePage } from "@/components/care/Intimate";

export const metadata: Metadata = { title: "Intimate health" };

export default function Page() {
  return <IntimatePage />;
}
