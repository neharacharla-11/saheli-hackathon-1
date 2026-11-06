/** Care: contraception, screenings, breast self-checks and the pain diary. */

export type MethodId =
  | "combined"
  | "mini"
  | "copper-iud"
  | "hormonal-iud"
  | "implant"
  | "injection"
  | "ring"
  | "patch"
  | "condoms"
  | "none";

export interface Contraception {
  method: MethodId;
  /** Shown in the Doctor summary, e.g. "Combined pill". */
  label?: string;
  pillTime?: string; // "21:00"
  packStart?: string; // the day this pack (or ring / patch cycle) started
  packType?: 21 | 28;
  miniKind?: "desogestrel" | "traditional"; // 12 or 3 hours late counts as missed
  brand?: string; // hormonal IUD
  fittedOn?: string; // coil, implant, or the last injection
  replaceBy?: string;
  setAt?: string;
}

export interface PainLog {
  date: string;
  score: number; // 0-10
  places: string[];
  helped: string[];
  missedDay: boolean;
}
