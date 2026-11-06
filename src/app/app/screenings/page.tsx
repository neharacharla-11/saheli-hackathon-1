import type { Metadata } from "next";
import { ScreeningsPage } from "@/components/care/Screenings";

export const metadata: Metadata = { title: "Screenings" };

export default function Page() {
  return <ScreeningsPage />;
}
