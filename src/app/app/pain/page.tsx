import type { Metadata } from "next";
import { PainDiaryPage } from "@/components/care/PainDiary";

export const metadata: Metadata = { title: "Pain diary" };

export default function Page() {
  return <PainDiaryPage />;
}
