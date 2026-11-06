import type { Metadata } from "next";
import { TodayHeader } from "@/components/today/TodayHeader";
import { ComingSoon } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <>
      <TodayHeader />
      <ComingSoon what="Your full Today page" />
    </>
  );
}
