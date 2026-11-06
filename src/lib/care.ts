import { addDays, daysBetween, parseISODate } from "./dates";
import type { Contraception, MethodId, PainLog } from "./careTypes";

/* ---------------- Methods ---------------- */

export interface MethodInfo {
  id: MethodId;
  label: string;
  short: string;
  line: string;
  kind: "pill" | "device" | "injection" | "ring" | "patch" | "barrier" | "none";
  /** Default years (or days for the injection) until replace-by. */
  years?: number;
  days?: number;
}

export const METHODS: MethodInfo[] = [
  { id: "combined", label: "Combined pill", short: "Combined pill", line: "One pill a day, with a 7-day break or 28 pills.", kind: "pill" },
  { id: "mini", label: "Mini pill (progestogen-only)", short: "Mini pill", line: "One pill every day at the same time, no break.", kind: "pill" },
  { id: "copper-iud", label: "Copper IUD", short: "Copper IUD", line: "No hormones. Lasts 5 to 10 years.", kind: "device", years: 10 },
  { id: "hormonal-iud", label: "Hormonal IUD", short: "Hormonal IUD", line: "Lasts 3 to 8 years, depending on the brand.", kind: "device", years: 5 },
  { id: "implant", label: "Implant", short: "Implant", line: "A small rod in your arm. Lasts about 3 years.", kind: "device", years: 3 },
  { id: "injection", label: "Injection", short: "Injection", line: "Every 12 to 13 weeks.", kind: "injection", days: 91 },
  { id: "ring", label: "Vaginal ring", short: "Ring", line: "3 weeks in, 1 week out.", kind: "ring" },
  { id: "patch", label: "Patch", short: "Patch", line: "A new patch each week for 3 weeks, then a week off.", kind: "patch" },
  { id: "condoms", label: "Condoms", short: "Condoms", line: "The only method that also protects against STIs.", kind: "barrier" },
  { id: "none", label: "Nothing right now", short: "Nothing right now", line: "That's okay. Saheli can explain your options.", kind: "none" },
];

export const HORMONAL_IUD_BRANDS: { name: string; years: number }[] = [
  { name: "Mirena", years: 8 },
  { name: "Liletta", years: 8 },
  { name: "Kyleena", years: 5 },
  { name: "Jaydess / Skyla", years: 3 },
  { name: "Other or not sure", years: 5 },
];

export function methodInfo(id: MethodId | undefined): MethodInfo | undefined {
  return METHODS.find((m) => m.id === id);
}

/** Replace-by date pre-filled from the fitting (or injection) date. */
export function defaultReplaceBy(method: MethodId, fittedOn: string, brandYears?: number): string {
  const m = methodInfo(method);
  if (m?.days) return addDays(fittedOn, m.days);
  return addYears(fittedOn, brandYears ?? m?.years ?? 5);
}

/* ---------------- Pill pack ---------------- */

/** Day of the pack (1-28) for a date. Packs repeat every 28 days from packStart. */
export function packDay(packStart: string, date: string): number {
  const diff = daysBetween(packStart, date);
  return (((diff % 28) + 28) % 28) + 1;
}

export function isBreakDay(c: Pick<Contraception, "method" | "packType" | "packStart">, date: string): boolean {
  if (!c.packStart) return false;
  if (c.method === "combined") return c.packType !== 28 && packDay(c.packStart, date) > 21;
  if (c.method === "ring" || c.method === "patch") return packDay(c.packStart, date) > 21;
  return false;
}

export type DotState = "taken" | "missed" | "break" | "before" | "today";

/** The last n days, oldest first. "today" means not taken yet today. */
export function pillDots(c: Contraception, taken: Record<string, boolean>, today: string, n = 14): { date: string; state: DotState }[] {
  const firstTaken = Object.keys(taken).filter((d) => taken[d]).sort()[0];
  const startedOn = [c.setAt?.slice(0, 10), firstTaken].filter(Boolean).sort()[0] ?? today;
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - n + 1);
    let state: DotState;
    if (date < startedOn) state = "before";
    else if (isBreakDay(c, date)) state = "break";
    else if (taken[date]) state = "taken";
    else state = date === today ? "today" : "missed";
    return { date, state };
  });
}

