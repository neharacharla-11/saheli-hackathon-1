import { cycleDay, phaseForDay, type Phase } from "./cycle";
import { MOOD_SCORE } from "./mind";
import type { DayLog, Mood } from "./types";

export type WeatherKey = "energy" | "mood" | "cravings" | "sleep" | "focus";

export interface WeatherBar {
  key: WeatherKey;
  label: string;
  level: number; // 1-5
  word: string;
  learned: boolean;
}

export interface BodyWeather {
  phase: Phase;
  forecast: string;
  bars: WeatherBar[];
  /** How many of her own cycles shaped this (0 = typical for the phase). */
  learnedFrom: number;
}

const LABEL: Record<WeatherKey, string> = {
  energy: "Energy",
  mood: "Mood",
  cravings: "Cravings",
  sleep: "Sleep",
  focus: "Focus",
};

const WORDS: Record<WeatherKey, [string, string, string, string, string]> = {
  energy: ["Very low", "Low", "Medium", "Good", "High"],
  mood: ["Low", "Tender", "Steady", "Good", "Bright"],
  cravings: ["None", "Low", "Some", "Likely", "Strong"],
  sleep: ["Poor", "Light", "Medium", "Good", "Deep"],
  focus: ["Foggy", "Low", "Medium", "Good", "Sharp"],
};

/** Typical for each phase, before she has logs. */
const TYPICAL: Record<Phase, Record<WeatherKey, number>> = {
  period: { energy: 2, mood: 3, cravings: 3, sleep: 3, focus: 2 },
  follicular: { energy: 4, mood: 4, cravings: 2, sleep: 4, focus: 4 },
  ovulation: { energy: 5, mood: 5, cravings: 2, sleep: 4, focus: 4 },
  luteal: { energy: 3, mood: 3, cravings: 4, sleep: 3, focus: 3 },
};

export const FORECAST: Record<Phase, string> = {
  period: "A slower day. Rest counts as progress, and warm food helps.",
  follicular: "Energy is rising. A good day to start something new.",
  ovulation: "Bright and social today. You're at your strongest.",
  luteal: "Slower and cosier. Your body asks for a little more food and rest.",
};

const ORDER: WeatherKey[] = ["energy", "mood", "cravings", "sleep", "focus"];
const MIN_DAYS = 5; // logged days in a phase before we trust her own numbers

/**
 * Body Weather for a phase: typical levels, replaced by her own averages for
 * energy, mood and cravings once she has logged enough days in that phase.
 */
export function bodyWeather(
  phase: Phase,
  logs: Record<string, DayLog> = {},
  periodStarts: string[] = [],
  cycleLength = 28,
  periodLength = 5,
): BodyWeather {
  const typical = TYPICAL[phase];
  const inPhase: DayLog[] = [];
  for (const [date, log] of Object.entries(logs)) {
    const d = cycleDay(periodStarts, date, cycleLength);
    if (d !== null && phaseForDay(d, cycleLength, periodLength) === phase) inPhase.push(log);
  }
  const learned: Partial<Record<WeatherKey, number>> = {};
  if (inPhase.length >= MIN_DAYS) {
    const energies = inPhase.filter((l) => l.energy !== undefined).map((l) => l.energy as number);
    if (energies.length >= MIN_DAYS) learned.energy = avg(energies);
    const moods = inPhase.filter((l) => l.mood).map((l) => MOOD_SCORE[l.mood as Mood]);
    if (moods.length >= MIN_DAYS) learned.mood = avg(moods);
    const withSymptoms = inPhase.filter((l) => l.symptoms !== undefined || l.mood !== undefined);
    if (withSymptoms.length >= MIN_DAYS) {
      const share = withSymptoms.filter((l) => l.symptoms?.includes("Cravings")).length / withSymptoms.length;
      // Blend with the typical level so one quiet month doesn't erase it.
      learned.cravings = (1 + share * 8 + typical.cravings) / 2;
    }
  }
  const bars = ORDER.map((key) => {
    const level = clampLevel(learned[key] ?? typical[key]);
    return { key, label: LABEL[key], level, word: WORDS[key][level - 1], learned: learned[key] !== undefined };
  });
  const cycles = Math.max(0, periodStarts.length - 1);
  return {
    phase,
    forecast: FORECAST[phase],
    bars,
    learnedFrom: bars.some((b) => b.learned) ? Math.min(6, Math.max(1, cycles)) : 0,
  };
}

function avg(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function clampLevel(n: number) {
  return Math.min(5, Math.max(1, Math.round(n)));
}

/* ---------------- Tips for her phase ---------------- */

export const PHASE_TIPS: Record<Phase, { title: string; tips: string[]; craving: string }> = {
  period: {
    title: "What helps during your period",
    tips: [
      "Iron-rich food like palak, rajma and jaggery, with lemon for vitamin C",
      "A hot water bag and gentle stretching for cramps",
      "Warm drinks: ginger or ajwain tea",
      "Rest without guilt. Short walks if you feel up to it",
    ],
    craving: "Craving chocolate? A few squares of dark chocolate give you magnesium too.",
  },
  follicular: {
    title: "What helps in your follicular phase",
    tips: [
      "Try a new workout or lift a little heavier",
      "Fresh, light meals: sprouts, salads and curd",
      "Plan the hard conversations and big tasks now",
      "Protein at every meal to build on rising energy",
    ],
    craving: "Hungry between meals? A handful of roasted chana keeps you going.",
  },
  ovulation: {
    title: "What helps in your ovulation window",
    tips: [
      "Your strongest days: go for that harder session",
      "Fibre and greens help your body clear extra oestrogen",
      "Plenty of water, you may feel warmer",
      "A good time for social plans and presentations",
    ],
    craving: "Want something crunchy? Cucumber and carrot sticks with hummus.",
  },
  luteal: {
    title: "What helps in your luteal phase",
    tips: [
      "About 100 extra calories is normal now, choose complex carbs",
      "Magnesium foods: pumpkin seeds, bananas, dark chocolate",
      "Gentler workouts: yoga, walks and steady strength",
      "Less salt and caffeine can ease bloating and sleep",
    ],
    craving: "Craving something sweet at night? Warm haldi milk or 2 dates with a few almonds.",
  },
};
