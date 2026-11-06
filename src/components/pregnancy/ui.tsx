"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Card heading: small icon, title in DM Serif, optional right side. */
export function CardHead({
  icon: Icon,
  label,
  title,
  right,
}: {
  icon?: LucideIcon;
  label?: string;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        {label && <p className="label mb-1">{label}</p>}
        <h2 className="flex items-center gap-2 font-display text-[1.45rem] leading-tight text-ink">
          {Icon && <Icon size={20} className="shrink-0 text-primary-ink" aria-hidden />}
          {title}
        </h2>
      </div>
      {right && <div className="shrink-0 text-sm text-ink-soft">{right}</div>}
    </div>
  );
}

/** Red-bordered "Call your doctor" box. */
export function AlertBox({
  tone = "danger",
  title,
  children,
  icon: Icon,
}: {
  tone?: "danger" | "warn" | "calm";
  title: ReactNode;
  children?: ReactNode;
  icon?: LucideIcon;
}) {
  const style =
    tone === "danger"
      ? "bg-[#FDE2E2] border-2 border-[#9B1B30]/50 text-[#5c1020]"
      : tone === "warn"
        ? "bg-[#FEF3C7] border border-[#92400E]/30 text-[#5f2b06]"
        : "bg-surface-2 text-ink";
  return (
    <div role={tone === "danger" ? "alert" : undefined} className={`flex items-start gap-3 rounded-2xl p-4 ${style}`}>
      {Icon && <Icon size={18} className="mt-[3px] shrink-0" aria-hidden />}
      <div className="min-w-0">
        <p className="font-semibold leading-snug">{title}</p>
        {children && <div className="mt-1 text-[15px] leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "danger" | "muted" | "primary"; children: ReactNode }) {
  const style = {
    ok: "bg-accent/20 text-accent-ink",
    warn: "bg-[#FEF3C7] text-[#92400E]",
    danger: "bg-[#FDE2E2] text-[#9B1B30]",
    muted: "bg-surface-2 text-ink-soft",
    primary: "bg-primary text-on-primary",
  }[tone];
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${style}`}>{children}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TickButton({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
        on ? "border-primary bg-primary text-on-primary" : "border-line bg-surface hover:border-primary"
      }`}
    >
      {on && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export const DISCLAIMER = "Saheli explains, it doesn't diagnose. Talk to your doctor.";
