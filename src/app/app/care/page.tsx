import type { Metadata } from "next";
import { ContraceptionPage } from "@/components/care/Contraception";

export const metadata: Metadata = { title: "Contraception" };

export default function Page() {
  return <ContraceptionPage />;
}
