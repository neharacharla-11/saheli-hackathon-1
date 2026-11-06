import type { Metadata } from "next";
import { CompanionChat } from "@/components/companion/CompanionChat";

export const metadata: Metadata = { title: "Companion" };

export default function Page() {
  return <CompanionChat />;
}
