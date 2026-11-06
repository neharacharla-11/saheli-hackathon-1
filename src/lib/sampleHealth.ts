/**
 * Made-up blood reports and symptom logs for the sample women. Nothing here is real.
 */
import { phaseForDay } from "./cycle";
import { addDays, daysBetween } from "./dates";
import type { DayLog, Flow, LabReport, Mood } from "./types";

type V = Record<string, number>;
type O = LabReport["other"];

function report(key: string, n: number, today: string, daysAgo: number, lab: string, values: V, other: O = []): LabReport {
  const date = addDays(today, -daysAgo);
  return { id: `${key}-r${n}`, date, lab, values, other, source: "sample", addedAt: date };
}

const CBC_OTHER: O = [
  { name: "MCV", value: "76", unit: "fL", range: "80-100" },
  { name: "RBC count", value: "4.1", unit: "million/µL", range: "3.8-4.8" },
];

export function sampleReports(key: string, today: string): LabReport[] {
  switch (key) {
    case "priya":
      return [
        report(key, 1, today, 120, "CityCare Diagnostics", { haemoglobin: 9.9, ferritin: 8, vitaminD: 14, b12: 310, tsh: 2.1, fastingSugar: 88, platelets: 262, wbc: 6.8, calcium: 9.1 }, CBC_OTHER),
        report(key, 2, today, 30, "CityCare Diagnostics", { haemoglobin: 11.2, ferritin: 14, vitaminD: 22, b12: 340, tsh: 2.3, platelets: 255, wbc: 7.1 }, [
          { name: "MCV", value: "79", unit: "fL", range: "80-100" },
        ]),
      ];
    case "meera":
      return [
        report(key, 1, today, 45, "Sunrise Labs", { lh: 14.2, fsh: 5.1, testosterone: 82, fastingInsulin: 19, fastingSugar: 94, amh: 7.8, prolactin: 14, tsh: 2.0, hba1c: 5.5, vitaminD: 24 }, [
          { name: "LH:FSH ratio", value: "2.8", range: "under 2" },
          { name: "DHEA-S", value: "290", unit: "µg/dL", range: "65-380" },
        ]),
      ];
    case "sara":
      return [
        report(key, 1, today, 60, "Bayview Medical Lab", { folate: 4.6, amh: 2.6, tsh: 1.8, haemoglobin: 12.8, vitaminD: 26, b12: 410, prolactin: 11 }, [
          { name: "Rubella IgG", value: "Immune" },
        ]),
      ];
    case "ananya":
      return [
        report(key, 1, today, 40, "Lotus Women's Clinic Lab", { haemoglobin: 10.9, ferritin: 21, tsh: 2.2, fastingSugar: 86, platelets: 228 }, [
          { name: "Glucose 1 hour after 75 g", value: "132", unit: "mg/dL", range: "under 180" },
          { name: "Blood group", value: "B positive" },
        ]),
      ];
    case "kavya":
      return [report(key, 1, today, 25, "CityCare Diagnostics", { haemoglobin: 10.8, ferritin: 18, vitaminD: 19, tsh: 3.1, b12: 280 })];
    case "sunita":
      return [
        report(key, 1, today, 50, "Sunrise Labs", { vitaminD: 16, calcium: 8.4, haemoglobin: 12.4, tsh: 3.2, fsh: 38, cholesterol: 205, ldl: 128, hdl: 54, triglycerides: 140 }),
      ];
    case "lata":
      return [
        report(key, 1, today, 220, "Harbour Pathology", { cholesterol: 248, ldl: 165, hdl: 46, triglycerides: 172, vitaminD: 17, fastingSugar: 101, hba1c: 5.9 }),
        report(key, 2, today, 40, "Harbour Pathology", { cholesterol: 236, ldl: 152, hdl: 48, triglycerides: 160, vitaminD: 21, fastingSugar: 98, hba1c: 5.8, calcium: 9.1, crp: 3.2 }, [
          { name: "Creatinine", value: "0.8", unit: "mg/dL", range: "0.5-1.1" },
        ]),
      ];
    case "rekha":
      return [
        report(key, 1, today, 70, "CityCare Diagnostics", { fastingSugar: 102, hba1c: 5.7, cholesterol: 210, triglycerides: 170, hdl: 44, ldl: 136, vitaminD: 24, haemoglobin: 12.6, tsh: 2.4, fastingInsulin: 16 }),
      ];
    case "pooja":
      return [
        report(key, 1, today, 150, "Sunrise Labs", { tsh: 9.8, haemoglobin: 11.6, ferritin: 22, vitaminD: 25, b12: 260 }, [
          { name: "Free T4", value: "0.7", unit: "ng/dL", range: "0.8-1.8" },
          { name: "Anti-TPO", value: "180", unit: "IU/mL", range: "under 35" },
        ]),
        report(key, 2, today, 35, "Sunrise Labs", { tsh: 3.6, haemoglobin: 12.1, ferritin: 28, vitaminD: 31 }, [
          { name: "Free T4", value: "1.1", unit: "ng/dL", range: "0.8-1.8" },
        ]),
      ];
    case "farida":
      return [
        report(key, 1, today, 160, "Northgate Health Lab", { hba1c: 8.1, fastingSugar: 168, cholesterol: 215, ldl: 138, triglycerides: 190, hdl: 46 }),
        report(key, 2, today, 40, "Northgate Health Lab", { hba1c: 7.2, fastingSugar: 138, cholesterol: 198, ldl: 124, triglycerides: 160, hdl: 48 }, [
          { name: "Urine albumin to creatinine", value: "18", unit: "mg/g", range: "under 30" },
        ]),
      ];
    case "nisha":
      return [report(key, 1, today, 90, "CityCare Diagnostics", { haemoglobin: 11.8, ferritin: 19, vitaminD: 18, b12: 240, tsh: 2.6 })];
    default:
      return [];
  }
}

