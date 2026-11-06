import { describe, expect, it } from "vitest";
import { cleanReport } from "./reportParse";

describe("cleanReport", () => {
  it("converts known tests, keeps others, and drops bad dates", () => {
    const r = cleanReport({
      is_lab_report: true,
      test_date: "2026-10-07",
      lab_name: "CityCare Diagnostics",
      results: [
        { name: "Haemoglobin", key: "haemoglobin", value: "11.2", unit: "g/dL", value_in_saheli_unit: 11.2, range: "12-15.5" },
        { name: "Vitamin D 25-OH", key: "vitaminD", value: "55", unit: "nmol/L", value_in_saheli_unit: 22, range: null },
        { name: "Platelet count", key: "platelets", value: "2.6", unit: "lakh/cumm", value_in_saheli_unit: null, range: null },
        { name: "MCV", key: "other", value: "79", unit: "fL", value_in_saheli_unit: null, range: "80-100" },
        { name: "Haemoglobin", key: "haemoglobin", value: "10.1", unit: "g/dL", value_in_saheli_unit: 10.1, range: null },
      ],
    });
    expect(r.testDate).toBe("2026-10-07");
    expect(r.lab).toBe("CityCare Diagnostics");
    expect(r.values.map((v) => v.key)).toEqual(["haemoglobin", "vitaminD", "platelets"]);
    expect(r.values[1].value).toBeCloseTo(22, 0);
    expect(r.values[1].converted).toBe(true);
    expect(r.values[2].value).toBe(260);
    expect(r.other[0]).toEqual({ name: "MCV", value: "79", unit: "fL", range: "80-100" });
    // A duplicate goes to "other" rather than overwriting.
    expect(r.other).toHaveLength(2);
  });

  it("uses Claude's conversion for an unknown unit, and rejects silly values", () => {
    const r = cleanReport({
      test_date: "07/10/2026",
      results: [
        { name: "TSH", key: "tsh", value: "3.1", unit: "weird", value_in_saheli_unit: 3.1 },
        { name: "Ferritin", key: "ferritin", value: "99999", unit: "ng/mL", value_in_saheli_unit: 99999 },
        { name: "Serum B12", key: "nonsense", value: "310", unit: "pg/mL" },
      ],
    });
    expect(r.testDate).toBeNull();
    expect(r.values.find((v) => v.key === "tsh")?.value).toBe(3.1);
    expect(r.values.find((v) => v.key === "ferritin")).toBeUndefined();
    expect(r.values.find((v) => v.key === "b12")?.value).toBe(310);
  });

  it("handles junk input", () => {
    expect(cleanReport({}).values).toEqual([]);
    expect(cleanReport({ results: "nope" }).other).toEqual([]);
  });
});
