/**
 * The blood tests Saheli understands: our unit, usual adult female range,
 * plain-language meaning, and food and movement advice for low and high values.
 * Ranges are general guides; her lab's own range always wins.
 */

export type LabKey =
  | "haemoglobin"
  | "ferritin"
  | "vitaminD"
  | "b12"
  | "folate"
  | "tsh"
  | "fastingSugar"
  | "hba1c"
  | "fastingInsulin"
  | "cholesterol"
  | "hdl"
  | "ldl"
  | "triglycerides"
  | "calcium"
  | "platelets"
  | "wbc"
  | "lh"
  | "fsh"
  | "testosterone"
  | "prolactin"
  | "amh"
  | "crp";

export interface Advice {
  means: string;
  food: string;
  move: string;
}

export interface LabTest {
  key: LabKey;
  name: string;
  /** Our unit. Every stored value is in this unit. */
  unit: string;
  /** Usual range [low, high]. */
  range: [number, number];
  /** Between borderHigh's lower edge (range[1]) and this value counts as "a little high". */
  borderHigh?: number;
  /** Between this value and range[0] counts as "a little low". */
  borderLow?: number;
  /** A value above the range is fine (HDL). */
  highIsFine?: boolean;
  decimals: number;
  /** Names a lab might print. Lowercase. */
  aliases: string[];
  /** Other units a lab might use, with a factor to convert into ours (value * factor). */
  convert?: Record<string, number>;
  what: string;
  low?: Advice;
  high?: Advice;
}

