import type { LifeStage } from "./types";

export interface SampleMeta {
  key: string;
  name: string;
  age: number;
  stage: LifeStage;
  label: string; // shown in the banner: "Sample data: Priya, regular cycle"
  line: string; // one line in the picker
  group: "cycle" | "conditions" | "fertility" | "midlife";
  country: string;
  companionName: string;
}

export const SAMPLE_GROUPS: { id: SampleMeta["group"]; label: string }[] = [
  { id: "cycle", label: "Cycle" },
  { id: "conditions", label: "Conditions" },
  { id: "fertility", label: "Fertility, pregnancy and baby" },
  { id: "midlife", label: "Midlife and beyond" },
];

export const SAMPLES: SampleMeta[] = [
  {
    key: "priya", name: "Priya", age: 27, stage: "cycle", label: "regular cycle", group: "cycle", country: "IN", companionName: "Bestie",
    line: "Regular cycle, low iron, on the pill, a pain diary that flags a pattern.",
  },
  {
    key: "nisha", name: "Nisha", age: 38, stage: "cycle", label: "very busy", group: "cycle", country: "IN", companionName: "Didi",
    line: "Full-time job and two kids: 10-minute workouts, a copper IUD and a PMDD check.",
  },
  {
    key: "rekha", name: "Rekha", age: 35, stage: "cycle", label: "weight-loss goal", group: "cycle", country: "IN", companionName: "Saheli",
    line: "A gentle calorie deficit, home workouts and body measurements every 2 weeks.",
  },
  {
    key: "anaya", name: "Anaya", age: 12, stage: "first-period", label: "first period", group: "cycle", country: "IN", companionName: "Didi",
    line: "Her first period, explained kindly. No calories, no weight.",
  },
  {
    key: "meera", name: "Meera", age: 24, stage: "pcos", label: "PCOS", group: "conditions", country: "IN", companionName: "Sissy",
    line: "Irregular cycles, a hormone report and insulin-friendly food.",
  },
  {
    key: "pooja", name: "Pooja", age: 33, stage: "cycle", label: "thyroid", group: "conditions", country: "IN", companionName: "Bestie",
    line: "Hypothyroid, TSH better on her second report, a daily medicine reminder.",
  },
  {
    key: "farida", name: "Farida", age: 45, stage: "cycle", label: "type 2 diabetes", group: "conditions", country: "GB", companionName: "Saheli",
    line: "Two weeks of sugar readings, HbA1c improving, walks after meals.",
  },
  {
    key: "sara", name: "Sara", age: 31, stage: "ttc", label: "trying to conceive", group: "fertility", country: "US", companionName: "Bestie",
    line: "Morning temperatures and ovulation tests, positive today.",
  },
  {
    key: "ananya", name: "Ananya", age: 30, stage: "pregnancy", label: "30 weeks pregnant", group: "fertility", country: "IN", companionName: "Maa",
    line: "30 weeks: scans, blood pressure, kick counts and a birth plan.",
  },
  {
    key: "kavya", name: "Kavya", age: 29, stage: "postpartum", label: "new mother", group: "fertility", country: "IN", companionName: "Sissy",
    line: "Baby is 10 weeks old: a feeds, nappies and sleep tracker and mood support.",
  },
  {
    key: "sunita", name: "Sunita", age: 49, stage: "menopause", label: "perimenopause", group: "midlife", country: "IN", companionName: "Saheli",
    line: "Hot flashes and poor sleep, 6 weekly menopause scores getting better.",
  },
  {
    key: "lata", name: "Lata", age: 58, stage: "menopause", label: "postmenopause", group: "midlife", country: "AU", companionName: "Saheli",
    line: "Heart and bone health, and every screening with its date.",
  },
];

export function sampleByKey(key: string): SampleMeta | undefined {
  return SAMPLES.find((s) => s.key === key);
}
