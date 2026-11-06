/**
 * Shared between the report-reading API route and the client:
 * the tool schema Claude fills in, and the clean-up that converts values to our units.
 */
import { LAB_BY_KEY, LAB_KEYS, LAB_TESTS, isLabKey, matchLabName, toOurUnit, type LabKey } from "./labTests";

export const REPORT_TOOL_NAME = "save_report_values";

export const REPORT_TOOL = {
  name: REPORT_TOOL_NAME,
  description:
    "Save every result printed on a blood or lab report. Call this exactly once with all results, the test date and the lab name.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["is_lab_report", "test_date", "lab_name", "results"],
    properties: {
      is_lab_report: { type: "boolean", description: "False if this isn't a medical lab report at all." },
      test_date: {
        type: ["string", "null"],
        description: "Date the sample was collected (or the report date), as YYYY-MM-DD. Null if not printed.",
      },
      lab_name: { type: ["string", "null"], description: "Name of the lab or hospital. Null if not printed." },
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "key", "value", "unit", "value_in_saheli_unit", "range"],
          properties: {
            name: { type: "string", description: "Test name exactly as printed." },
            key: {
              type: "string",
              enum: [...LAB_KEYS, "other"],
              description: "Which known test this is, or 'other'.",
            },
            value: { type: "string", description: "Result exactly as printed, e.g. '9.9' or 'Positive'." },
            unit: { type: ["string", "null"], description: "Unit exactly as printed." },
            value_in_saheli_unit: {
              type: ["number", "null"],
              description: "For known tests only: the value converted to the unit listed for that key. Null for 'other'.",
            },
            range: { type: ["string", "null"], description: "Reference range as printed." },
          },
        },
      },
    },
  },
};

export function reportSystemPrompt(): string {
  const table = LAB_TESTS.map((t) => `- ${t.key}: ${t.name} (in ${t.unit}; also printed as ${t.aliases.slice(0, 3).join(", ")})`).join("\n");
  return `You read women's blood and lab reports for Saheli, a wellness app. Read the attached report carefully and call the ${REPORT_TOOL_NAME} tool once with every result you can see. Always respond by calling the tool, never with plain text.

Known tests and the unit Saheli stores them in:
${table}

Rules:
- Copy names, values, units and ranges exactly as printed. Never guess a number you can't read; leave that result out.
- For known tests set "key" and convert the value into the unit above in "value_in_saheli_unit" (for example vitamin D 50 nmol/L is 20 ng/mL; platelets 2.5 lakh/cumm is 250 ×10³/µL; HbA1c 53 mmol/mol is 7.0 %).
- Haemoglobin (Hb) is not HbA1c. Total cholesterol is not HDL or LDL. Use "other" for anything not in the list (MCV, free T4, urine tests, blood group and so on).
- If a test appears more than once, use the most recent value.
- Dates as YYYY-MM-DD. Prefer the sample collection date.
- If the file isn't a lab report, set is_lab_report to false and results to an empty list.`;
}

/* ---------------- Clean-up ---------------- */

export interface RawResult {
  name?: unknown;
  key?: unknown;
  value?: unknown;
  unit?: unknown;
  value_in_saheli_unit?: unknown;
  range?: unknown;
}

export interface RawReport {
  is_lab_report?: unknown;
  test_date?: unknown;
  lab_name?: unknown;
  results?: unknown;
}

export interface ReadValue {
  key: LabKey;
  name: string;
  value: number;
  /** As printed on the report, for her to check. */
  printed: string;
  /** True when we converted from another unit. */
  converted: boolean;
}

export interface ReadOther {
  name: string;
  value: string;
  unit?: string;
  range?: string;
}

export interface ReadReport {
  isLabReport: boolean;
  testDate: string | null;
  lab: string | null;
  values: ReadValue[];
  other: ReadOther[];
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : typeof v === "number" ? String(v) : "";
}

function parseNumber(s: string): number | undefined {
  const m = s.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function validDate(s: string): string | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1990 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return s;
}

/** Is the converted value believable for this test? Guards against misread units. */
function plausible(key: LabKey, v: number): boolean {
  const [, hi] = LAB_BY_KEY[key].range;
  return v >= 0 && v <= Math.max(hi * 20, 50);
}

/** Turn Claude's tool input into values in our units. Unknown or unreadable values go to "other". */
export function cleanReport(raw: RawReport): ReadReport {
  const out: ReadReport = {
    isLabReport: raw.is_lab_report !== false,
    testDate: validDate(str(raw.test_date)),
    lab: str(raw.lab_name, 120) || null,
    values: [],
    other: [],
  };
  const seen = new Set<LabKey>();
  const results = Array.isArray(raw.results) ? (raw.results as RawResult[]).slice(0, 200) : [];
  for (const r of results) {
    const name = str(r.name, 120);
    const printed = str(r.value, 60);
    const unit = str(r.unit, 40);
    const range = str(r.range, 80);
    if (!name || !printed) continue;
    const keyRaw = str(r.key, 40);
    const key: LabKey | undefined = isLabKey(keyRaw) ? keyRaw : keyRaw === "other" ? undefined : matchLabName(name);
    const num = parseNumber(printed);
    let value: number | undefined;
    let converted = false;
    if (key && num !== undefined) {
      const ours = toOurUnit(key, num, unit);
      if (ours !== undefined) {
        value = ours;
        converted = !!unit && Math.abs(ours - num) > 1e-9;
      } else if (typeof r.value_in_saheli_unit === "number" && Number.isFinite(r.value_in_saheli_unit)) {
        value = r.value_in_saheli_unit;
        converted = true;
      }
    }
    if (key && value !== undefined && plausible(key, value) && !seen.has(key)) {
      seen.add(key);
      const d = LAB_BY_KEY[key].decimals;
      out.values.push({ key, name: LAB_BY_KEY[key].name, value: Number(value.toFixed(Math.max(d, 1))), printed: unit ? `${printed} ${unit}` : printed, converted });
    } else {
      out.other.push({ name, value: printed, ...(unit ? { unit } : {}), ...(range ? { range } : {}) });
    }
  }
  return out;
}
