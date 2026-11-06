import type { Metadata } from "next";
import { NourishPage } from "@/components/nourish/NourishPage";

export const metadata: Metadata = { title: "Nourish" };

export default function Page() {
  return <NourishPage />;
}
