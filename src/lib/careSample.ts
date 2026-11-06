import { addDays } from "./dates";
import { isBreakDay } from "./care";
import type { Contraception, PainLog } from "./careTypes";
import type { ProfileData } from "./types";

/**
 * Made-up Care data for the sample women. Nothing here is real.
 * Priya: combined pill (21-day pack, one missed pill 6 days ago), Pap 2 years
 * ago, BP over a year ago, two breast self-checks, and a pain diary with
 * severe pain on days 1-2 of her last 3 periods (so the endometriosis flag shows).
 * Nisha: a copper IUD fitted 3 years ago. Lata: her screenings with dates.
 */
export function withCareSample(key: string, data: ProfileData, today: string): ProfileData {
  if (key === "priya") {
    const contraception: Contraception = {
      method: "combined",
      label: "Combined pill",
      pillTime: "21:00",
      packStart: addDays(today, -12), // day 13 today
      packType: 21,
      setAt: `${addDays(today, -150)}T09:00:00.000Z`,
    };
    const pillsTaken: Record<string, boolean> = {};
    for (let i = 1; i <= 140; i++) {
      const d = addDays(today, -i);
      if (i !== 6 && !isBreakDay(contraception, d)) pillsTaken[d] = true;
    }
    return {
      ...data,
      contraception: data.contraception ?? contraception,
      pillsTaken: data.pillsTaken ?? pillsTaken,
      screenings: data.screenings ?? { pap: addDays(today, -730), bp: addDays(today, -420), dental: addDays(today, -200) },
      breastChecks: data.breastChecks ?? [addDays(today, -40), addDays(today, -12)],
      pain: data.pain ?? priyaPain(data.periodStarts, today),
    };
  }
  if (key === "nisha") {
    const fitted = addDays(today, -3 * 365);
    return {
      ...data,
      contraception: data.contraception ?? { method: "copper-iud", label: "Copper IUD", fittedOn: fitted, replaceBy: addDays(fitted, 3652), setAt: `${addDays(today, -90)}T09:00:00.000Z` },
      screenings: data.screenings ?? { pap: addDays(today, -500), bp: addDays(today, -90), thyroid: addDays(today, -300) },
      breastChecks: data.breastChecks ?? [addDays(today, -20)],
    };
  }
  if (key === "lata") {
    return {
      ...data,
      screenings: data.screenings ?? {
        mammogram: addDays(today, -420),
        bp: addDays(today, -95),
        sugar: addDays(today, -240),
        cholesterol: addDays(today, -730),
        eyes: addDays(today, -700),
        bowel: addDays(today, -300),
        dental: addDays(today, -150),
      },
      breastChecks: data.breastChecks ?? [addDays(today, -32), addDays(today, -3)],
    };
  }
  if (key === "sunita" || key === "farida" || key === "pooja") {
    const s: Record<string, Record<string, string>> = {
      sunita: { mammogram: addDays(today, -800), bp: addDays(today, -60), sugar: addDays(today, -400), thyroid: addDays(today, -500) },
      farida: { bp: addDays(today, -30), sugar: addDays(today, -14), cholesterol: addDays(today, -200), eyes: addDays(today, -380), mammogram: addDays(today, -500) },
      pooja: { pap: addDays(today, -900), bp: addDays(today, -120), dental: addDays(today, -400) },
    };
    return { ...data, screenings: data.screenings ?? s[key] };
  }
  return data;
}

function priyaPain(periodStarts: string[], today: string): PainLog[] {
  const starts = [...periodStarts].filter((d) => d <= today).sort().slice(-3);
  const plan: [number, number, string[], string[], boolean][][] = [
    // day offset, score, places, helped, missed
    [
      [0, 7, ["Lower tummy", "Lower back"], ["Heat pad", "Painkiller"], true],
      [1, 8, ["Lower tummy", "Down the legs"], ["Nothing helped"], true],
      [2, 5, ["Lower tummy"], ["Heat pad"], false],
      [3, 3, ["Lower back"], ["Rest"], false],
    ],
    [
      [0, 8, ["Lower tummy", "Lower back"], ["Painkiller"], true],
      [1, 7, ["Lower tummy"], ["Heat pad", "Rest"], false],
      [2, 4, ["Lower tummy"], ["Warm drink"], false],
      [3, 2, ["Lower back"], ["Gentle movement"], false],
    ],
    [
      [0, 8, ["Lower tummy", "One side of pelvis"], ["Nothing helped"], true],
      [1, 7, ["Lower tummy", "Lower back"], ["Painkiller", "Heat pad"], false],
      [2, 5, ["Lower tummy"], ["Heat pad"], false],
      [3, 3, ["Lower tummy"], ["Rest"], false],
    ],
  ];
  return starts.flatMap((s, i) => plan[i % plan.length].map(([d, score, places, helped, missedDay]) => ({ date: addDays(s, d), score, places, helped, missedDay }))).filter((p) => p.date <= today);
}
