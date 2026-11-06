"use client";

import { Languages } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/store";
import { LANGUAGES } from "@/i18n";

export { LANGUAGES };

/** Language select (pill, 36px). Never translated itself. */
export function LanguagePicker({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const hydrated = useHydrated();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  return (
    <label
      className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-2 text-sm text-ink ${className}`}
      data-no-translate
      translate="no"
    >
      <Languages size={16} className="text-ink-soft" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={hydrated ? language : "en"}
        onChange={(e) => setLanguage(e.target.value)}
        className={`appearance-none bg-transparent pr-1 text-sm font-medium outline-none ${compact ? "w-[4.5rem]" : ""}`}
        aria-label="Language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
