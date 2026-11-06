"use client";

import { useSyncExternalStore } from "react";
import { Languages } from "lucide-react";
import { getLang, LANGS, onLangChange, setLang, isLang, type LangCode } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** Kept for older imports. */
export const LANGUAGES = LANGS;

/** Her chosen language (saved in localStorage "saheli:lang"). English during server render. */
export function useLang(): LangCode {
  return useSyncExternalStore(onLangChange, getLang, () => "en");
}

/** Language select (pill, 36px, translate icon). Never translated itself. */
export function LanguagePicker({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const lang = useLang();
  const setAppLanguage = useAppStore((s) => s.setLanguage);
  return (
    <label
      className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-2 text-sm text-ink ${className}`}
      data-no-translate
      translate="no"
    >
      <Languages size={16} className="text-ink-soft" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => {
          if (!isLang(e.target.value)) return;
          setLang(e.target.value);
          setAppLanguage(e.target.value); // voice input and older code read this
        }}
        className={`appearance-none bg-transparent pr-1 text-sm font-medium outline-none ${compact ? "w-[4.5rem]" : ""}`}
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