/* ---------------- Symptom logs ---------------- */

interface Pattern {
  symptoms: [string, number][]; // name, chance per day
  periodSymptoms?: [string, number][]; // on period days
  lutealSymptoms?: [string, number][];
  heavyDays?: number; // first N period days are heavy
  lowMood: number; // chance of a low or stressed mood
  energy: [number, number]; // usual range
}

const PATTERNS: Record<string, Pattern> = {
  priya: {
    symptoms: [["Fatigue", 0.12], ["Headache", 0.04]],
    periodSymptoms: [["Cramps", 0.85], ["Fatigue", 0.6], ["Back pain", 0.4]],
    lutealSymptoms: [["Bloating", 0.35], ["Cravings", 0.35], ["Fatigue", 0.2]],
    heavyDays: 2, lowMood: 0.08, energy: [2, 4],
  },
  nisha: {
    symptoms: [["Fatigue", 0.35], ["Headache", 0.12], ["Poor sleep", 0.3]],
    periodSymptoms: [["Cramps", 0.5]],
    lutealSymptoms: [["Irritability", 0.4], ["Bloating", 0.3]],
    heavyDays: 1, lowMood: 0.35, energy: [1, 3],
  },
  rekha: { symptoms: [["Joint pain", 0.08], ["Cravings", 0.15], ["Fatigue", 0.1]], periodSymptoms: [["Cramps", 0.4]], lowMood: 0.08, energy: [2, 4] },
  anaya: { symptoms: [], periodSymptoms: [["Cramps", 0.5], ["Fatigue", 0.3]], lowMood: 0.04, energy: [3, 5] },
  meera: { symptoms: [["Acne", 0.35], ["Hair fall", 0.25], ["Fatigue", 0.12]], periodSymptoms: [["Cramps", 0.4]], lowMood: 0.12, energy: [2, 4] },
  pooja: { symptoms: [["Fatigue", 0.35], ["Hair fall", 0.22], ["Body pain", 0.1], ["Feeling cold", 0.15]], periodSymptoms: [["Cramps", 0.3]], heavyDays: 1, lowMood: 0.12, energy: [1, 3] },
  farida: { symptoms: [["Fatigue", 0.2], ["Joint pain", 0.12], ["Headache", 0.05]], periodSymptoms: [["Cramps", 0.2]], lowMood: 0.08, energy: [2, 4] },
  sara: { symptoms: [["Bloating", 0.05]], periodSymptoms: [["Cramps", 0.5]], lutealSymptoms: [["Tender breasts", 0.3]], lowMood: 0.06, energy: [3, 5] },
  ananya: { symptoms: [["Back pain", 0.25], ["Fatigue", 0.3], ["Heartburn", 0.2]], lowMood: 0.06, energy: [2, 4] },
  kavya: { symptoms: [["Fatigue", 0.5], ["Back pain", 0.15], ["Hair fall", 0.2], ["Poor sleep", 0.4]], lowMood: 0.35, energy: [1, 3] },
  sunita: {
    symptoms: [["Hot flashes", 0.4], ["Night sweats", 0.3], ["Poor sleep", 0.4], ["Joint pain", 0.2], ["Fatigue", 0.25]],
    periodSymptoms: [["Cramps", 0.3]],
    heavyDays: 1, lowMood: 0.15, energy: [2, 4],
  },
  lata: { symptoms: [["Joint pain", 0.35], ["Poor sleep", 0.15]], lowMood: 0.06, energy: [2, 4] },
};