export const LAB_TESTS: LabTest[] = [
  {
    key: "haemoglobin", name: "Haemoglobin", unit: "g/dL", range: [12, 15.5], borderLow: 11, decimals: 1,
    aliases: ["haemoglobin", "hemoglobin", "hb", "hgb"],
    convert: { "g/l": 0.1, "mmol/l": 1.611 },
    what: "The part of your red blood cells that carries oxygen around your body.",
    low: {
      means: "Your blood is carrying less oxygen than it could. This is called anaemia and often shows up as tiredness, breathlessness on stairs or feeling cold.",
      food: "Eat iron foods every day: dals, rajma, chana, spinach, beetroot, dates, jaggery, eggs or meat if you eat them. Add lemon or amla to the same meal, and keep tea and coffee an hour away from food.",
      move: "Keep movement gentle until your levels rise: walks, yoga and stretching. Stop and rest if you feel dizzy or breathless.",
    },
    high: {
      means: "Slightly high haemoglobin is often from not drinking enough water, smoking or living at altitude.",
      food: "Drink water through the day, and go easy on iron supplements unless your doctor asked you to take them.",
      move: "Move as usual and drink more water on active days.",
    },
  },
  {
    key: "ferritin", name: "Ferritin", unit: "ng/mL", range: [15, 150], borderLow: 30, decimals: 0,
    aliases: ["ferritin", "serum ferritin"],
    convert: { "µg/l": 1, "ug/l": 1, "mcg/l": 1, "pmol/l": 0.445 },
    what: "Your body's iron savings. It drops before haemoglobin does, so it shows low iron early.",
    low: {
      means: "Your iron stores are running low. Heavy periods are the most common reason. It can cause tiredness, hair fall and poor sleep even when haemoglobin looks fine.",
      food: "Build meals around iron: poha with peanuts and lemon, palak dal, chana chaat, ragi, sesame (til) chikki, eggs, fish or chicken. Vitamin C in the same meal helps you absorb it.",
      move: "Gentle to moderate exercise is fine. Strength work twice a week helps your energy once your iron is coming up.",
    },
    high: {
      means: "High ferritin can come with inflammation, an infection or, less often, too much iron. Your doctor may want to look into it.",
      food: "Skip iron supplements unless prescribed. Eat plenty of vegetables, whole grains and fruit.",
      move: "Regular moderate movement helps lower inflammation.",
    },
  },
  {
    key: "vitaminD", name: "Vitamin D", unit: "ng/mL", range: [30, 100], borderLow: 20, decimals: 0,
    aliases: ["vitamin d", "vit d", "25-oh vitamin d", "25 hydroxy vitamin d", "25(oh)d", "vitamin d3", "vitamin d total"],
    convert: { "nmol/l": 0.4006 },
    what: "Helps you absorb calcium, keeps bones strong and supports mood and immunity.",
    low: {
      means: "Low vitamin D is very common, especially with indoor work. It can cause body aches, tiredness and low moods, and weakens bones over time.",
      food: "Eat eggs, oily fish, mushrooms left in the sun, and fortified milk or curd. Most women with low levels need a supplement: ask your doctor about the dose.",
      move: "Take a 15 to 20 minute walk in morning sun with arms uncovered. Strength exercises help your bones use calcium.",
    },
    high: {
      means: "Very high vitamin D usually comes from taking strong supplements for a long time.",
      food: "Pause vitamin D supplements and ask your doctor before taking more.",
      move: "Move as usual.",
    },
  },
  {
    key: "b12", name: "Vitamin B12", unit: "pg/mL", range: [200, 900], borderLow: 300, decimals: 0,
    aliases: ["vitamin b12", "b12", "cobalamin", "cyanocobalamin", "vit b12"],
    convert: { "pmol/l": 1.355, "ng/l": 1 },
    what: "Keeps your nerves and blood healthy and helps turn food into energy.",
    low: {
      means: "Low B12 is common if you eat little or no meat. It can cause tiredness, tingling in hands or feet, low moods and poor memory.",
      food: "Eat dairy (curd, paneer, milk), eggs, fish or chicken if you eat them. Vegetarians and vegans usually need a B12 supplement or fortified foods.",
      move: "Gentle movement is fine. If you have tingling or poor balance, choose seated or supported exercises until it's treated.",
    },
    high: {
      means: "High B12 is usually from supplements and is rarely a problem on its own.",
      food: "No change needed unless your doctor says so.",
      move: "Move as usual.",
    },
  },
  {
    key: "folate", name: "Folate", unit: "ng/mL", range: [4, 20], decimals: 1,
    aliases: ["folate", "folic acid", "serum folate", "vitamin b9"],
    convert: { "nmol/l": 0.441, "µg/l": 1, "ug/l": 1 },
    what: "A B vitamin your body needs to make new cells. Very important before and in early pregnancy.",
    low: {
      means: "Low folate can cause tiredness and a type of anaemia. If you might get pregnant, it matters for your baby's spine and brain.",
      food: "Eat leafy greens (palak, methi), dals, chickpeas, oranges and fortified cereals. If you're trying to conceive, take a daily folic acid supplement.",
      move: "Move as usual.",
    },
    high: {
      means: "High folate is usually from supplements and isn't a worry on its own.",
      food: "No change needed. Make sure your B12 is checked too.",
      move: "Move as usual.",
    },
  },
  {
    key: "tsh", name: "TSH (thyroid)", unit: "mIU/L", range: [0.4, 4], borderHigh: 10, decimals: 2,
    aliases: ["tsh", "thyroid stimulating hormone", "ultrasensitive tsh", "thyrotropin"],
    convert: { "µiu/ml": 1, "uiu/ml": 1, "miu/ml": 1000 },
    what: "The signal your brain sends to your thyroid. High TSH usually means the thyroid is slow; low TSH can mean it's overactive.",
    low: {
      means: "Your thyroid may be working too hard. This can cause a racing heart, weight loss, anxiety and lighter periods.",
      food: "Eat regular balanced meals with enough protein and calcium. Avoid kelp and high-iodine supplements unless prescribed.",
      move: "Keep exercise gentle to moderate until it's treated. Stop if your heart races.",
    },
    high: {
      means: "Your thyroid may be running slow (hypothyroid). This can cause tiredness, weight gain, hair fall, feeling cold and heavier periods.",
      food: "Use iodised salt, eat eggs, dairy, nuts and seeds (a Brazil nut or pumpkin seeds for selenium). If you take thyroid medicine, take it on an empty stomach, 30 to 60 minutes before tea or breakfast.",
      move: "Regular walking and strength work help your energy and metabolism. Build up slowly.",
    },
  },
  {
    key: "fastingSugar", name: "Fasting sugar", unit: "mg/dL", range: [70, 99], borderHigh: 125, decimals: 0,
    aliases: ["fasting blood sugar", "fasting glucose", "fbs", "fpg", "glucose fasting", "blood sugar fasting", "fasting plasma glucose"],
    convert: { "mmol/l": 18 },
    what: "Your blood sugar after 8 or more hours without food.",
    low: {
      means: "Low fasting sugar can cause shakiness, sweating and dizziness. If it happens often, tell your doctor.",
      food: "Don't skip meals. Keep a small snack (fruit, nuts, a glass of milk) close by.",
      move: "Eat something before you exercise.",
    },
    high: {
      means: "Your body is finding it harder to handle sugar. 100 to 125 is called prediabetes and can often be turned around; 126 or more needs your doctor.",
      food: "Fill half your plate with vegetables, a quarter with protein (dal, paneer, eggs, fish), and keep rice or roti to a quarter. Choose millets, brown rice and whole fruit over juice and sweets.",
      move: "Walk for 10 to 15 minutes after each main meal, and add strength exercises twice a week.",
    },
  },
  {
    key: "hba1c", name: "HbA1c", unit: "%", range: [4, 5.6], borderHigh: 6.4, decimals: 1,
    aliases: ["hba1c", "glycated haemoglobin", "glycated hemoglobin", "glycosylated hemoglobin", "a1c"],
    convert: { "mmol/mol": 0.0915 },
    what: "Your average blood sugar over the last 2 to 3 months.",
    low: {
      means: "A low HbA1c is uncommon and can happen with anaemia. Your doctor can explain it.",
      food: "Eat regular balanced meals.",
      move: "Move as usual.",
    },
    high: {
      means: "Your sugar has been running high on average. 5.7 to 6.4 is prediabetes; 6.5 or more is in the diabetes range and needs your doctor's care.",
      food: "Pick low-GI foods: millets, dals, vegetables, whole fruit, nuts. Pair any carbs with protein, and keep sweets and sweet drinks for small treats.",
      move: "A short walk after meals lowers sugar quickly. Aim for 150 minutes of movement a week plus 2 strength sessions.",
    },
  },
  {
    key: "fastingInsulin", name: "Fasting insulin", unit: "µIU/mL", range: [2, 15], borderHigh: 25, decimals: 1,
    aliases: ["fasting insulin", "insulin fasting", "serum insulin", "insulin"],
    convert: { "pmol/l": 0.144, "mu/l": 1, "miu/l": 1 },
    what: "The hormone that moves sugar into your cells. High fasting insulin can be an early sign of insulin resistance, common with PCOS.",
    low: {
      means: "Low fasting insulin with normal sugar is usually fine.",
      food: "Eat regular balanced meals.",
      move: "Move as usual.",
    },
    high: {
      means: "Your body is making extra insulin to keep sugar steady. This is called insulin resistance and is common with PCOS. Food and movement help a lot.",
      food: "Start meals with vegetables and protein, choose millets and dals over white rice and maida, add cinnamon and methi seeds, and avoid sweet drinks.",
      move: "Strength training builds muscle that soaks up sugar. Walk after meals.",
    },
  },
  {
    key: "cholesterol", name: "Total cholesterol", unit: "mg/dL", range: [100, 199], borderHigh: 239, decimals: 0,
    aliases: ["total cholesterol", "cholesterol", "serum cholesterol", "cholesterol total"],
    convert: { "mmol/l": 38.67 },
    what: "All the cholesterol in your blood: the helpful HDL and the less helpful LDL together.",
    low: {
      means: "Low total cholesterol is rarely a problem.",
      food: "Eat regular balanced meals with some healthy fats.",
      move: "Move as usual.",
    },
    high: {
      means: "Higher cholesterol raises the risk of heart disease over time, especially after menopause.",
      food: "Eat oats, dals, nuts, flaxseed, fruit and vegetables. Cook with less ghee and butter, and cut back on fried snacks and bakery food.",
      move: "Brisk walking, cycling or dancing for 30 minutes most days.",
    },
  },
  {
    key: "hdl", name: "HDL (good cholesterol)", unit: "mg/dL", range: [50, 90], highIsFine: true, decimals: 0,
    aliases: ["hdl", "hdl cholesterol", "hdl-c", "high density lipoprotein"],
    convert: { "mmol/l": 38.67 },
    what: "The cholesterol that clears fat from your blood vessels. Higher is better.",
    low: {
      means: "Low HDL means less protection for your heart.",
      food: "Add healthy fats: nuts, seeds, olive or mustard oil, avocado, oily fish. Cut back on sugar and fried food.",
      move: "Regular cardio raises HDL: brisk walks, swimming, dancing.",
    },
  },
  {
    key: "ldl", name: "LDL cholesterol", unit: "mg/dL", range: [0, 129], borderHigh: 159, decimals: 0,
    aliases: ["ldl", "ldl cholesterol", "ldl-c", "low density lipoprotein", "ldl direct"],
    convert: { "mmol/l": 38.67 },
    what: "The cholesterol that can build up in blood vessels. Lower is better.",
    high: {
      means: "Higher LDL can slowly narrow blood vessels and raise heart risk.",
      food: "Eat oats, barley, dals, beans, flaxseed, nuts and plenty of vegetables. Limit fried food, red meat, butter and bakery items.",
      move: "Aim for 150 minutes of moderate movement a week.",
    },
  },
  {
    key: "triglycerides", name: "Triglycerides", unit: "mg/dL", range: [0, 149], borderHigh: 199, decimals: 0,
    aliases: ["triglycerides", "tg", "triglyceride", "serum triglycerides"],
    convert: { "mmol/l": 88.57 },
    what: "Fat in your blood that comes from food, especially sugar and refined carbs.",
    high: {
      means: "High triglycerides often come with high sugar or insulin resistance and raise heart risk.",
      food: "Cut back on sweets, sweet drinks, white rice and maida. Add fish, flaxseed and walnuts.",
      move: "Walk after meals and stay active most days.",
    },
  },
  {
    key: "calcium", name: "Calcium", unit: "mg/dL", range: [8.6, 10.3], decimals: 1,
    aliases: ["calcium", "serum calcium", "total calcium", "ca"],
    convert: { "mmol/l": 4.008 },
    what: "Keeps bones strong and helps muscles and nerves work.",
    low: {
      means: "Low calcium can come with low vitamin D and can cause cramps and weaker bones.",
      food: "Eat curd, milk, paneer, ragi, sesame seeds, almonds and green leafy vegetables. Get your vitamin D checked too.",
      move: "Weight-bearing exercise (walking, stairs, strength work) helps your bones keep calcium.",
    },
    high: {
      means: "High calcium needs a doctor to find the reason.",
      food: "Drink plenty of water and pause calcium supplements until you've talked to your doctor.",
      move: "Move as usual.",
    },
  },
  {
    key: "platelets", name: "Platelets", unit: "×10³/µL", range: [150, 410], decimals: 0,
    aliases: ["platelets", "platelet count", "plt"],
    convert: { "lakh/cumm": 100, "lakhs/cumm": 100, "/µl": 0.001, "/ul": 0.001, "cells/cumm": 0.001, "10^9/l": 1, "x10^9/l": 1 },
    what: "Tiny cells that help your blood clot.",
    low: {
      means: "Low platelets can cause easy bruising or heavier periods. Your doctor should look into it.",
      food: "Eat a balanced diet with leafy greens, fruit and enough protein.",
      move: "Avoid contact sports and heavy lifting until your doctor says it's fine.",
    },
    high: {
      means: "High platelets can come with low iron or inflammation.",
      food: "Eat iron-rich foods and plenty of vegetables.",
      move: "Move as usual and stay hydrated.",
    },
  },
  {
    key: "wbc", name: "White blood cells", unit: "×10³/µL", range: [4, 11], decimals: 1,
    aliases: ["wbc", "white blood cells", "total leucocyte count", "tlc", "total wbc count", "leukocytes"],
    convert: { "/µl": 0.001, "/ul": 0.001, "cells/cumm": 0.001, "10^9/l": 1, "x10^9/l": 1 },
    what: "Your infection-fighting cells.",
    low: {
      means: "Low white cells can make infections more likely. Your doctor may repeat the test.",
      food: "Eat enough protein and a variety of fruit and vegetables.",
      move: "Gentle movement, and rest well.",
    },
    high: {
      means: "High white cells usually mean your body is fighting an infection or inflammation.",
      food: "Rest, drink fluids and eat light, nourishing food.",
      move: "Rest until you feel better.",
    },
  },
  {
    key: "lh", name: "LH", unit: "mIU/mL", range: [2, 13], decimals: 1,
    aliases: ["lh", "luteinizing hormone", "luteinising hormone"],
    convert: { "iu/l": 1, "miu/l": 0.001 },
    what: "A hormone that triggers ovulation. It changes through your cycle, so the day of the test matters.",
    low: {
      means: "Low LH can come with stress, low body weight or very hard exercise, and can make periods stop.",
      food: "Eat enough: regular meals with carbs, protein and healthy fats.",
      move: "If you train hard, add rest days and ease off for a while.",
    },
    high: {
      means: "High LH outside ovulation can come with PCOS (often LH is more than twice FSH) or with perimenopause.",
      food: "Insulin-friendly meals help PCOS hormones: protein and vegetables first, millets over white rice.",
      move: "Mix strength training with walking most days.",
    },
  },
  {
    key: "fsh", name: "FSH", unit: "mIU/mL", range: [3, 10], decimals: 1,
    aliases: ["fsh", "follicle stimulating hormone"],
    convert: { "iu/l": 1, "miu/l": 0.001 },
    what: "A hormone that grows the eggs in your ovaries. It rises naturally as you approach menopause.",
    low: {
      means: "Low FSH can come with stress, low weight or PCOS.",
      food: "Eat regular, balanced meals.",
      move: "Balance training with rest.",
    },
    high: {
      means: "High FSH often means your ovaries are slowing down, which is expected around perimenopause.",
      food: "Focus on calcium, vitamin D and protein for your bones and muscles.",
      move: "Strength training 2 to 3 times a week protects bones and muscles.",
    },
  },
  {
    key: "testosterone", name: "Testosterone", unit: "ng/dL", range: [15, 70], decimals: 0,
    aliases: ["testosterone", "total testosterone", "serum testosterone"],
    convert: { "nmol/l": 28.84, "ng/ml": 100 },
    what: "Women make small amounts. Higher levels can cause acne, extra hair and irregular periods.",
    low: {
      means: "Low testosterone is common after menopause and can lower energy and desire.",
      food: "Eat enough protein and healthy fats.",
      move: "Strength training helps.",
    },
    high: {
      means: "Higher testosterone is common with PCOS and can cause acne, hair fall from the scalp and extra facial hair.",
      food: "Lower insulin helps lower testosterone: protein at every meal, millets and dals, less sugar. Spearmint tea and flaxseed may help.",
      move: "Strength training and walking most days.",
    },
  },
  {
    key: "prolactin", name: "Prolactin", unit: "ng/mL", range: [4, 25], decimals: 1,
    aliases: ["prolactin", "prl", "serum prolactin"],
    convert: { "miu/l": 0.0472, "µg/l": 1, "ug/l": 1 },
    what: "The hormone that makes breast milk. Outside breastfeeding it should be low.",
    low: {
      means: "Low prolactin is rarely a problem.",
      food: "No change needed.",
      move: "Move as usual.",
    },
    high: {
      means: "High prolactin can come with stress, some medicines or the thyroid, and can make periods irregular. Your doctor may repeat it.",
      food: "Eat regular balanced meals.",
      move: "Calming movement like yoga and walks may help.",
    },
  },
  {
    key: "amh", name: "AMH", unit: "ng/mL", range: [1, 4], decimals: 2,
    aliases: ["amh", "anti mullerian hormone", "anti-mullerian hormone", "anti-müllerian hormone"],
    convert: { "pmol/l": 0.14 },
    what: "A rough guide to how many eggs your ovaries hold. It falls with age and doesn't predict whether you can get pregnant on its own.",
    low: {
      means: "A lower egg count for your age. It's worth talking to a fertility doctor if you're planning a baby.",
      food: "Eat a varied diet with good protein, healthy fats and folate.",
      move: "Regular moderate movement.",
    },
    high: {
      means: "High AMH often comes with PCOS, where the ovaries have many small follicles.",
      food: "Insulin-friendly meals help PCOS.",
      move: "Strength training and walks most days.",
    },
  },
  {
    key: "crp", name: "CRP", unit: "mg/L", range: [0, 5], decimals: 1,
    aliases: ["crp", "c-reactive protein", "c reactive protein", "hs-crp", "hscrp"],
    convert: { "mg/dl": 10 },
    what: "A sign of inflammation in your body.",
    high: {
      means: "Your body is dealing with inflammation, from an infection, an injury or a longer-term condition.",
      food: "Eat colourful vegetables, fruit, turmeric, nuts, seeds and oily fish. Cut back on fried and sugary food.",
      move: "Rest if you're unwell. Otherwise gentle, regular movement lowers inflammation.",
    },
  },
];

