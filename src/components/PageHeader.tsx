import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="label mb-1.5">{eyebrow}</p>}
      <h1 className="font-display text-[2.1rem] leading-[1.1] text-ink sm:text-[2.6rem]">{title}</h1>
      {lead && <p className="mt-2.5 max-w-[672px] text-ink-soft">{lead}</p>}
    </header>
  );
}

/** Placeholder for pages that arrive in a later build. */
export function ComingSoon({ what }: { what: string }) {
  return (
    <div className="card flex flex-col items-start gap-3">
      <p className="text-ink">{what} is being set up for you.</p>
      <p className="text-sm text-ink-soft">For now, start your day on Today.</p>
      <Link href="/app" className="btn btn-primary">
        Go to Today
      </Link>
    </div>
  );
}
