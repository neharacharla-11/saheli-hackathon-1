import { getLang } from "./i18n";
/** Local-date helpers. Dates are stored as YYYY-MM-DD in her own time zone. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

const LOCALES: Record<string, string> = { en: "en-GB", hi: "hi-IN", mr: "mr-IN", es: "es-ES", ru: "ru-RU", ko: "ko-KR", zh: "zh-CN" };

/** The locale for dates in her chosen language (English on the server and in tests). */
export function dateLocale(fallback = "en-GB"): string {
  if (typeof window === "undefined") return fallback;
  const lang = getLang();
  return lang === "en" ? fallback : (LOCALES[lang] ?? fallback);
}

export function formatLong(iso: string, locale = dateLocale()): string {
  return parseISODate(iso).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatShort(iso: string): string {
  return parseISODate(iso).toLocaleDateString(dateLocale("en-US"), { month: "short", day: "numeric" });
}