/** Days in a row she's taken her pill (break days don't break the streak). */
export function pillStreak(c: Contraception, taken: Record<string, boolean>, today: string): number {
  let d = taken[today] || isBreakDay(c, today) ? today : addDays(today, -1);
  let n = 0;
  for (let i = 0; i < 400; i++, d = addDays(d, -1)) {
    if (isBreakDay(c, d)) continue;
    if (!taken[d]) break;
    n++;
  }
  return n;
}

/* ---------------- Devices ---------------- */

export interface ReplaceInfo {
  state: "ok" | "soon" | "overdue";
  days: number; // days left, or days overdue
  months: number;
}

export function replaceInfo(replaceBy: string, today: string): ReplaceInfo {
  const left = daysBetween(today, replaceBy);
  if (left < 0) return { state: "overdue", days: -left, months: 0 };
  return { state: left <= 30 ? "soon" : "ok", days: left, months: Math.round(left / 30.44) };
}

/* ---------------- Screenings ---------------- */

export interface Screening {
  id: string;
  name: string;
  why: string;
  how: string; // "Every 3 years"
  minAge: number;
  maxAge?: number;
  everyYears?: number; // undefined: once (vaccine)
  note?: string;
}

export const SCREENINGS: Screening[] = [
  { id: "pap", name: "Pap test", why: "Finds changes in the cervix early, before they can become cancer.", how: "Every 3 years", minAge: 21, maxAge: 29, everyYears: 3 },
  { id: "hpv", name: "HPV test", why: "Checks for the virus that causes most cervical cancer.", how: "Every 5 years", minAge: 30, maxAge: 65, everyYears: 5 },
  { id: "hpv-vaccine", name: "HPV vaccine", why: "Protects against the virus behind most cervical cancers. Best before you're sexually active.", how: "Once (2 or 3 doses)", minAge: 9, maxAge: 26 },
  { id: "mammogram", name: "Mammogram", why: "An X-ray that finds breast cancer before you can feel a lump.", how: "Every 2 years", minAge: 40, maxAge: 74, everyYears: 2 },
  { id: "bp", name: "Blood pressure", why: "High blood pressure has no symptoms but harms your heart, brain and kidneys.", how: "Every year", minAge: 18, everyYears: 1 },
  { id: "sugar", name: "Blood sugar", why: "Finds diabetes or prediabetes early, when food and movement help most.", how: "Every 3 years", minAge: 35, maxAge: 70, everyYears: 3, note: "Sooner and more often with PCOS, past diabetes in pregnancy, or diabetes in the family." },
  { id: "cholesterol", name: "Cholesterol", why: "High cholesterol raises heart risk, especially after menopause.", how: "Every 5 years", minAge: 40, maxAge: 75, everyYears: 5 },
  { id: "thyroid", name: "Thyroid (TSH)", why: "An under- or overactive thyroid can cause tiredness, weight change and period changes.", how: "Every 5 years, or sooner with symptoms", minAge: 35, everyYears: 5 },
  { id: "bone", name: "Bone density (DEXA)", why: "Finds thinning bones before a fracture.", how: "Every 2 years", minAge: 65, everyYears: 2 },
  { id: "bowel", name: "Bowel screening", why: "A simple stool test or a colonoscopy finds bowel cancer early.", how: "Every 2 years (stool test), or as your doctor advises", minAge: 45, maxAge: 75, everyYears: 2 },
  { id: "eyes", name: "Eye check", why: "Finds glaucoma and other changes that come with age.", how: "Every 2 years", minAge: 40, everyYears: 2 },
  { id: "dental", name: "Dental check-up", why: "Healthy gums matter for your heart and, in pregnancy, your baby.", how: "Every year", minAge: 1, everyYears: 1 },
];

