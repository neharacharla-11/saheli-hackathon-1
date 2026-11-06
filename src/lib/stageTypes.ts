/** Data for My stage: fertility signs, baby care, menopause scores and the postpartum mood screen. */

export type OpkResult = "pos" | "neg";

export interface BabyFeed {
  id: string;
  at: string; // ISO time it started
  kind: "left" | "right" | "bottle";
  minutes?: number; // breast feeds
  ml?: number; // bottle
}

export interface BabyNappy {
  id: string;
  at: string;
  kind: "wet" | "dirty" | "both";
}

export interface BabySleep {
  id: string;
  start: string;
  end?: string; // missing while baby is asleep
}

export interface BabyCare {
  feeds: BabyFeed[];
  nappies: BabyNappy[];
  sleeps: BabySleep[];
  /** A breast feed in progress (so it survives the phone locking at 3 AM). */
  activeFeed?: { side: "left" | "right"; start: string } | null;
}

/** Menopause Rating Scale: 11 items, each 0-4. */
export interface MenoScore {
  date: string;
  scores: Record<string, number>;
}

/** "How are you, really?" after birth: 5 answers 0-3. A screen, not a diagnosis. */
export interface PostpartumCheck {
  date: string;
  answers: number[];
}
