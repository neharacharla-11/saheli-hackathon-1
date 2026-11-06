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
  // Nourish, Move, Companion (optional so older saved data still loads)
  food?: Record<string, FoodEntry[]>;
  customFoods?: CustomFood[];
  chat?: ChatMessage[];
  grocery?: GroceryItem[];
  groceryPlanAt?: string; // which coach plan last filled the grocery list
  /** Imported from Apple Health or Android health apps. */
  health?: HealthImport;
  dietRequest?: PlanRequest | null;
  workoutRequest?: PlanRequest | null;
  // My stage (see lib/stageTypes.ts)
  bbt?: Record<string, number>; // date -> morning temperature in °C
  opk?: Record<string, import("./stageTypes").OpkResult>; // date -> ovulation test
  baby?: import("./stageTypes").BabyCare;
  menoScores?: import("./stageTypes").MenoScore[];
  postpartumChecks?: import("./stageTypes").PostpartumCheck[];
  periodStarts: string[];
  dayLogs: Record<string, DayLog>;
  quickCheckins: Record<string, boolean>;
  water: Record<string, number>;
  checklist: Record<string, string[]>;
  weights: Record<string, number>;
  // Mind (optional so older saved data still loads)
  pmdd?: import("./mindTypes").PmddCheck[];
  suggestions?: import("./settingsTypes").Suggestion[];
  // Pregnancy (optional so older saved data still loads)
  kicks?: import("./pregnancyTypes").KickSession[];
  bp?: import("./pregnancyTypes").BPReading[];
  pregWeights?: Record<string, number>;
  appointments?: import("./pregnancyTypes").Appointment[];
  babyBook?: import("./pregnancyTypes").BabyBook;
  birthPlan?: import("./pregnancyTypes").BirthPlan;
  contractions?: import("./pregnancyTypes").ContractionLog[];
  pregnancy?: import("./pregnancyTypes").PregnancyExtras;
  circle: CircleMember[];
  /** Lab reports, values in Saheli's units (see lib/labTests.ts). */
  reports?: LabReport[];
  /** Let her coach see report values when she asks for a plan. */
  shareReportsWithCoach?: boolean;
}

export interface ProfileMeta {
  id: string;
  name: string;
  relation?: string;
  stage: LifeStage;
}

/* ---------- Nourish, Move, Companion and coach plans ---------- */

export type MealSlot = "breakfast" | "lunch" | "snack" | "dinner";

export interface FoodEntry {
  id: string;
  foodId?: string;
  name: string;
  portion: string; // e.g. "1 roti (40 g)"
  qty: number;
  kcal: number; // totals for qty
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  meal: MealSlot;
  at: string; // ISO time
  source?: "list" | "own" | "usda" | "photo" | "plan";
}

export interface CustomFood {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  group?: string;
  done: boolean;
  fromPlan?: boolean;
}

export interface PlanMeal {
  slot: string; // "Early morning", "Breakfast" or a day name for workouts
  title?: string;
  items: string;
}

export interface CoachPlan {
  intro: string;
  meals: PlanMeal[]; // meal by meal (diet) or day by day (workout)
  writtenAt: string;
}

export type PlanStatus = "waiting" | "ready" | "changes";

export interface PlanRequest {
  kind: "diet" | "workout";
  token?: string; // server token, absent for sample or offline plans
  secret?: string;
  sentAt: string;
  status: PlanStatus;
  details: PlanRequestDetails;
  coachNote?: string; // when Neha asks for changes
  plan?: CoachPlan;
  seen?: boolean;
  checkedAt?: string;
}

export interface PlanRequestDetails {
  name: string;
  goals: string[];
  mealsPerDay?: number;
  daysPerWeek?: number;
  place?: string; // workouts: Home, Gym, Both
  cuisine?: string;
  allergies?: string;
  dislikes?: string;
  routine?: string;
  notes?: string;
  shareNumbers: boolean;
  numbers?: {
    age?: number;
    heightCm?: number;
    weightKg?: number;
    activity?: string;
    stage?: string;
    diet?: string;
    phase?: string;
    country?: string;
  };
}

export interface OtherResult {
  name: string;
  value: string;
  unit?: string;
  range?: string;
}

export interface LabReport {
  id: string;
  date: string; // test date, YYYY-MM-DD
  lab?: string;
  /** Known tests by key (LabKey), converted to our units. */
  values: Record<string, number>;
  /** Everything else on the report, as printed. */
  other: OtherResult[];
  /** File kept in IndexedDB on her phone. */
  fileId?: string;
  fileName?: string;
  fileType?: string;
  source: "upload" | "typed" | "sample";
  addedAt: string;
}

export interface HealthImport {
  source?: string; // "Apple Health", "Health Connect"
  steps?: Record<string, number>; // date -> steps
  sleepMin?: Record<string, number>; // date -> minutes asleep
  weight?: Record<string, number>; // date -> kg
  importedAt?: string;
}