export const LAB_BY_KEY: Record<LabKey, LabTest> = Object.fromEntries(LAB_TESTS.map((t) => [t.key, t])) as Record<
  LabKey,
  LabTest
>;

export const LAB_KEYS = LAB_TESTS.map((t) => t.key);

export function isLabKey(k: string): k is LabKey {
  return k in LAB_BY_KEY;
}

/* ---------------- Status ---------------- */

export type LabStatus = "low" | "a-little-low" | "normal" | "a-little-high" | "high";

export function labStatus(key: LabKey, value: number): LabStatus {
  const t = LAB_BY_KEY[key];
  const [lo, hi] = t.range;
  if (value < lo) {
    if (t.borderLow !== undefined && t.borderLow < lo) return value >= t.borderLow ? "a-little-low" : "low";
    return "low";
  }
  if (t.borderLow !== undefined && t.borderLow > lo && value < t.borderLow) return "a-little-low";
  if (value > hi) {
    if (t.highIsFine) return "normal";
    if (t.borderHigh !== undefined) return value <= t.borderHigh ? "a-little-high" : "high";
    return "high";
  }
  return "normal";
}

export const STATUS_LABEL: Record<LabStatus, string> = {
  low: "Low",
  "a-little-low": "A little low",
  normal: "In range",
  "a-little-high": "A little high",
  high: "High",
};

