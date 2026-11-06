import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coach",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function CoachLayout({ children }: LayoutProps<"/coach">) {
  return children;
}
