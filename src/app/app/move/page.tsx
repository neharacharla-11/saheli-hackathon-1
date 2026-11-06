import type { Metadata } from "next";
import { MovePage } from "@/components/move/MovePage";

export const metadata: Metadata = { title: "Move" };

export default function Page() {
  return <MovePage />;
}
