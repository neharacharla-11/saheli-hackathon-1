import type { Metadata } from "next";
import { MoreList } from "@/components/MoreList";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "More" };

export default function MorePage() {
  return (
    <>
      <PageHeader title="More" lead="Everything else Saheli does for you." />
      <MoreList />
    </>
  );
}
