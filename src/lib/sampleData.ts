import { addDays, todayISO } from "./dates";
import { sampleByKey } from "./samples";
import { sampleReports, sampleSymptomLogs } from "./sampleHealth";
import { withPregnancySample } from "./pregnancySample";
import { defaultShares } from "./circle";
import { withMindSample } from "./mindSample";
import { withNourishSample } from "./nourishSample";
import { withStageSample } from "./stageSample";
import { emptyProfileData } from "./store";
import type { CircleMember, Profile, ProfileData } from "./types";

/**
 * Made-up data for a sample woman. Nothing here is real.
 * This is the starting set; later phases add months of logs per woman.
 */
export function buildSample(key: string, today = todayISO()): ProfileData {
  const meta = sampleByKey(key);
  if (!meta) throw new Error(`Unknown sample: ${key}`);

  const cycleLength = key === "meera" ? 42 : key === "nisha" ? 28 : 29;
  const periodLength = 5;
  const regular = !["ananya", "kavya", "lata"].includes(key);
  // Today is cycle day 19 for Priya; others get a believable day too.
  const dayToday = key === "sara" ? 15 : key === "anaya" ? 4 : key === "sunita" ? 33 : 19;
  const lastStart = addDays(today, -(dayToday - 1));
  const periodStarts: string[] = [];
  if (regular) {
    for (let i = 5; i >= 0; i--) periodStarts.push(addDays(lastStart, -cycleLength * i));
  }

  const profile: Profile = {
    name: meta.name,
    country: meta.country,
    units: meta.country === "US" ? "imperial" : "metric",
    stage: meta.stage,
    age: meta.age,
    cycleLength,
    periodLength,
    companionName: meta.companionName,
    dueDate: key === "ananya" ? addDays(today, 70) : undefined,
    babyBirthDate: key === "kavya" ? addDays(today, -70) : undefined,
    safety: {
      pregnant: key === "ananya",
      breastfeeding: key === "kavya",
      medicalCondition: ["pooja", "farida", "meera"].includes(key),
      conditions: key === "pooja" ? ["thyroid"] : key === "farida" ? ["diabetes"] : key === "meera" ? ["pcos"] : [],
      eatingConcerns: false,
    },
    createdAt: addDays(today, -180),
  };

  const data: ProfileData = {
    ...emptyProfileData(),
    profile,
    periodStarts,
    circle: circleFor(key, today),
    // Health: blood reports and 6 months of symptom logs (lib/sampleHealth.ts)
    reports: sampleReports(key, today),
    dayLogs: sampleSymptomLogs(key, today, periodStarts, cycleLength, periodLength),
  };
  // Nourish, Move and Companion: numbers, meals, steps, chat, coach plans (lib/nourishSample.ts)
  // My stage: fertility signs, baby care, menopause scores (lib/stageSample.ts)
  return withStageSample(key, withMindSample(key, withNourishSample(key, withPregnancySample(key, data, today), today), today), today);
}

const CIRCLES: Record<string, [string, string, string][]> = {
  priya: [["Rahul", "Partner", "+91 90000 00001"], ["Mom", "Mother", "+91 90000 00002"]],
  kavya: [["Rohan", "Partner", "+91 90000 00003"], ["Amma", "Mother", "+91 90000 00004"]],
  sunita: [["Priyanka", "Sister", "+91 90000 00005"]],
  nisha: [["Vikram", "Partner", "+91 90000 00006"]],
  ananya: [["Arjun", "Partner", "+91 90000 00007"]],
  meera: [["Mom", "Mother", "+91 90000 00008"]],
  sara: [["Daniel", "Partner", "+1 555 010 0001"]],
  rekha: [["Anil", "Partner", "+91 90000 00009"]],
  pooja: [["Kiran", "Sister", "+91 90000 00010"]],
  farida: [["Yusuf", "Partner", "+44 7700 900001"]],
  lata: [["Ravi", "Son", "+61 400 000 001"]],
  anaya: [["Sunita", "Mother", "+91 90000 00011"]],
};

function circleFor(key: string, today: string): CircleMember[] {
  return (CIRCLES[key] ?? []).map(([name, relation, phone], i) => ({
    id: `${key}-c${i}`,
    name,
    relation,
    phone,
    shares: defaultShares(),
    status: i === 0 ? "waiting" : "synced",
    addedAt: addDays(today, -60),
  }));
}
