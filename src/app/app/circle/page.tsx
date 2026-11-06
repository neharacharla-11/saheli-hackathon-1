import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Circle" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="CIRCLE" title="Let your people in, gently" lead="Help the people who love you understand how you feel, without sharing your logs." />
      <ComingSoon what="Circle" />
    </>
  );
}
