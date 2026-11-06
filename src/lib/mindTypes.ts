/* Mind data kept on her device. Optional so older saved data still loads. */

export interface PmddCheck {
  date: string; // YYYY-MM-DD
  answers: number[]; // one per PMDD_QUESTIONS item, 0-3
  interferes: boolean; // gets in the way of work, study or relationships
}