export function isOutOfRange(s: LabStatus) {
  return s !== "normal";
}

export function isLowSide(s: LabStatus) {
  return s === "low" || s === "a-little-low";
}

export function adviceFor(key: LabKey, value: number): Advice | undefined {
  const s = labStatus(key, value);
  if (s === "normal") return undefined;
  const t = LAB_BY_KEY[key];
  return isLowSide(s) ? t.low : t.high;
}

export function formatValue(key: LabKey, value: number): string {
  const d = LAB_BY_KEY[key].decimals;
  return Number(value.toFixed(d)).toLocaleString("en-US", { maximumFractionDigits: d });
}

export function rangeText(key: LabKey): string {
  const t = LAB_BY_KEY[key];
  const [lo, hi] = t.range;
  if (lo === 0) return `under ${formatValue(key, hi + (t.decimals ? 0 : 1))} ${t.unit}`;
  if (t.highIsFine) return `${formatValue(key, lo)} or more ${t.unit}`;
  return `${formatValue(key, lo)} to ${formatValue(key, hi)} ${t.unit}`;
}

/* ---------------- Names and units ---------------- */

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[._,:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Match a printed test name to one we know. */
export function matchLabName(name: string): LabKey | undefined {
  const n = norm(name);
  if (!n) return undefined;
  for (const t of LAB_TESTS) if (t.key.toLowerCase() === n || t.aliases.includes(n)) return t.key;
  // Loose match: longest alias contained in the name (avoids "hb" matching "hba1c").
  let best: { key: LabKey; len: number } | undefined;
  for (const t of LAB_TESTS) {
    for (const a of t.aliases) {
      if (a.length < 3) continue;
      const re = new RegExp(`(^|[^a-z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`);
      if (re.test(n) && (!best || a.length > best.len)) best = { key: t.key, len: a.length };
    }
  }
  return best?.key;
}

function normUnit(u: string) {
  return u.toLowerCase().replace(/\s+/g, "").replace("μ", "µ").replace("mcg", "µg").replace("micro", "µ");
}

/**
 * Convert a value to our unit. Returns undefined if the unit is unknown.
 * An empty unit is taken as already ours.
 */
export function toOurUnit(key: LabKey, value: number, unit?: string): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  const t = LAB_BY_KEY[key];
  if (!unit || !unit.trim()) return value;
  const u = normUnit(unit);
  const ours = normUnit(t.unit);
  if (u === ours) return value;
  // Common spellings of our own unit.
  const same: Record<string, string[]> = {
    "×10³/µl": ["10^3/µl", "x10^3/µl", "10³/µl", "x10³/µl", "k/µl", "thou/µl", "10^3/ul", "x10^3/ul", "k/ul", "thou/ul", "10*3/ul"],
    "µiu/ml": ["uiu/ml", "miu/l", "mu/l"],
    "miu/l": ["µiu/ml", "uiu/ml"],
    "ng/ml": ["µg/l", "ug/l"],
    "g/dl": ["gm/dl", "gms/dl", "gm%", "g%"],
    "mg/dl": ["mg%"],
  };
  if (same[ours]?.includes(u)) return value;
  if (key === "hba1c" && u === "mmol/mol") return value * 0.0915 + 2.15;
  for (const [k, f] of Object.entries(t.convert ?? {})) {
    if (normUnit(k) === u) return value * f;
  }
  return undefined;
}

