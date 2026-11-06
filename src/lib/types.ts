export type LifeStage =
  | "cycle"
  | "pcos"
  | "ttc"
  | "pregnancy"
  | "postpartum"
  | "menopause"
  | "first-period";

export type Units = "metric" | "imperial";
export type Activity = "low" | "light" | "moderate" | "active";
export type Goal = "feel-better" | "lose" | "maintain" | "gain" | "strength";
export type DietType = "vegetarian" | "eggetarian" | "non-vegetarian" | "vegan" | "jain";
export type Mood =
  | "great"
  | "good"
  | "okay"
  | "low"
  | "stressed"
  | "energetic"
  | "calm"
  | "anxious"
  | "irritable"
  | "overwhelmed";
export type Flow = "spotting" | "light" | "medium" | "heavy";

export interface SafetyFlags {
  pregnant: boolean;
  breastfeeding: boolean;
  medicalCondition: boolean;
  conditions: string[]; // e.g. "thyroid", "diabetes", "other"
  eatingConcerns: boolean;
}

export interface Profile {
  name: string;
  country: string; // ISO 3166-1 alpha-2, e.g. "IN"
  units: Units;
  stage: LifeStage;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activity?: Activity;
  goal?: Goal;
  diet?: DietType;
  cycleLength: number;
  periodLength: number;
  companionName: string;
  dueDate?: string; // YYYY-MM-DD
  babyBirthDate?: string; // YYYY-MM-DD
  safety: SafetyFlags;
  createdAt: string;
}

export interface DayLog {
  flow?: Flow;
  symptoms?: string[];
  mood?: Mood;
  energy?: number; // 1-5
  stress?: number; // 1-5
  note?: string;
}

export interface CircleMember {
  id: string;
  name: string;
  relation: string;
  phone?: string; // with country code, digits and +
  token?: string;
  secret?: string;
  shares: string[];
  paused?: boolean;
  status: "not-shared" | "waiting" | "synced";
  addedAt: string;
}

export interface ProfileData {
  profile: Profile | null;
  periodStarts: string[];
  dayLogs: Record<string, DayLog>;
  quickCheckins: Record<string, boolean>;
  water: Record<string, number>;
  checklist: Record<string, string[]>;
  weights: Record<string, number>;
  circle: CircleMember[];
}

export interface ProfileMeta {
  id: string;
  name: string;
  relation?: string;
  stage: LifeStage;
}
