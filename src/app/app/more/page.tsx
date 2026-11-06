import type { Metadata } from "next";
import { LanguagePicker } from "@/components/LanguagePicker";
import { MoreList } from "@/components/MoreList";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "More" };

export default function MorePage() {
  return (
    <>
      <PageHeader title="More" lead="Everything else Saheli does for you." />
      <MoreList />
      <div className="mt-5 flex items-center justify-between gap-3 rounded-[20px] border border-line bg-surface px-4 py-3">
        <span className="font-medium text-ink">Language</span>
        <LanguagePicker />
      </div>
    </>
  );
}