export type ScreeningState = "not-recorded" | "due-now" | "due-soon" | "up-to-date" | "not-at-age";

export interface ScreeningStatus {
  state: ScreeningState;
  last?: string;
  next?: string;
}

export function forAge(s: Screening, age: number): boolean {
  return age >= s.minAge && (s.maxAge === undefined || age <= s.maxAge);
}

function addYears(iso: string, years: number): string {
  const d = parseISODate(iso);
  const target = new Date(d.getFullYear() + years, d.getMonth(), d.getDate());
  return addDays(iso, Math.round((target.getTime() - d.getTime()) / 86_400_000));
}

export function screeningStatus(s: Screening, age: number | undefined, last: string | undefined, today: string): ScreeningStatus {
  if (age !== undefined && !forAge(s, age)) return { state: "not-at-age", last };
  if (!last) return { state: "not-recorded" };
  if (s.everyYears === undefined) return { state: "up-to-date", last };
  const next = addYears(last, s.everyYears);
  const left = daysBetween(today, next);
  if (left < 0) return { state: "due-now", last, next };
  if (left <= 60) return { state: "due-soon", last, next };
  return { state: "up-to-date", last, next };
}

export const STATUS_TEXT: Record<ScreeningState, string> = {
  "not-recorded": "Not recorded",
  "due-now": "Due now",
  "due-soon": "Due soon",
  "up-to-date": "Up to date",
  "not-at-age": "Not at your age",
};

export function screeningSummary(age: number, dates: Record<string, string>, today: string): { recommended: number; needAttention: number } {
  const mine = SCREENINGS.filter((s) => forAge(s, age));
  const needAttention = mine.filter((s) => {
    const st = screeningStatus(s, age, dates[s.id], today).state;
    return st === "not-recorded" || st === "due-now";
  }).length;
  return { recommended: mine.length, needAttention };
}

/* ---------------- Breast self-check ---------------- */

export function daysSince(dates: string[] | undefined, today: string): number | null {
  const last = [...(dates ?? [])].filter((d) => d <= today).sort().pop();
  return last ? daysBetween(last, today) : null;
}

/* ---------------- Pain diary ---------------- */

export const PAIN_WORDS = ["No pain", "Mild", "Moderate", "Severe", "Worst possible"];

export function painWord(score: number): string {
  if (score <= 0) return PAIN_WORDS[0];
  if (score <= 3) return PAIN_WORDS[1];
  if (score <= 6) return PAIN_WORDS[2];
  if (score <= 9) return PAIN_WORDS[3];
  return PAIN_WORDS[4];
}

/** Bar and number colours: mild, moderate, severe. */
export function painColour(score: number): string {
  if (score <= 0) return "var(--line)";
  if (score <= 3) return "#F4B6CF";
  if (score <= 6) return "#E0679A";
  return "#9B1B30";
}

export const PAIN_PLACES = ["Lower tummy", "Lower back", "One side of pelvis", "Down the legs", "During or after sex", "When pooing", "When peeing", "Headache"];
export const PAIN_HELPED = ["Heat pad", "Painkiller", "Rest", "Gentle movement", "Warm drink", "Nothing helped"];
const DEEP = ["During or after sex", "When pooing", "When peeing"];

export interface EndoFlag {
  show: boolean;
  reasons: string[];
  severeCycles: number;
}

/** Which period (cycle) a date belongs to: the latest start on or before it. */
function cycleOf(date: string, starts: string[]): string | null {
  let found: string | null = null;
  for (const s of starts) if (s <= date) found = s;
  return found;
}

function nearPeriod(date: string, starts: string[], periodLength: number): boolean {
  return starts.some((s) => {
    const d = daysBetween(s, date);
    return d >= -2 && d < periodLength;
  });
}