/** Small seeded random so samples look the same every time. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const GOOD_MOODS: Mood[] = ["good", "okay", "great", "calm", "good", "okay"];
const LOW_MOODS: Mood[] = ["low", "stressed", "anxious", "overwhelmed"];

/** About 6 months of believable logs: flow, symptoms, mood, energy, stress. */
export function sampleSymptomLogs(
  key: string,
  today: string,
  periodStarts: string[],
  cycleLength: number,
  periodLength: number,
  days = 180,
): Record<string, DayLog> {
  const p = PATTERNS[key];
  if (!p) return {};
  const rand = rng(key);
  const starts = [...periodStarts].sort();
  const logs: Record<string, DayLog> = {};
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    if (rand() > 0.85 && i > 0) continue; // she skips some days
    const last = starts.filter((s) => s <= date).pop();
    const cday = last ? daysBetween(last, date) + 1 : null;
    const onPeriod = cday !== null && cday <= periodLength;
    const phase = cday !== null && cday <= cycleLength ? phaseForDay(cday, cycleLength, periodLength) : null;

    const symptoms = new Set<string>();
    const roll = (list?: [string, number][]) => list?.forEach(([s, chance]) => rand() < chance && symptoms.add(s));
    roll(p.symptoms);
    if (onPeriod) roll(p.periodSymptoms);
    if (phase === "luteal") roll(p.lutealSymptoms);

    let flow: Flow | undefined;
    if (onPeriod && cday !== null) {
      flow = cday <= (p.heavyDays ?? 0) ? "heavy" : cday <= 3 ? "medium" : cday === periodLength ? "spotting" : "light";
    }
    const low = rand() < p.lowMood + (phase === "luteal" ? 0.05 : 0);
    const mood = low ? LOW_MOODS[Math.floor(rand() * LOW_MOODS.length)] : GOOD_MOODS[Math.floor(rand() * GOOD_MOODS.length)];
    const [eLo, eHi] = p.energy;
    let energy = eLo + Math.floor(rand() * (eHi - eLo + 1));
    if (symptoms.has("Fatigue")) energy = Math.min(energy, 2);
    const stress = low ? 4 : 1 + Math.floor(rand() * 3);

    logs[date] = {
      ...(flow ? { flow } : {}),
      ...(symptoms.size ? { symptoms: [...symptoms] } : {}),
      mood,
      energy,
      stress,
    };
  }
  return logs;
}
