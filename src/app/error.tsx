"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16 text-center">
      <div className="flex max-w-md flex-col items-center">
        <Logo size="md" tagline />
        <h1 className="font-display mt-10 text-[2.4rem] leading-tight text-ink">Something didn&apos;t load.</h1>
        <p className="mt-2 text-ink-soft">Your data is safe on this device. Try once more.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            Home page
          </Link>
        </div>
      </div>
    </main>
  );
}
