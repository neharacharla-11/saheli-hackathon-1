import { hi } from "./hi";
import { mr } from "./mr";

export type LangCode = "en" | "hi" | "mr";

export const LANGUAGES: { code: LangCode; label: string; english: string }[] = [
  { code: "en", label: "English", english: "English" },
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "mr", label: "मराठी", english: "Marathi" },
];

/** A rule for strings with numbers or names: "Week 30, day 0" -> "सप्ताह 30, दिन 0". Use $1, $2 in `to`. */
export interface Pattern {
  re: RegExp;
  to: string;
}

export interface Dictionary {
  strings: Record<string, string>;
  patterns: Pattern[];
}

export const DICTIONARIES: Record<Exclude<LangCode, "en">, Dictionary> = { hi, mr };

function lookupCore(core: string, dict: Dictionary): string | null {
  const exact = dict.strings[core];
  if (exact) return exact;
  // Same string, different case (eyebrows are often written in capitals).
  const lower = core.toLowerCase();
  for (const key of [lower, lower.charAt(0).toUpperCase() + lower.slice(1)]) {
    if (dict.strings[key]) return dict.strings[key];
  }
  // Trailing punctuation that isn't part of the dictionary key.
  const m = core.match(/^(.*?)([.:,·…]+)$/);
  if (m && dict.strings[m[1]]) return dict.strings[m[1]] + m[2];
  for (const p of dict.patterns) {
    const re = new RegExp(`^(?:${p.re.source})$`, p.re.flags.replace("g", ""));
    if (re.test(core)) return core.replace(re, p.to);
  }
  return null;
}

/**
 * Translate one UI string. Keeps the surrounding whitespace.
 * Returns the original string when there is no translation (or for English).
 */
export function translate(text: string, lang: string): string {
  if (lang === "en" || !(lang in DICTIONARIES)) return text;
  const core = text.trim();
  if (!core || !/[A-Za-z]/.test(core)) return text;
  const out = lookupCore(core, DICTIONARIES[lang as Exclude<LangCode, "en">]);
  if (out === null) return text;
  const start = text.indexOf(core);
  return text.slice(0, start) + out + text.slice(start + core.length);
}

/** True when the string has a translation in this language. */
export function hasTranslation(text: string, lang: string): boolean {
  return translate(text, lang) !== text;
}
