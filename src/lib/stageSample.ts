import { addDays } from "./dates";
import type { ProfileData } from "./types";
import type { BabyCare, MenoScore, OpkResult } from "./stageTypes";

/**
 * Made-up My stage data for the sample women. Nothing here is real.
 * Sara: a morning temperature every day this cycle (still low) and
 * ovulation tests negative for 3 days, positive today.
 * Kavya: baby care for the last day and a half, and a mood screen.
 * Sunita and Lata: 6 weekly menopause scores, getting better.
 */
export function withStageSample(key: string, data: ProfileData, today: string, now = new Date()): ProfileData {
  if (key === "sara") return { ...data, ...saraSigns(data, today) };
  if (key === "kavya") {
    return {
      ...data,
      baby: data.baby ?? babyDays(now),
      postpartumChecks: data.postpartumChecks ?? [{ date: addDays(today, -9), answers: [2, 1, 2, 1, 0] }],
    };
  }
  if (key === "sunita") return { ...data, menoScores: data.menoScores ?? menoSeries(today, [24, 22, 21, 19, 17, 15], "sunita") };
  if (key === "lata") return { ...data, menoScores: data.menoScores ?? menoSeries(today, [14, 13, 13, 12, 11, 10], "lata") };
  return data;
}

function saraSigns(data: ProfileData, today: string): Pick<ProfileData, "bbt" | "opk"> {
  const start = [...data.periodStarts].filter((d) => d <= today).sort().pop() ?? addDays(today, -14);
  const lows = [36.4, 36.3, 36.4, 36.5, 36.3, 36.4, 36.4, 36.3, 36.5, 36.4, 36.3, 36.4, 36.5, 36.4, 36.3, 36.4];
  const bbt: Record<string, number> = { ...(data.bbt ?? {}) };
  for (let d = start, i = 0; d <= today; d = addDays(d, 1), i++) bbt[d] = lows[i % lows.length];
  const opk: Record<string, OpkResult> = { ...(data.opk ?? {}) };
  for (let i = 3; i >= 1; i--) opk[addDays(today, -i)] = "neg";
  opk[today] = "pos";
  return { bbt, opk };
}

function babyDays(now: Date): BabyCare {
  const feeds: BabyCare["feeds"] = [];
  const nappies: BabyCare["nappies"] = [];
  const sleeps: BabyCare["sleeps"] = [];
  const at = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60000).toISOString();
  // Feeds every 2.5-3 hours, alternating sides, the last one 40 minutes ago.
  let side: "left" | "right" = "right";
  for (let m = 40, i = 0; m < 36 * 60; m += 150 + ((i * 37) % 40), i++) {
    if (i % 7 === 3) feeds.push({ id: `kf${i}`, at: at(m), kind: "bottle", ml: 90 });
    else feeds.push({ id: `kf${i}`, at: at(m), kind: side, minutes: 10 + ((i * 3) % 9) });
    side = side === "left" ? "right" : "left";
    // A nappy at most feeds
    if (i % 4 !== 2) nappies.push({ id: `kn${i}`, at: at(m - 15), kind: i % 3 === 0 ? "both" : i % 5 === 0 ? "dirty" : "wet" });
    // Naps after feeds
    sleeps.push({ id: `ks${i}`, start: at(m - 25), end: at(Math.max(5, m - 25 - (50 + ((i * 29) % 70)))) });
  }
  return { feeds, nappies, sleeps: sleeps.filter((s) => s.end! > s.start), activeFeed: null };
}

const MRS_IDS = ["hot", "sleep", "tired", "mood", "irritable", "joints", "anxious", "dryness", "heart", "bladder", "desire"];

function menoSeries(today: string, totals: number[], key: string): MenoScore[] {
  // Sunita's flushes and sleep lead; Lata's joints and dryness do.
  const order = key === "lata" ? ["joints", "dryness", "sleep", "tired", "bladder", "mood", "hot", "irritable", "anxious", "heart", "desire"] : MRS_IDS;
  return totals.map((total, i) => {
    const scores: Record<string, number> = Object.fromEntries(order.map((id) => [id, 0]));
    let left = total;
    // Fill the leading items first, up to 4 each, then spread the rest.
    for (let round = 0; left > 0 && round < 4; round++) {
      for (const id of order) {
        if (left <= 0) break;
        const cap = round === 0 ? 1 : 4;
        if (scores[id] < cap && (round === 0 || order.indexOf(id) < 4 + round)) {
          scores[id] += 1;
          left -= 1;
        }
      }
    }
    return { date: addDays(today, -7 * (totals.length - 1 - i)), scores };
  });
}
