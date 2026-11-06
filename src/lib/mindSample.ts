import { addDays } from "./dates";
import type { ProfileData } from "./types";

/** Made-up sleep and PMDD data for the sample women. Nothing here is real. */

// [average hours, spread] of sleep a night
const SLEEP: Record<string, [number, number]> = {
  priya: [7.2, 0.8],
  nisha: [5.6, 0.7],
  rekha: [7, 0.6],
  meera: [7.4, 0.9],
  pooja: [7.6, 0.7],
  farida: [6.6, 0.6],
  sara: [7.3, 0.5],
  ananya: [6.8, 0.9],
  kavya: [5.1, 1],
  sunita: [5.8, 0.9],
  lata: [6.5, 0.6],
};

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function withMindSample(key: string, data: ProfileData, today: string): ProfileData {
  const out: ProfileData = { ...data };
  const s = SLEEP[key];
  if (s && !data.health?.sleepMin) {
    const rand = rng(`${key}-sleep`);
    const sleepMin: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      if (rand() < 0.06) continue; // forgot the watch
      const hours = s[0] + (rand() * 2 - 1) * s[1];
      sleepMin[addDays(today, -i)] = Math.round(Math.max(3.5, Math.min(9.5, hours)) * 60);
    }
    out.health = { source: "Apple Health", ...(data.health ?? {}), sleepMin };
  }
  if (key === "nisha" && !data.pmdd?.length) {
    out.pmdd = [{ date: addDays(today, -12), answers: [2, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1], interferes: false }];
  }
  return out;
}
