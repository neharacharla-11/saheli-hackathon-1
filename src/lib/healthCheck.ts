/**
 * Health check: read the last 90 days of logs and suggest tests to ask her doctor about.
 * Suggestions only, never a diagnosis.
 */
import { addDays, daysBetween } from "./dates";
import { latestResults, type LabKey, type ReportLike } from "./labTests";
import type { DayLog, LifeStage, Profile } from "./types";

export interface TestChip {
  label: string;
  /** Lab tests that count as "results in" for this chip. */
  keys: LabKey[];
}

export interface Suggestion {
  id: "tired" | "pain" | "hair" | "pcos" | "painful-periods" | "moods" | "headaches";
  title: string;
  reason: string;
  tests: TestChip[];
  link?: { href: string; label: string };
  /** Extra kind line (support for low moods). */
  extra?: string;
}

export interface PainEntry {
  date: string;
  score: number;
}

export interface HealthInput {
  profile: Pick<Profile, "stage" | "age" | "diet"> | null;
  dayLogs: Record<string, DayLog>;
  periodStarts: string[];
  reports?: ReportLike[];
  pain?: PainEntry[];
  today: string;
}

export const WINDOW_DAYS = 90;

export const T = {
  bloodCount: { label: "Blood count (CBC)", keys: ["haemoglobin", "platelets", "wbc"] },
  ferritin: { label: "Ferritin", keys: ["ferritin"] },
  b12: { label: "Vitamin B12", keys: ["b12"] },
  vitaminD: { label: "Vitamin D", keys: ["vitaminD"] },
  calcium: { label: "Calcium", keys: ["calcium"] },
  thyroid: { label: "Thyroid (TSH)", keys: ["tsh"] },
  pcosPanel: { label: "PCOS hormone panel (LH, FSH, testosterone, AMH)", keys: ["lh", "fsh", "testosterone", "amh"] },
  insulin: { label: "Fasting insulin and sugar", keys: ["fastingInsulin", "fastingSugar"] },
  exam: { label: "Doctor's exam (and maybe an ultrasound)", keys: [] },
  bp: { label: "Blood pressure", keys: [] },
  eyes: { label: "Eye test", keys: [] },
  haemoglobin: { label: "Haemoglobin", keys: ["haemoglobin"] },
} satisfies Record<string, TestChip>;

const KEYWORDS: Record<string, string[]> = {
  tired: ["fatigue", "tired", "tiredness", "low energy", "exhausted", "exhaustion"],
  pain: ["body pain", "body ache", "body aches", "joint pain", "back pain", "backache", "muscle pain", "aches", "leg pain"],
  hair: ["hair fall", "hair loss", "hair thinning", "hairfall"],
  acne: ["acne", "pimples", "breakouts", "spots"],
  cramps: ["cramps", "period pain", "painful period", "pelvic pain"],
  headache: ["headache", "headaches", "migraine"],
};

const LOW_MOODS = new Set(["low", "stressed", "anxious", "overwhelmed", "irritable"]);

function hasSymptom(log: DayLog | undefined, group: keyof typeof KEYWORDS): boolean {
  const list = log?.symptoms;
  if (!list?.length) return false;
  const words = KEYWORDS[group];
  return list.some((s) => {
    const n = s.toLowerCase().replace(/[-_]/g, " ").trim();
    return words.some((w) => n === w || n.includes(w));
  });
}

function windowDates(today: string, days = WINDOW_DAYS): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

export interface SymptomCounts {
  tired: number;
  lowEnergy: number;
  heavy: number;
  pain: number;
  hair: number;
  acne: number;
  cramps: number;
  headache: number;
  lowMood: number;
  daysLogged: number;
}

export function countSymptoms(dayLogs: Record<string, DayLog>, today: string, days = WINDOW_DAYS): SymptomCounts {
  const c: SymptomCounts = { tired: 0, lowEnergy: 0, heavy: 0, pain: 0, hair: 0, acne: 0, cramps: 0, headache: 0, lowMood: 0, daysLogged: 0 };
  for (const d of windowDates(today, days)) {
    const log = dayLogs[d];
    if (!log) continue;
    c.daysLogged++;
    const tiredWord = hasSymptom(log, "tired");
    const lowEnergy = typeof log.energy === "number" && log.energy <= 2;
    if (tiredWord || lowEnergy) c.tired++;
    if (lowEnergy) c.lowEnergy++;
    if (log.flow === "heavy") c.heavy++;
    if (hasSymptom(log, "pain")) c.pain++;
    if (hasSymptom(log, "hair")) c.hair++;
    if (hasSymptom(log, "acne")) c.acne++;
    if (hasSymptom(log, "cramps")) c.cramps++;
    if (hasSymptom(log, "headache")) c.headache++;
    if (log.mood && LOW_MOODS.has(log.mood)) c.lowMood++;
  }
  return c;
}

