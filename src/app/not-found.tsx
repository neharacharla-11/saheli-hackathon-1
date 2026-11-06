import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16 text-center">
      <div className="flex max-w-md flex-col items-center">
        <Logo size="md" tagline />
        <h1 className="font-display mt-10 text-[2.4rem] leading-tight text-ink">This page wandered off.</h1>
        <p className="mt-2 text-ink-soft">The link may be old, or the page has moved. Let&apos;s get you somewhere kind.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/app" className="btn btn-primary">
            Open Saheli
          </Link>
          <Link href="/" className="btn btn-secondary">
            Home page
          </Link>
        </div>
      </div>
    </main>
  );
}
