import type { Metadata } from "next";
import { CirclePage } from "@/components/circle/CirclePage";

export const metadata: Metadata = { title: "Circle" };

export default function Page() {
  return <CirclePage />;
}