/** Most-logged symptoms in the window, for the doctor summary. */
export function topSymptoms(dayLogs: Record<string, DayLog>, today: string, days = WINDOW_DAYS, limit = 8) {
  const counts = new Map<string, number>();
  for (const d of windowDates(today, days)) {
    for (const s of dayLogs[d]?.symptoms ?? []) {
      const k = s.trim();
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, days]) => ({ name, days }));
}

export interface CycleSummary {
  lengths: number[];
  shortest: number | null;
  longest: number | null;
  average: number | null;
  irregular: boolean;
}

/** Cycle lengths from period starts in roughly the last 7 months. */
export function cycleSummary(periodStarts: string[], today: string): CycleSummary {
  const from = addDays(today, -210);
  const s = [...new Set(periodStarts)].filter((d) => d >= from && d <= today).sort();
  const lengths: number[] = [];
  for (let i = 1; i < s.length; i++) lengths.push(daysBetween(s[i - 1], s[i]));
  if (!lengths.length) return { lengths, shortest: null, longest: null, average: null, irregular: false };
  const shortest = Math.min(...lengths);
  const longest = Math.max(...lengths);
  const average = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  const irregular = longest - shortest > 7 || longest > 35 || shortest < 21;
  return { lengths, shortest, longest, average, irregular };
}