/* ---------------- Reports, latest values and trends ---------------- */

export interface ReportLike {
  id: string;
  date: string; // YYYY-MM-DD
  values: Partial<Record<LabKey, number>>;
}

export interface LatestResult {
  key: LabKey;
  value: number;
  date: string;
  reportId: string;
  status: LabStatus;
  /** Older values, newest first. */
  history: { value: number; date: string }[];
}

/** The newest value for each test, with its history. */
export function latestResults(reports: ReportLike[]): LatestResult[] {
  const sorted = [...reports].sort((a, b) => (a.date < b.date ? 1 : -1));
  const out = new Map<LabKey, LatestResult>();
  for (const r of sorted) {
    for (const [k, v] of Object.entries(r.values)) {
      if (!isLabKey(k) || typeof v !== "number" || !Number.isFinite(v)) continue;
      const cur = out.get(k);
      if (!cur) out.set(k, { key: k, value: v, date: r.date, reportId: r.id, status: labStatus(k, v), history: [] });
      else cur.history.push({ value: v, date: r.date });
    }
  }
  return LAB_TESTS.map((t) => out.get(t.key)).filter((x): x is LatestResult => !!x);
}

export type TrendDirection = "better" | "worse" | "steady";

/** How far a value sits outside the usual range (0 inside). */
function distance(key: LabKey, v: number): number {
  const t = LAB_BY_KEY[key];
  const [lo, hi] = t.range;
  if (v < lo) return lo - v;
  if (v > hi && !t.highIsFine) return v - hi;
  return 0;
}

