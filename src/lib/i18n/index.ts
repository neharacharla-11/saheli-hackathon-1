/**
 * Saheli's language system. English is the source text written in the components;
 * a Translator swaps what's on screen using one JSON dictionary per language.
 */
export type LangCode = "en" | "hi" | "mr" | "es" | "ru" | "ko" | "zh";

export const LANGS: { code: LangCode; label: string; english: string }[] = [
  { code: "en", label: "English", english: "English" },
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "mr", label: "मराठी", english: "Marathi" },
  { code: "es", label: "Español", english: "Spanish" },
  { code: "ru", label: "Русский", english: "Russian" },
  { code: "ko", label: "한국어", english: "Korean" },
  { code: "zh", label: "中文", english: "Chinese" },
];

export const LANG_KEY = "saheli:lang";
export const LANG_EVENT = "saheli:lang";

export type Dict = Record<string, string>;

export function isLang(x: unknown): x is LangCode {
  return LANGS.some((l) => l.code === x);
}

export function getLang(): LangCode {
  if (typeof window === "undefined") return "en";
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (isLang(v)) return v;
    // Earlier builds kept it in the app store.
    const old = (JSON.parse(localStorage.getItem("saheli:app") ?? "{}") as { state?: { language?: string } }).state?.language;
    return isLang(old) ? old : "en";
  } catch {
    return "en";
  }
}

/** Save her language and tell everything listening. */
export function setLang(lang: LangCode) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
}

export function onLangChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => e.key === LANG_KEY && cb();
  window.addEventListener(LANG_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LANG_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Only the chosen language's file is loaded. */
const cache = new Map<LangCode, Promise<Dict>>();
export function loadDict(lang: LangCode): Promise<Dict> {
  if (lang === "en") return Promise.resolve({});
  let p = cache.get(lang);
  if (!p) {
    const load: Record<Exclude<LangCode, "en">, () => Promise<{ default: Dict }>> = {
      hi: () => import("./dicts/hi.json"),
      mr: () => import("./dicts/mr.json"),
      es: () => import("./dicts/es.json"),
      ru: () => import("./dicts/ru.json"),
      ko: () => import("./dicts/ko.json"),
      zh: () => import("./dicts/zh.json"),
    };
    p = load[lang]()
      .then((m) => normaliseDict(m.default))
      .catch(() => ({}));
    cache.set(lang, p);
  }
  return p;
}

/** Curly quotes to straight ones, spaces collapsed. Keys are matched after this. */
export function normKey(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

export function normaliseDict(d: Dict): Dict {
  const out: Dict = {};
  for (const [k, v] of Object.entries(d)) if (v) out[normKey(k)] = v;
  return out;
}

/** Labels built from a name. The dictionary holds the template, e.g. "Add {}": "{} जोड़ें". */
export const PATTERNS = ["Add {}", "Remove {}", "Remove date for {}", "Chat with {}", "Talk to {}…", "Message {}", "{} taps · {}-day streak", "Tests to ask about: {}."];
const PATTERN_RES = PATTERNS.map((p) => ({
  key: p,
  re: new RegExp(`^${p.split("{}").map((s) => s.replace(/[.*+?^$()|[\]\\]/g, "\\$&")).join("(.+?)")}$`),
}));

function lookup(core: string, dict: Dict): string | null {
  const hit = dict[core];
  if (hit) return hit;
  // Eyebrows are written in capitals; the dictionary has them in sentence case.
  const lower = core.toLowerCase();
  for (const k of [lower, lower.charAt(0).toUpperCase() + lower.slice(1)]) if (dict[k]) return dict[k];
  // Trailing punctuation that isn't part of the key.
  const m = core.match(/^(.*?)([.:,·…]+)$/);
  if (m && dict[m[1]]) return dict[m[1]] + m[2];
  for (const p of PATTERN_RES) {
    const pm = core.match(p.re);
    if (pm && dict[p.key]) {
      let i = 1;
      return dict[p.key].replace(/\{\}/g, () => pm[i++] ?? "");
    }
  }
  return null;
}

/** Translate one piece of UI text, keeping its surrounding whitespace. */
export function translate(text: string, dict: Dict): string {
  const core = normKey(text);
  if (!core || !/[A-Za-z]/.test(core)) return text;
  const out = lookup(core, dict);
  if (out === null) return text;
  const lead = text.match(/^\s*/)?.[0] ?? "";
  const trail = text.match(/\s*$/)?.[0] ?? "";
  return lead + out + trail;
}