function days(n: number) {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

const NO_CYCLE: LifeStage[] = ["pregnancy", "postpartum", "menopause"];

export function healthSuggestions(input: HealthInput): Suggestion[] {
  const { profile, dayLogs, periodStarts, today } = input;
  const stage = profile?.stage ?? "cycle";
  const c = countSymptoms(dayLogs, today);
  const out: Suggestion[] = [];
  const young = stage === "first-period";

  // Tiredness or heavy flow -> blood count, ferritin, B12
  if (c.tired >= 5 || c.heavy >= 3) {
    const parts: string[] = [];
    if (c.tired >= 5) parts.push(`tiredness or low energy on ${days(c.tired)}`);
    if (c.heavy >= 3) parts.push(`heavy flow on ${days(c.heavy)}`);
    out.push({
      id: "tired",
      title: c.heavy >= 3 && c.tired < 5 ? "Heavy periods" : c.heavy >= 3 ? "Tired, with heavy periods" : "Always tired",
      reason: `You logged ${parts.join(" and ")} in the last 3 months. Low iron and low B12 are common reasons, and both are easy to check and treat.`,
      tests: young ? [T.bloodCount, T.ferritin] : [T.bloodCount, T.ferritin, T.b12],
    });
  }

  // Body or joint pain -> vitamin D, calcium, thyroid
  if (c.pain >= 4 && !young) {
    out.push({
      id: "pain",
      title: "Body or joint pain",
      reason: `You logged body or joint pain on ${days(c.pain)} in the last 3 months. Low vitamin D, low calcium and a slow thyroid can all cause aches.`,
      tests: [T.vitaminD, T.calcium, T.thyroid],
    });
  }

  // Hair fall -> thyroid, ferritin, vitamin D
  if (c.hair >= 4 && !young) {
    out.push({
      id: "hair",
      title: "Hair fall",
      reason: `You logged hair fall on ${days(c.hair)} in the last 3 months. The thyroid, low iron stores and low vitamin D are the most common reasons.`,
      tests: [T.thyroid, T.ferritin, T.vitaminD],
    });
  }

  // Irregular cycles or acne -> PCOS hormone panel
  const cyc = cycleSummary(periodStarts, today);
  const irregular = !NO_CYCLE.includes(stage) && cyc.irregular;
  if (!young && !NO_CYCLE.includes(stage) && (irregular || c.acne >= 4 || stage === "pcos")) {
    const parts: string[] = [];
    if (irregular && cyc.shortest !== null) {
      parts.push(cyc.shortest === cyc.longest ? `your cycles were ${cyc.longest} days long` : `your cycles ranged from ${cyc.shortest} to ${cyc.longest} days`);
    }
    if (c.acne >= 4) parts.push(`you logged acne on ${days(c.acne)}`);
    const lead = parts.length ? `In the last few months ${parts.join(" and ")}. ` : "";
    out.push({
      id: "pcos",
      title: stage === "pcos" ? "Keeping an eye on PCOS" : irregular ? "Irregular cycles" : "Acne that keeps coming back",
      reason:
        stage === "pcos"
          ? `${lead}A yearly hormone panel and insulin check show how your PCOS care is working.`
          : `${lead}A hormone panel can check for PCOS, which is common and very manageable.`,
      tests: [T.pcosPanel, T.insulin],
    });
  }

  // Painful periods -> doctor's exam (links to the pain diary)
  const severePain = (input.pain ?? []).filter((p) => p.date >= addDays(today, -WINDOW_DAYS) && p.score >= 7).length;
  if (!NO_CYCLE.includes(stage) && (c.cramps >= 6 || severePain >= 2)) {
    const reason =
      severePain >= 2
        ? `Your pain diary shows pain of 7 or more on ${days(severePain)} in the last 3 months.`
        : `You logged period cramps on ${days(c.cramps)} in the last 3 months.`;
    out.push({
      id: "painful-periods",
      title: "Painful periods",
      reason: young
        ? `${reason} Tell a trusted adult. Period pain that stops you doing things is worth showing a doctor.`
        : `${reason} Pain that stops your day isn't something to just put up with. Ask for an exam to look for causes like endometriosis or fibroids.`,
      tests: [T.exam],
      link: { href: "/app/pain", label: "Open your pain diary" },
    });
  }

  // Low moods -> thyroid, vitamin D, B12 plus support
  if (c.lowMood >= 8 && !young) {
    out.push({
      id: "moods",
      title: "Low moods",
      reason: `You logged low, stressed or anxious moods on ${days(c.lowMood)} in the last 3 months. The thyroid, vitamin D and B12 can all affect mood.`,
      tests: [T.thyroid, T.vitaminD, T.b12],
      extra: "Talking to someone helps too: a friend, your doctor or a counsellor.",
      link: { href: "/app/mind", label: "Support on Mind" },
    });
  }

  // Headaches -> BP, eye test, haemoglobin
  if (c.headache >= 4) {
    out.push({
      id: "headaches",
      title: "Headaches",
      reason: `You logged headaches on ${days(c.headache)} in the last 3 months. Blood pressure, your eyesight and low haemoglobin are worth checking.`,
      tests: [T.bp, T.eyes, T.haemoglobin],
    });
  }

  return out;
}

/* ---------------- Everyday check-ups ---------------- */

export interface Checkup {
  id: string;
  name: string;
  often: string;
  keys: LabKey[];
  href?: string;
}

export function everydayCheckups(profile: Pick<Profile, "stage" | "age" | "diet"> | null): Checkup[] {
  const age = profile?.age ?? 30;
  const stage = profile?.stage ?? "cycle";
  if (stage === "first-period" || age < 18) {
    return [
      { id: "doctor", name: "A yearly check-up with your doctor", often: "Every year", keys: [] },
      { id: "hb", name: "Haemoglobin, if your periods are heavy or you feel tired", often: "When your doctor suggests", keys: ["haemoglobin"] },
      { id: "eyes", name: "Eye test", often: "Every year", keys: [] },
      { id: "teeth", name: "Dental check-up", often: "Every 6 months", keys: [] },
    ];
  }
  const veg = profile?.diet === "vegetarian" || profile?.diet === "vegan" || profile?.diet === "jain";
  const list: Checkup[] = [
    { id: "bp", name: "Blood pressure", often: "Every year", keys: [], href: "/app/screenings" },
    { id: "cbc", name: "Blood count and haemoglobin", often: "Every year", keys: ["haemoglobin"] },
    {
      id: "sugar",
      name: "Blood sugar (fasting sugar or HbA1c)",
      often: age >= 35 || stage === "pcos" ? "Every 1 to 3 years" : "Every 3 years from 35, sooner with PCOS",
      keys: ["fastingSugar", "hba1c"],
    },
    { id: "lipids", name: "Cholesterol (lipid profile)", often: age >= 40 ? "Every 1 to 2 years" : "Every 5 years", keys: ["cholesterol", "ldl", "hdl", "triglycerides"] },
    { id: "thyroid", name: "Thyroid (TSH)", often: age >= 35 ? "Every 5 years, or if you have symptoms" : "If you have symptoms", keys: ["tsh"] },
    {
      id: "vitamins",
      name: "Vitamin D and B12",
      often: veg ? "Every year, as you eat little or no meat" : "Every year if you're indoors a lot",
      keys: ["vitaminD", "b12"],
    },
  ];
  if (age >= 21 && age <= 65) list.push({ id: "cervical", name: "Cervical screening (Pap or HPV test)", often: "Every 3 to 5 years", keys: [], href: "/app/screenings" });
  list.push({
    id: "breast",
    name: age >= 40 ? "Breast check and mammogram" : "Breast self-check",
    often: age >= 40 ? "Self-check monthly, mammogram every 1 to 2 years" : "Once a month",
    keys: [],
    href: "/app/screenings",
  });
  if (age >= 50 || stage === "menopause") list.push({ id: "bone", name: "Bone density (DEXA)", often: "After menopause, or at 65", keys: [] });
  list.push({ id: "eyes", name: "Eye test", often: "Every 2 years", keys: [] });
  list.push({ id: "teeth", name: "Dental check-up", often: "Every 6 to 12 months", keys: [] });
  return list;
}

/* ---------------- Results already in ---------------- */

/** Tests she has results for from the last 12 months. */
export function keysWithResults(reports: ReportLike[] | undefined, today: string): Set<LabKey> {
  const since = addDays(today, -365);
  return new Set(
    latestResults((reports ?? []).filter((r) => r.date >= since)).map((r) => r.key),
  );
}

export function chipHasResults(chip: TestChip, have: Set<LabKey>): boolean {
  return chip.keys.some((k) => have.has(k));
}