export function trendDirection(key: LabKey, previous: number, latest: number): TrendDirection {
  const t = LAB_BY_KEY[key];
  const span = t.range[1] - t.range[0] || 1;
  if (Math.abs(latest - previous) < span * 0.02) return "steady";
  const d0 = distance(key, previous);
  const d1 = distance(key, latest);
  if (d0 === 0 && d1 === 0) return "steady";
  if (d1 < d0) return "better";
  if (d1 > d0) return "worse";
  return "steady";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** "Up from 9.9 since Jul 2026 · getting better" */
export function trendText(r: LatestResult): string | undefined {
  const prev = r.history[0];
  if (!prev) return undefined;
  const dir = trendDirection(r.key, prev.value, r.value);
  const verb = r.value > prev.value ? "Up" : r.value < prev.value ? "Down" : "Same as";
  const word = dir === "better" ? "getting better" : dir === "worse" ? "worth watching" : "steady";
  const from = verb === "Same as" ? `${verb} ${formatValue(r.key, prev.value)}` : `${verb} from ${formatValue(r.key, prev.value)}`;
  return `${from} since ${monthYear(prev.date)} · ${word}`;
}

/** One line per result, for the Bestie chat context. */
export function reportContextLines(reports: ReportLike[]): string[] {
  return latestResults(reports).map((r) => {
    const t = LAB_BY_KEY[r.key];
    const prev = r.history[0] ? `, previously ${formatValue(r.key, r.history[0].value)} on ${r.history[0].date}` : "";
    return `${t.name}: ${formatValue(r.key, r.value)} ${t.unit} on ${r.date} (${STATUS_LABEL[r.status].toLowerCase()}; usual ${rangeText(r.key)}${prev})`;
  });
}
