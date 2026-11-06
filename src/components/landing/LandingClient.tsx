"use client";

import { useState } from "react";
import { Languages, Sparkles } from "lucide-react";
import { SamplePicker } from "@/components/SamplePicker";
import { useAppStore, useHydrated } from "@/lib/store";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
];

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  return (
    <label className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-2 text-sm text-ink">
      <Languages size={16} className="text-ink-soft" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={hydrated ? language : "en"}
        onChange={(e) => setLanguage(e.target.value)}
        className={`appearance-none bg-transparent pr-1 text-sm font-medium outline-none ${compact ? "w-[4.5rem]" : ""}`}
        data-no-translate
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

export function TrySampleButton({ className = "btn btn-secondary btn-lg" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Sparkles size={18} className="text-primary-ink" />
        Try with sample data
      </button>
      {open && <SamplePicker onClose={() => setOpen(false)} />}
    </>
  );
}