/**
 * The endometriosis flag (a flag, not a diagnosis). Looks at the last 120 days.
 * Shows when 2 or more reasons are true, or severe pain came in 3 or more cycles.
 */
export function endoFlag(pain: PainLog[], periodStarts: string[], today: string, periodLength = 5): EndoFlag {
  const from = addDays(today, -120);
  const recent = pain.filter((p) => p.date >= from && p.date <= today);
  const starts = [...new Set(periodStarts)].sort();
  const reasons: string[] = [];

  const severeCycleSet = new Set<string>();
  for (const p of recent) {
    if (p.score >= 7) severeCycleSet.add(cycleOf(p.date, starts) ?? `no-cycle-${p.date.slice(0, 7)}`);
  }
  const severeCycles = severeCycleSet.size;
  if (severeCycles >= 2) reasons.push(`Severe pain (7 or more) in ${severeCycles} different cycles`);

  const missed = recent.filter((p) => p.missedDay).length;
  if (missed >= 2) reasons.push(`Pain stopped you from work, college or plans on ${missed} days`);

  const deep = recent.filter((p) => p.places.some((pl) => DEEP.includes(pl))).length;
  if (deep >= 2) reasons.push(`Pain with sex, pooing or peeing on ${deep} days`);

  const nothing = recent.filter((p) => p.score >= 6 && p.helped.includes("Nothing helped")).length;
  if (nothing >= 2) reasons.push(`Strong pain where nothing helped on ${nothing} days`);

  const away = recent.filter((p) => p.score >= 5 && starts.length > 0 && !nearPeriod(p.date, starts, periodLength)).length;
  if (away >= 3) reasons.push(`Strong pain on ${away} days away from your period`);

  return { show: reasons.length >= 2 || severeCycles >= 3, reasons, severeCycles };
}

export interface PainSummary {
  days: number;
  average: number;
  worst: number;
  severeDays: number;
  missedDays: number;
  places: string[];
}

export function painSummary(pain: PainLog[], today: string, days = 90): PainSummary | null {
  const recent = pain.filter((p) => p.date >= addDays(today, -days) && p.date <= today);
  if (!recent.length) return null;
  const scores = recent.map((p) => p.score);
  const counts = new Map<string, number>();
  recent.forEach((p) => p.places.forEach((pl) => counts.set(pl, (counts.get(pl) ?? 0) + 1)));
  return {
    days: recent.length,
    average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    worst: Math.max(...scores),
    severeDays: scores.filter((s) => s >= 7).length,
    missedDays: recent.filter((p) => p.missedDay).length,
    places: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k),
  };
}

/* ---------------- Talk to an expert ---------------- */

export const NEHA_WHATSAPP = "918767327311";
export const NEHA_EMAIL = "neharacharla0011@gmail.com";

export interface BookingInput {
  name: string;
  topic: string;
  time: string;
  how: string;
  note: string;
  includeAbout: boolean;
  age?: number;
  stage?: string;
}

export function bookingMessage(b: BookingInput): string {
  const lines = [
    `Hi Neha, I'm ${b.name.trim() || "a Saheli user"}. I found you on Saheli and would like to book a session.`,
    "",
    `Topic: ${b.topic}`,
    `Best time: ${b.time.trim() || "Any time"}`,
    `How: ${b.how}`,
  ];
  if (b.includeAbout && (b.age || b.stage)) lines.push(`About me: ${[b.age ? `${b.age} years` : "", b.stage ?? ""].filter(Boolean).join(", ")}`);
  if (b.note.trim()) lines.push(`Note: ${b.note.trim()}`);
  lines.push("", "Please let me know a time and the fee. Thank you.");
  return lines.join("\n");
}

export function whatsappBooking(message: string): string {
  return `https://wa.me/${NEHA_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function emailBooking(message: string, topic: string): string {
  return `mailto:${NEHA_EMAIL}?subject=${encodeURIComponent(`Saheli: ${topic}`)}&body=${encodeURIComponent(message)}`;
}
