"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Progress({ value, max, color = "var(--primary)", label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function CardTitle({
  icon: Icon,
  eyebrow,
  title,
  right,
  className = "",
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="label mb-1">{eyebrow}</p>}
        <h2 className="flex items-center gap-2 font-display text-[1.45rem] leading-tight text-ink">
          {Icon && <Icon size={20} className="shrink-0 text-primary-ink" aria-hidden="true" />}
          {title}
        </h2>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function Pill({ children, tone = "soft" }: { children: ReactNode; tone?: "soft" | "primary" | "green" | "amber" }) {
  const cls =
    tone === "primary"
      ? "bg-primary text-on-primary"
      : tone === "green"
        ? "bg-[color-mix(in_srgb,var(--accent)_25%,var(--surface))] text-accent-ink"
        : tone === "amber"
          ? "bg-[#FEF3C7] text-[#92400E]"
          : "bg-surface-2 text-primary-ink";
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

/** A labelled field wrapper. */
export function Field({ label, children, hint, htmlFor }: { label: string; children: ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Kind inline notice; the icon lines up with the first line of text. */
export function Notice({ icon: Icon, children, tone = "soft" }: { icon?: LucideIcon; children: ReactNode; tone?: "soft" | "error" }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ${
        tone === "error" ? "bg-[#FDE2E2] text-[#5c1020]" : "bg-surface-2 text-ink"
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      {Icon && <Icon size={16} className="mt-[3px] shrink-0" aria-hidden="true" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US");
