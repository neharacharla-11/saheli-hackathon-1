/* Pregnancy data kept on her device. All optional so older saved data still loads. */

export interface KickSession {
  id: string;
  start: string; // ISO time
  end: string; // ISO time
  count: number;
}

export interface BPReading {
  id: string;
  at: string; // ISO time
  sys: number;
  dia: number;
  pulse?: number;
}

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  kind: "scan" | "checkup" | "plan";
  note?: string;
}

export interface BabyName {
  id: string;
  name: string;
  note?: string;
  fav?: boolean;
}

export interface BabyWish {
  id: string;
  from: string;
  text: string;
  date: string;
}

export interface BabyLetter {
  id: string;
  title: string;
  body: string;
  date: string;
}

export interface BabyBook {
  names: BabyName[];
  wishes: BabyWish[];
  letters: BabyLetter[];
}

export type BirthPlan = Record<string, string | string[]>;

export interface PregnancyMoodCheck {
  date: string;
  down: number; // 0-3, last 2 weeks
  interest: number; // 0-3
  anxious: number; // 0-3
  harm: boolean;
}

export interface PregnancyEnded {
  date: string;
  kind: "birth" | "loss";
  dueDate?: string; // so she can undo
  dismissed?: boolean; // she's ready to move on from the support page
}

export interface PregnancyExtras {
  prePregnancyKg?: number;
  bag?: string[]; // packed item ids
  reminders?: Record<string, boolean>;
  moodChecks?: PregnancyMoodCheck[];
  ended?: PregnancyEnded | null;
}

export interface ContractionLog {
  start: number;
  end?: number;
}
